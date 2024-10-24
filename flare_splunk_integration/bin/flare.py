from http.client import HTTPMessage
from typing import Optional
from typing import Any
import sys

from vendor.requests.auth import AuthBase

from urllib.error import HTTPError
from vendor.flareio import FlareApiClient

APP_NAME = "flare_splunk_integration"


class FlareAPI(AuthBase):
    def __init__(self, *, app):
        # Should be able to use app.service.storage_passwords.get(),
        # but I can't seem to get that to work. list() works.
        server_key: Optional[str] = None
        tenant_id: Optional[str] = None
        for item in app.service.storage_passwords.list():
            if item.content.username == "serverkey":
                server_key = item.clear_password

            if item.content.username == "tenantid":
                tenant_id = item.clear_password

        self.flare_endpoints = app.service.confs["flare"]["endpoints"]
        self.api_key = server_key
        self.tenant_id = tenant_id
        self.flare_client = FlareApiClient(
            api_key=self.api_key, tenant_id=self.tenant_id
        )

    def retrieve_feed(self, *, from_: Optional[str] = None) -> dict[str, Any]:
        url = self.flare_endpoints["me_feed_endpoint"]
        response = self.flare_client.post(
            url=url,
            json={"lite": "true", "from": from_},
            headers={
                "Content-type": "application/json",
                "Accept": "application/json",
            },
        )

        if response.status_code != 200:
            # This is a bit of a hack in order to see the error message within Splunk search.
            print(response.text, file=sys.stderr)
            headers = HTTPMessage()
            for key, value in response.headers.items():
                headers.add_header(key, value)
                raise HTTPError(
                    url=url,
                    code=response.status_code,
                    msg=response.text,
                    hdrs=headers,
                    fp=None,
                )

        return response.json()
