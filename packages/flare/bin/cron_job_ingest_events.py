import json
import os
import sys

from datetime import date
from datetime import datetime
from typing import Any
from typing import Iterator
from typing import Optional
from typing import Protocol


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
from vendor.splunklib.client import Entity


class StoragePasswords(Protocol):
    def list(self) -> list:
        pass


class KVStoreCollections(Protocol):
    def __getitem__(self, key: str) -> Entity:
        pass

    def __contains__(self, item: str) -> bool:
        pass

    def create(self, name: str, fields: dict) -> dict:
        pass


class KVStoreCollectionData(Protocol):
    def insert(self, data: str) -> dict:
        pass

    def update(self, id: str, data: str) -> dict:
        pass

    def query(self, **query: dict) -> list:
        pass


class Collection(Protocol):
    def __getitem__(self, key: str) -> Entity:
        pass


class Service(Protocol):
    @property
    def apps(self) -> Collection:
        pass

    @property
    def storage_passwords(self) -> StoragePasswords:
        pass

    @property
    def kvstore(self) -> KVStoreCollections:
        pass


class Application(Protocol):
    service: Service


def main(
    logger: Logger, storage_passwords: StoragePasswords, kvstore: KVStoreCollections
) -> None:
    create_collection(kvstore=kvstore)

    # To avoid cron jobs from doing the same work at the same time, exit new cron jobs if a cron job is already doing work
    last_fetched_timestamp = get_last_fetched(kvstore=kvstore)
    if last_fetched_timestamp and last_fetched_timestamp > (
        datetime.now() - CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
    ):
        logger.info(
            f"Fetched events less than {int(CRON_JOB_THRESHOLD_SINCE_LAST_FETCH.seconds / 60)} minutes ago, exiting"
        )
        return

    api_key = get_api_key(storage_passwords=storage_passwords)
    tenant_id = get_tenant_id(storage_passwords=storage_passwords)
    ingest_metadata_only = get_ingest_metadata_only(storage_passwords=storage_passwords)
    severities_filter = get_severities_filter(storage_passwords=storage_passwords)
    source_types_filter = get_source_types_filter(storage_passwords=storage_passwords)

    save_last_fetched(kvstore=kvstore)
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=tenant_id)
    events_fetched_count = 0
    for event, next_token in fetch_feed(
        logger=logger,
        kvstore=kvstore,
        api_key=api_key,
        tenant_id=tenant_id,
        ingest_metadata_only=ingest_metadata_only,
        severities=severities_filter,
        source_types=source_types_filter,
    ):
        save_last_fetched(kvstore=kvstore)

        save_next(kvstore=kvstore, tenant_id=tenant_id, next=next_token)

        print(json.dumps(event), flush=True)

        events_fetched_count += 1

    logger.info(f"Fetched {events_fetched_count} events")


def get_storage_password_value(
    storage_passwords: StoragePasswords, password_key: str
) -> Optional[str]:
    for item in storage_passwords.list():
        if item.content.username == password_key:
            return item.clear_password

    return None


def get_api_key(storage_passwords: StoragePasswords) -> str:
    api_key = get_storage_password_value(
        storage_passwords=storage_passwords, password_key=PasswordKeys.API_KEY.value
    )
    if not api_key:
        raise Exception("API key not found")
    return api_key


def get_tenant_id(storage_passwords: StoragePasswords) -> int:
    stored_tenant_id = get_storage_password_value(
        storage_passwords=storage_passwords, password_key=PasswordKeys.TENANT_ID.value
    )
    try:
        tenant_id = int(stored_tenant_id) if stored_tenant_id is not None else None
    except Exception:
        pass

    if not tenant_id:
        raise Exception("Tenant ID not found")
    return tenant_id


def get_ingest_metadata_only(storage_passwords: StoragePasswords) -> bool:
    return (
        get_storage_password_value(
            storage_passwords=storage_passwords,
            password_key=PasswordKeys.INGEST_METADATA_ONLY.value,
        )
        == "true"
    )


def get_severities_filter(storage_passwords: StoragePasswords) -> list[str]:
    severities_filter = get_storage_password_value(
        storage_passwords=storage_passwords,
        password_key=PasswordKeys.SEVERITIES_FILTER.value,
    )

    if severities_filter:
        return severities_filter.split(",")

    return []


def get_source_types_filter(storage_passwords: StoragePasswords) -> list[str]:
    source_types_filter = get_storage_password_value(
        storage_passwords=storage_passwords,
        password_key=PasswordKeys.SOURCE_TYPES_FILTER.value,
    )

    if source_types_filter:
        return source_types_filter.split(",")

    return []


def get_next(kvstore: KVStoreCollections, tenant_id: int) -> Optional[str]:
    return get_collection_value(
        kvstore=kvstore, key=CollectionKeys.get_next_token(tenantId=tenant_id)
    )


