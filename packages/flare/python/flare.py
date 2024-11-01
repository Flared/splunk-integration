import requests
import typing as t
import vendor.splunklib.client as client

from datetime import date
from vendor.flareio import FlareApiClient
from vendor.requests.auth import AuthBase


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
    def __init__(
        self, *, app: client.Application, api_key: str, tenant_id: int
    ) -> None:
        self.flare_endpoints = app.service.confs["flare"]["endpoints"]

        self.flare_client = get_flare_api_client(
            api_key=api_key,
            tenant_id=tenant_id,
        )

    def retrieve_feed(
        self, *, next: t.Optional[str] = None, start_date: t.Optional[str] = None
    ) -> t.Iterator[requests.Response]:
        url = self.flare_endpoints["me_feed_endpoint"]
        params: t.Dict[str, t.Any] = {
            "lite": True,
            "size": 50,
            "from": next if next else None,
        }
        if not next:
            from_date = start_date if start_date else date.today().isoformat()
            params["time"] = f"{from_date}@"
        return self.flare_client.scroll(
            method="GET",
            url=url,
            params=params,
        )
