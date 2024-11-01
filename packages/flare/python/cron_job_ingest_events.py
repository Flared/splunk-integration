import json
import os
import sys
import time

from datetime import date
from datetime import datetime
from typing import Any
from typing import Optional


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))
import vendor.splunklib.client as client

from constants import APP_NAME
from constants import CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
from constants import HOST
from constants import KV_COLLECTION_NAME
from constants import SPLUNK_PORT
from constants import CollectionKeys
from constants import PasswordKeys
from flare import FlareAPI
from logger import Logger


def main() -> None:
    logger = Logger(class_name=__file__)
    try:
        splunk_service = client.connect(
            host=HOST,
            port=SPLUNK_PORT,
            app=APP_NAME,
            token=sys.stdin.readline().strip(),
        )
    except Exception as e:
        logger.error(str(e))
        raise Exception(str(e))

    app: client.Application = splunk_service.apps[APP_NAME]
    create_collection(app=app)

    # To avoid cron jobs from doing the same work at the same time, exit new cron jobs if a cron job is already doing work
    last_fetched_timestamp = get_last_fetched(app)
    if last_fetched_timestamp and last_fetched_timestamp < (
        datetime.now() - CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
    ):
        logger.debug(
            "Fetched events less than {} minutes ago, exiting".format(
                (CRON_JOB_THRESHOLD_SINCE_LAST_FETCH.seconds) / 60
            )
        )
        return

    api_key: Optional[str] = None
    tenant_id: Optional[int] = None
    for item in app.service.storage_passwords.list():
        if item.content.username == PasswordKeys.API_KEY.value:
            api_key = item.clear_password

        if item.content.username == PasswordKeys.TENANT_ID.value:
            tenant_id = (
                int(item.clear_password) if item.clear_password is not None else None
            )

    if not api_key:
        raise Exception("API key not found")

    if not tenant_id:
        raise Exception("Tenant ID not found")

    try:
        flare_api = FlareAPI(app=app, api_key=api_key, tenant_id=tenant_id)

        next = get_next(app=app, tenant_id=tenant_id)
        start_date = get_start_date(app=app)
        for response in flare_api.retrieve_feed(next=next, start_date=start_date):
            save_last_fetched(app=app)

            # Rate limiting.
            time.sleep(1)

            if response.status_code != 200:
                logger.error(response.text)
                return

            event_feed = response.json()
            save_start_date(app=app, tenant_id=tenant_id)
            save_next(app=app, tenant_id=tenant_id, next=event_feed["next"])

            if event_feed["items"]:
                for item in event_feed["items"]:
                    print(json.dumps(item))
    except Exception as e:
        logger.error("Exception={}".format(e))


def get_next(app: client.Application, tenant_id: int) -> Optional[str]:
    return get_collection_value(
        app=app, key="{}{}".format(CollectionKeys.NEXT_TOKEN.value, tenant_id)
    )


def get_start_date(app: client.Application) -> Optional[str]:
    return get_collection_value(app=app, key=CollectionKeys.START_DATE.value)


def get_current_tenant_id(app: client.Application) -> Optional[int]:
    current_tenant_id = get_collection_value(
        app=app, key=CollectionKeys.CURRENT_TENANT_ID.value
    )
    try:
        return int(current_tenant_id) if current_tenant_id else None
    except Exception:
        pass
    return None


def get_last_fetched(app: client.Application) -> Optional[datetime]:
    timestamp_last_fetched = get_collection_value(
        app=app, key=CollectionKeys.TIMESTAMP_LAST_FETCH.value
    )
    if timestamp_last_fetched:
        try:
            return datetime.fromisoformat(timestamp_last_fetched)
        except Exception:
            pass
    return None


def create_collection(app: client.Application) -> None:
    if KV_COLLECTION_NAME not in app.service.kvstore:
        # Create the collection
        app.service.kvstore.create(
            name=KV_COLLECTION_NAME, fields={"_key": "string", "value": "string"}
        )


def save_start_date(app: client.Application, tenant_id: int) -> None:
    current_tenant_id = get_current_tenant_id(app=app)
    # If this is the first request ever, insert today's date so that future requests will be based on that
    if not get_start_date(app):
        save_collection_value(
            app=app,
            key=CollectionKeys.START_DATE.value,
            value=datetime.today().isoformat(),
        )

    # If the current tenant has changed, update the start date so that future requests will be based off today
    # If you switch tenants, this will avoid the old tenant from ingesting all the events before today and the day
    # that tenant was switched in the first place.
    if current_tenant_id != tenant_id:
        app.service.kvstore[KV_COLLECTION_NAME].data.update(
            id=CollectionKeys.START_DATE.value,
            data=json.dumps({"value": date.today().isoformat()}),
        )


def save_next(app: client.Application, tenant_id: int, next: Optional[str]) -> None:
    # If we have a new next value, update the collection for that tenant to continue searching from that point
    if not next:
        return

    save_collection_value(
        app=app,
        key="{}{}".format(CollectionKeys.NEXT_TOKEN.value, tenant_id),
        value=next,
    )


def save_last_fetched(app: client.Application) -> None:
    save_collection_value(
        app=app,
        key=CollectionKeys.TIMESTAMP_LAST_FETCH.value,
        value=datetime.now().isoformat(),
    )


def get_collection_value(app: client.Application, key: str) -> Optional[str]:
    if KV_COLLECTION_NAME in app.service.kvstore:
        data = app.service.kvstore[KV_COLLECTION_NAME].data.query()
        for entry in data:
            if entry["_key"] == key:
                return entry["value"]

    return None


def save_collection_value(app: client.Application, key: str, value: Any) -> None:
    if not get_collection_value(app=app, key=key):
        app.service.kvstore[KV_COLLECTION_NAME].data.insert(
            json.dumps(
                {
                    "_key": key,
                    "value": value,
                }
            )
        )
    else:
        app.service.kvstore[KV_COLLECTION_NAME].data.update(
            id=key,
            data=json.dumps({"value": value}),
        )


if __name__ == "__main__":
    main()
