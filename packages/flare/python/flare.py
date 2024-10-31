from http.client import HTTPMessage
import typing as t
import sys

from vendor.requests.auth import AuthBase

from urllib.error import HTTPError
from vendor.flareio import FlareApiClient
import vendor.splunklib.client as client

APP_NAME = "flare"


def ensure_str(value: t.Union[str, bytes]) -> str:
    if isinstance(value, bytes):
        return value.decode("utf8")
    return value


def get_flare_api_client(
    *,
    api_key: str,
    tenant_id: t.Union[int, None],
) -> FlareApiClient:
    api_client = FlareApiClient(
        api_key=api_key,
        tenant_id=tenant_id,
    )
    current_user_agent: str = ensure_str(
        api_client._session.headers.get("User-Agent") or ""
    )
    api_client._session.headers["User-Agent"] = (
        f"{current_user_agent} flare-splunk".strip()
    )
    return api_client


class FlareAPI(AuthBase):
    def __init__(self, *, app: client.Application) -> None:
        # Should be able to use app.service.storage_passwords.get(),
        # but I can't seem to get that to work. list() works.
        api_key: t.Optional[str] = None
        tenant_id: t.Optional[int] = None
        for item in app.service.storage_passwords.list():
            if item.content.username == "api_key":
                api_key = item.clear_password

            if item.content.username == "tenant_id":
                tenant_id = (
                    int(item.clear_password)
                    if item.clear_password is not None
                    else None
                )

        if not api_key:
            raise Exception("API key not found")

        self.flare_endpoints = app.service.confs["flare"]["endpoints"]

        self.flare_client = get_flare_api_client(
            api_key=api_key,
            tenant_id=tenant_id,
        )

    def retrieve_feed(self, *, from_: t.Optional[str] = None) -> dict[str, t.Any]:
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
