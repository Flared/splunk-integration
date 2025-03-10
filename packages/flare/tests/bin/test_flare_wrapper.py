import pytest
import requests_mock

from conftest import FakeLogger
from flare import FlareAPI
from typing import Any


def test_flare_full_data_without_metadata(
    logger: FakeLogger,
    disable_sleep: Any,
) -> None:
    with requests_mock.Mocker() as mocker:
        mocker.register_uri(
            "POST",
            "https://api.flare.io/tokens/generate",
            status_code=200,
            json={"token": "access_token"},
        )

        tenant_resp_page_1: Any = {
            "next": "some_next_value",
            "items": [
                {"metadata": {"uid": "some_uid_1"}},
                {"metadata": {"uid": "some_uid_2"}},
            ],
        }

        tenant_resp_page_2: Any = {
            "next": None,
            "items": [],
        }

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            status_code=200,
            json=tenant_resp_page_1,
        )

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            additional_matcher=lambda request: request.json().get("from")
            == "some_next_value",
            status_code=200,
            json=tenant_resp_page_2,
        )

        mock_full_event = mocker.register_uri(
            "GET",
            "https://api.flare.io/firework/v2/activities/some_uid_1",
            status_code=200,
            json={},
        )

        flare_api = FlareAPI(api_key="some_key", tenant_id=111, logger=logger)

        events: list[dict] = []
        for event, next_token in flare_api.fetch_feed_events(
            next=None,
            start_date=None,
            ingest_full_event_data=False,
            severities=[],
            source_types=[],
        ):
            assert next_token == tenant_resp_page_1["next"]
            events.append(event)

        assert events == tenant_resp_page_1["items"]
        assert not mock_full_event.called


def test_flare_full_data_with_metadata(
    logger: FakeLogger,
    disable_sleep: Any,
) -> None:
    with requests_mock.Mocker() as mocker:
        mocker.register_uri(
            "POST",
            "https://api.flare.io/tokens/generate",
            status_code=200,
            json={"token": "access_token"},
        )

        tenant_resp_page_1: Any = {
            "next": "some_next_value",
            "items": [
                {"metadata": {"uid": "some_uid_1"}},
                {"metadata": {"uid": "some_uid_2"}},
            ],
        }

        tenant_resp_page_2: Any = {
            "next": None,
            "items": [],
        }

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            status_code=200,
            json=tenant_resp_page_1,
        )

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            additional_matcher=lambda request: request.json().get("from")
            == "some_next_value",
            status_code=200,
            json=tenant_resp_page_2,
        )

        expected_full_event_resp = [
            {
                "metadata": {
                    "uid": "some_uid_1",
                },
            },
            {
                "metadata": {
                    "uid": "some_uid_2",
                },
            },
        ]

        mock_full_event_1 = mocker.register_uri(
            "GET",
            "https://api.flare.io/firework/v2/activities/some_uid_1",
            status_code=200,
            json={"activity": expected_full_event_resp[0]},
        )

        mock_full_event_2 = mocker.register_uri(
            "GET",
            "https://api.flare.io/firework/v2/activities/some_uid_2",
            status_code=200,
            json={"activity": expected_full_event_resp[1]},
        )

        flare_api = FlareAPI(api_key="some_key", tenant_id=111, logger=logger)

        events: list[dict] = []
        for event, next_token in flare_api.fetch_feed_events(
            next=None,
            start_date=None,
            ingest_full_event_data=True,
            severities=[],
            source_types=[],
        ):
            assert next_token == tenant_resp_page_1["next"]
            events.append(event)

        for i in range(len(events)):
            assert events[i] == expected_full_event_resp[i]

        assert mock_full_event_1.called
        assert mock_full_event_2.called


def test_flare_full_data_with_metadata_and_exception(
    logger: FakeLogger,
    disable_sleep: Any,
) -> None:
    with requests_mock.Mocker() as mocker:
        mocker.register_uri(
            "POST",
            "https://api.flare.io/tokens/generate",
            status_code=200,
            json={"token": "access_token"},
        )

        tenant_resp_page_1 = {
            "next": "some_next_value",
            "items": [
                {"not_metadata": {"uid": "some_uid_1"}},
                {"metadata": {"uid": "some_uid_2"}},
            ],
        }

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            status_code=200,
            json=tenant_resp_page_1,
        )

        flare_api = FlareAPI(api_key="some_key", tenant_id=111, logger=logger)

        with pytest.raises(KeyError, match="metadata"):
            next(
                flare_api.fetch_feed_events(
                    next=None,
                    start_date=None,
                    ingest_full_event_data=True,
                    severities=[],
                    source_types=[],
                )
            )


def test_flare_full_data_retry_exception(
    logger: FakeLogger,
    disable_sleep: Any,
) -> None:
    with requests_mock.Mocker() as mocker:
        mocker.register_uri(
            "POST",
            "https://api.flare.io/tokens/generate",
            status_code=200,
            json={"token": "access_token"},
        )

        tenant_resp_page_1 = {
            "next": "some_next_value",
            "items": [
                {"metadata": {"uid": "some_uid_1"}},
                {"metadata": {"uid": "some_uid_2"}},
            ],
        }

        mocker.register_uri(
            "POST",
            "https://api.flare.io/firework/v4/events/tenant/_search",
            status_code=200,
            json=tenant_resp_page_1,
        )

        mocker.register_uri(
            "GET",
            "https://api.flare.io/firework/v2/activities/some_uid_1",
            status_code=500,
        )

        flare_api = FlareAPI(api_key="some_key", tenant_id=111, logger=logger)

        with pytest.raises(
            Exception,
            match="failed to fetch full event data for some_uid_1 after 3 tries",
        ):
            next(
                flare_api.fetch_feed_events(
                    next=None,
                    start_date=None,
                    ingest_full_event_data=True,
                    severities=[],
                    source_types=[],
                )
            )

        assert logger.messages == [
            "INFO: Failed to fetch event 1/3 retries: 500 Server Error: None for url: https://api.flare.io/firework/v2/activities/some_uid_1",
            "INFO: Failed to fetch event 2/3 retries: 500 Server Error: None for url: https://api.flare.io/firework/v2/activities/some_uid_1",
            "INFO: Failed to fetch event 3/3 retries: 500 Server Error: None for url: https://api.flare.io/firework/v2/activities/some_uid_1",
        ]
