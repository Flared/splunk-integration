import json
from requests import Request, Session
import sys
import splunklib.client as client

from transport import FlareAuthenticationHandler, HTTPMessage # pants: no-infer-dep
import urllib3
from urllib.error import HTTPError

APP_NAME = "flare_splunk_integration"
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
            token=sys.stdin.readline().strip()
        )
    except Exception as e:
        print(str(e), file=sys.stderr)
        raise Exception(str(e))

    app: client.Application = splunk_service.apps[APP_NAME]
    auth_handler = FlareAuthenticationHandler(app=app)

    _from = None
    if KV_COLLECTION_NAME in app.service.kvstore:
        data = app.service.kvstore[KV_COLLECTION_NAME].data.query()
        if len(data) > 1:
            _from = data[0]["value"]
        else:
            app.service.kvstore.delete(KV_COLLECTION_NAME)

    request = Request(
        method='POST',
        json={"lite": "true", "from": _from},
        headers={
            "Content-type": "application/json",
            "Accept": "application/json",
        },
        url=app.service.confs["flare"]["endpoints"]["me_feed_endpoint"],
    )

    prepared_request = auth_handler.authorize(request=request)
    session = Session()
    response = session.send(request=prepared_request)

    if response.status_code != 200:
       # This is a bit of a hack in order to see the error message within Splunk search.
       print(response.text, file=sys.stderr)
       headers = HTTPMessage()
       for key, value in response.headers.items():
           headers.add_header(key, value)
       raise HTTPError(
           url=app.service.confs["flare"]["endpoints"]["me_feed_endpoint"],
           code=response.status_code,
           msg=response.text,
           hdrs=headers,
           fp=None,
        )

    data = response.json()

    if KV_COLLECTION_NAME not in app.service.kvstore:
        # Create the collection
        app.service.kvstore.create(name=KV_COLLECTION_NAME, fields={"_key": "string", "value": "string"})
        # Insert
        app.service.kvstore[KV_COLLECTION_NAME].data.insert(json.dumps({"_key": "next", "value": data["next"]}))
    else:
        app.service.kvstore[KV_COLLECTION_NAME].data.update(id="next", data=json.dumps({"value": data["next"]}))

    if data["items"]:
        for item in data['items']:
            print(json.dumps(item))

if __name__ == '__main__':
    main()