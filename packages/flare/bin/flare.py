import requests

from datetime import date
from typing import Any
from typing import Dict
from typing import Iterator
from typing import Optional
from typing import Union
from vendor.flareio import FlareApiClient
from vendor.requests.auth import AuthBase


def ensure_str(value: Union[str, bytes]) -> str:
    if isinstance(value, bytes):
        return value.decode("utf8")
    return value


def get_flare_api_client(
    *,
    api_key: str,
    tenant_id: Union[int, None],
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
    def __init__(self, *, api_key: str, tenant_id: Optional[int] = None) -> None:
        self.flare_client = get_flare_api_client(
            api_key=api_key,
            tenant_id=tenant_id,
        )

    def retrieve_feed(
        self, *, next: Optional[str] = None, start_date: Optional[date] = None
    ) -> Iterator[requests.Response]:
        params: Dict[str, Any] = {
            "lite": True,
            "size": 50,
            "from": next if next else None,
        }
        from_date = start_date.isoformat() if start_date else date.today().isoformat()
        params["time"] = f"{from_date}@"

        return self.flare_client.scroll(
            method="GET",
            url="/firework/v2/me/feed",
            params=params,
        )

    def retrieve_tenants(self) -> requests.Response:
        return self.flare_client.get(
            url="/firework/v2/me/tenants",
        )
