import json
import sys
import os
from typing import Optional

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))
import vendor.splunklib.client as client

from flare import FlareAPI

APP_NAME = "flare"
HOST = "localhost"
SPLUNK_PORT = 8089
REALM = APP_NAME + "_realm"
KV_COLLECTION_NAME = "feednext"


def main():
    try:
        # Example using a token
        splunk_service = client.connect(
            host=HOST,
            port=SPLUNK_PORT,
            app=APP_NAME,
            token=sys.stdin.readline().strip(),
        )
    except Exception as e:
        print(str(e), file=sys.stderr)
        raise Exception(str(e))

    app: client.Application = splunk_service.apps[APP_NAME]
    flare_api = FlareAPI(app=app)

    from_ = get_from_value(app=app)
    event_feed = flare_api.retrieve_feed(from_=from_)
    set_from_value(app=app, next=event_feed["next"])

    if event_feed["items"]:
        for item in event_feed["items"]:
            print(json.dumps(item))


def get_from_value(app: client.Application) -> Optional[str]:
    from_: Optional[str] = None
    if KV_COLLECTION_NAME in app.service.kvstore:
        data = app.service.kvstore[KV_COLLECTION_NAME].data.query()
        if len(data) > 1:
            from_ = data[0]["value"]
        else:
            app.service.kvstore.delete(KV_COLLECTION_NAME)

    return from_


def set_from_value(app: client.Application, next: Optional[str]):
    if KV_COLLECTION_NAME not in app.service.kvstore:
        # Create the collection
        app.service.kvstore.create(
            name=KV_COLLECTION_NAME, fields={"_key": "string", "value": "string"}
        )
        # Insert
        app.service.kvstore[KV_COLLECTION_NAME].data.insert(
            json.dumps({"_key": "next", "value": next})
        )
    elif not next:
        app.service.kvstore[KV_COLLECTION_NAME].data.delete(id="next")
    else:
        app.service.kvstore[KV_COLLECTION_NAME].data.update(
            id="next", data=json.dumps({"value": next})
        )


if __name__ == "__main__":
    main()
