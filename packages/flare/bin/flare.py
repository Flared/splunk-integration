import requests
import time

from datetime import date
from logger import Logger
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
        self.logger = Logger(class_name=__file__)

    def retrieve_feed(
        self,
        *,
        next: Optional[str] = None,
        start_date: Optional[date] = None,
        ingest_metadata_only: bool,
    ) -> Iterator[dict]:
        for response in self._retrieve_event_feed_metadata(
            next=next,
            start_date=start_date,
        ):
            event_feed = response.json()
            self.logger.debug(event_feed)
            if ingest_metadata_only:
                yield event_feed
            else:
                full_event_feed = {"items": [], "next": event_feed["next"]}
                for event in event_feed["items"]:
                    try:
                        full_event_feed["items"].append(
                            self._enrich_event_from_metadata_uid(event=event)
                        )
                    except Exception as e:
                        self.logger.error(f"Exception={e}")
                        full_event_feed["items"].append(event)
                    # Rate limiting.
                    time.sleep(1)
                yield full_event_feed

    def _retrieve_event_feed_metadata(
        self,
        *,
        next: Optional[str] = None,
        start_date: Optional[date] = None,
    ) -> Iterator[requests.Response]:
        data: Dict[str, Any] = {
            "from": next if next else None,
            "filters": {
                "estimated_created_at": {
                    "gte": start_date.isoformat()
                    if start_date
                    else date.today().isoformat()
                }
            },
        }

        for response in self.flare_client.scroll(
            method="POST",
            url="/firework/v4/events/tenant/_search",
            json=data,
        ):
            yield response
            # Rate limiting.
            time.sleep(1)

    def _enrich_event_from_metadata_uid(self, *, event: dict) -> dict:
        if event["metadata"] and event["metadata"]["uid"]:
            event_response = self.flare_client.get(
                url=f"/firework/v2/activities/{event['metadata']['uid']}"
            )
            enriched_event = event_response.json()
            self.logger.debug(enriched_event)
            return enriched_event
        else:
            return event

    def retrieve_tenants(self) -> requests.Response:
        return self.flare_client.get(
            url="/firework/v2/me/tenants",
        )
