import os
import pytest
import sys

from typing import Any
from unittest.mock import MagicMock
from unittest.mock import Mock
from unittest.mock import PropertyMock
from unittest.mock import patch


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin/vendor"))
from flare import FlareAPI


@patch("flare.FlareAPI._retrieve_full_event_from_uid")
@patch("flare.FlareAPI._retrieve_event_feed_metadata")
def test_flare_full_data_without_metadata(
    retrieve_event_feed_metadata_mock: MagicMock,
    retrieve_full_event_from_uid_mock: MagicMock,
) -> None:
    expected_return_value = {
        "next": "some_next_value",
        "items": [
            {
                "bad_data": "foo",
            },
            {
                "bad_data": "bar",
            },
        ],
    }

    response_mock = Mock()
    type(response_mock).status_code = PropertyMock(return_value=200)
    response_mock.json.return_value = expected_return_value
    retrieve_event_feed_metadata_mock.return_value = iter([response_mock])

    flare_api = FlareAPI(api_key="some_key", tenant_id=111)

    events: list[dict] = []
    for event, next_token in flare_api.retrieve_feed_events(
        next=None, start_date=None, ingest_metadata_only=True
    ):
        assert next_token == expected_return_value["next"]
        events.append(event)

    for i in range(len(events)):
        assert events[i] == expected_return_value["items"][i]

    retrieve_full_event_from_uid_mock.assert_not_called()


@patch("flare.FlareAPI._retrieve_full_event_from_uid")
@patch("flare.FlareAPI._retrieve_event_feed_metadata")
@patch("time.sleep", return_value=None)
def test_flare_full_data_with_metadata(
    sleep: Any,
    retrieve_event_feed_metadata_mock: MagicMock,
    retrieve_full_event_from_uid_mock: MagicMock,
) -> None:
    expected_return_value = {
        "next": "some_next_value",
        "items": [
            {
                "metadata": {"uid": "some_uid"},
                "data": "foo",
            },
            {
                "metadata": {"uid": "some_other_uid"},
                "data": "bar",
            },
        ],
    }

    expected_full_data_value = {
        "metadata": {
            "uid": "some_uid",
            "materialized_at": "2024-11-08T19:12:04Z",
            "type": "chat_message",
            "severity": "low",
        },
        "tenant_metadata": {"severity": None, "notes": None, "tags": []},
        "identifiers": [{"id": 31337, "name": "credit card"}],
        "highlights": {
            "2_message": ["this is a leaked message"],
            "3_message": ["this is a leaked message"],
        },
    }

    response_mock = Mock()
    type(response_mock).status_code = PropertyMock(return_value=200)
    response_mock.json.return_value = expected_return_value

    retrieve_event_feed_metadata_mock.return_value = iter([response_mock])
    flare_api = FlareAPI(api_key="some_key", tenant_id=111)

    retrieve_full_event_from_uid_mock.return_value = expected_full_data_value

    events: list[dict] = []
    for event, next_token in flare_api.retrieve_feed_events(
        next=None, start_date=None, ingest_metadata_only=False
    ):
        assert next_token == expected_return_value["next"]
        events.append(event)

    for i in range(len(events)):
        assert events[i] == expected_full_data_value

    retrieve_event_feed_metadata_mock.assert_called_once()


@patch("flare.FlareAPI._retrieve_full_event_from_uid", side_effect=Exception)
@patch("flare.FlareAPI._retrieve_event_feed_metadata")
def test_flare_full_data_with_metadata_and_exception(
    retrieve_event_feed_metadata_mock: MagicMock,
    retrieve_full_event_from_uid_mock: MagicMock,
) -> None:
    expected_return_value = {
        "next": "some_next_value",
        "items": [
            {
                "not_metadata": {"uid": "some_uid"},
            },
            {
                "metadata": {"uid": "some_other_uid"},
                "bad_data": "bar",
            },
        ],
    }

    response_mock = Mock()
    type(response_mock).status_code = PropertyMock(return_value=200)
    response_mock.json.return_value = expected_return_value

    retrieve_event_feed_metadata_mock.return_value = iter([response_mock])
    flare_api = FlareAPI(api_key="some_key", tenant_id=111)

    with pytest.raises(KeyError, match="metadata"):
        for _, _ in flare_api.retrieve_feed_events(
            next=None, start_date=None, ingest_metadata_only=False
        ):
            pass

    retrieve_event_feed_metadata_mock.assert_called_once()