def get_start_date(kvstore: KVStoreCollections) -> Optional[date]:
    start_date = get_collection_value(
        kvstore=kvstore, key=CollectionKeys.START_DATE.value
    )
    if start_date:
        try:
            return date.fromisoformat(start_date)
        except Exception:
            pass
    return None


def get_last_ingested_tenant_id(kvstore: KVStoreCollections) -> Optional[int]:
    last_ingested_tenant_id = get_collection_value(
        kvstore=kvstore, key=CollectionKeys.LAST_INGESTED_TENANT_ID.value
    )
    try:
        return int(last_ingested_tenant_id) if last_ingested_tenant_id else None
    except Exception:
        pass
    return None


def get_last_fetched(kvstore: KVStoreCollections) -> Optional[datetime]:
    timestamp_last_fetched = get_collection_value(
        kvstore=kvstore, key=CollectionKeys.TIMESTAMP_LAST_FETCH.value
    )
    if timestamp_last_fetched:
        try:
            return datetime.fromisoformat(timestamp_last_fetched)
        except Exception:
            pass
    return None


def create_collection(kvstore: KVStoreCollections) -> None:
    if KV_COLLECTION_NAME not in kvstore:
        # Create the collection
        kvstore.create(
            name=KV_COLLECTION_NAME, fields={"_key": "string", "value": "string"}
        )


def save_last_ingested_tenant_id(kvstore: KVStoreCollections, tenant_id: int) -> None:
    # If the tenant has changed, update the start date so that future requests will be based off today
    # If you switch tenants, this will avoid the old tenant from ingesting all the events before today and the day
    # that tenant was switched in the first place.
    if get_last_ingested_tenant_id(kvstore=kvstore) != tenant_id:
        save_collection_value(
            kvstore=kvstore,
            key=CollectionKeys.START_DATE.value,
            value=date.today().isoformat(),
        )

    save_collection_value(
        kvstore=kvstore,
        key=CollectionKeys.LAST_INGESTED_TENANT_ID.value,
        value=tenant_id,
    )


def save_next(kvstore: KVStoreCollections, tenant_id: int, next: Optional[str]) -> None:
    # If we have a new next value, update the collection for that tenant to continue searching from that point
    if not next:
        return

    save_collection_value(
        kvstore=kvstore,
        key=CollectionKeys.get_next_token(tenantId=tenant_id),
        value=next,
    )


def save_last_fetched(kvstore: KVStoreCollections) -> None:
    save_collection_value(
        kvstore=kvstore,
        key=CollectionKeys.TIMESTAMP_LAST_FETCH.value,
        value=datetime.now().isoformat(),
    )


def get_collection_value(kvstore: KVStoreCollections, key: str) -> Optional[str]:
    # Ensure collection exists
    create_collection(kvstore=kvstore)

    data = kvstore[KV_COLLECTION_NAME].data.query()
    for entry in data:
        if entry["_key"] == key:
            return entry["value"]

    return None


def save_collection_value(kvstore: KVStoreCollections, key: str, value: Any) -> None:
    if not get_collection_value(kvstore=kvstore, key=key):
        kvstore[KV_COLLECTION_NAME].data.insert(
            json.dumps(
                {
                    "_key": key,
                    "value": value,
                }
            )
        )
        return

    kvstore[KV_COLLECTION_NAME].data.update(
        id=key,
        data=json.dumps({"value": value}),
    )


def fetch_feed(
    logger: Logger,
    kvstore: KVStoreCollections,
    api_key: str,
    tenant_id: int,
    ingest_metadata_only: bool,
    severities: list[str],
    source_types: list[str],
) -> Iterator[tuple[dict, str]]:
    try:
        flare_api = FlareAPI(api_key=api_key, tenant_id=tenant_id)

        next = get_next(kvstore=kvstore, tenant_id=tenant_id)
        start_date = get_start_date(kvstore=kvstore)
        logger.info(f"Fetching {tenant_id=}, {next=}, {start_date=}")
        for event_next in flare_api.fetch_feed_events(
            next=next,
            start_date=start_date,
            ingest_metadata_only=ingest_metadata_only,
            severities=severities,
            source_types=source_types,
        ):
            yield event_next
    except Exception as e:
        logger.error(f"Exception={e}")


def get_splunk_service(logger: Logger) -> Service:
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

    return splunk_service


if __name__ == "__main__":
    logger = Logger(class_name=__file__)
    splunk_service: Service = get_splunk_service(logger=logger)
    app: Application = splunk_service.apps[APP_NAME]

    main(
        logger=logger,
        storage_passwords=app.service.storage_passwords,
        kvstore=app.service.kvstore,
    )
