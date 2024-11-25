import json
import os
import pytest
import sys

from datetime import date
from datetime import datetime
from datetime import timedelta
from typing import Any
from unittest.mock import MagicMock
from unittest.mock import Mock
from unittest.mock import PropertyMock
from unittest.mock import call
from unittest.mock import patch


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
from constants import CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
from constants import KV_COLLECTION_NAME
from constants import CollectionKeys
from cron_job_ingest_events import fetch_feed
from cron_job_ingest_events import get_api_key
from cron_job_ingest_events import get_collection_value
from cron_job_ingest_events import get_last_fetched
from cron_job_ingest_events import get_last_ingested_tenant_id
from cron_job_ingest_events import get_start_date
from cron_job_ingest_events import get_tenant_id
from cron_job_ingest_events import main
from cron_job_ingest_events import save_collection_value
from cron_job_ingest_events import save_last_ingested_tenant_id


def test_get_collection_value_expect_none() -> None:
    kvstore = MagicMock()
    assert get_collection_value(kvstore=kvstore, key="some_key") is None


def test_get_collection_value_expect_result() -> None:
    kvstore = MagicMock()
    kvstore.__contains__.side_effect = lambda x: x == KV_COLLECTION_NAME
    kvstore[KV_COLLECTION_NAME].data.query.return_value = [
        {
            "_key": "some_key",
            "value": "some_value",
        },
    ]

    assert get_collection_value(kvstore=kvstore, key="some_key") == "some_value"


def test_save_collection_value_expect_insert() -> None:
    key = "some_key"
    value = "some_value"
    kvstore = MagicMock()
    save_collection_value(kvstore=kvstore, key=key, value=value)
    kvstore[KV_COLLECTION_NAME].data.insert.assert_called_once_with(
        json.dumps({"_key": key, "value": value})
    )


def test_save_collection_value_expect_update() -> None:
    key = "some_key"
    value = "update_value"
    kvstore = MagicMock()
    kvstore.__contains__.side_effect = lambda x: x == KV_COLLECTION_NAME
    kvstore[KV_COLLECTION_NAME].data.query.return_value = [
        {
            "_key": key,
            "value": "old_value",
        },
    ]
    save_collection_value(kvstore=kvstore, key=key, value=value)
    kvstore[KV_COLLECTION_NAME].data.update.assert_called_once_with(
        id=key,
        data=json.dumps({"value": value}),
    )


def test_get_api_key_tenant_id_expect_exception() -> None:
    storage_passwords = MagicMock()

    with pytest.raises(Exception, match="API key not found"):
        get_api_key(storage_passwords=storage_passwords)

    with pytest.raises(Exception, match="Tenant ID not found"):
        get_tenant_id(storage_passwords=storage_passwords)


def test_get_api_credentials_expect_api_key_and_tenant_id() -> None:
    storage_passwords = MagicMock()

    api_key_item = Mock()
    type(api_key_item.content).username = PropertyMock(return_value="api_key")
    type(api_key_item).clear_password = PropertyMock(return_value="some_api_key")

    tenant_id_item = Mock()
    type(tenant_id_item.content).username = PropertyMock(return_value="tenant_id")
    type(tenant_id_item).clear_password = PropertyMock(return_value=11111)

    storage_passwords.list.return_value = [api_key_item, tenant_id_item]

    api_key = get_api_key(storage_passwords=storage_passwords)
    assert api_key == "some_api_key"
    tenant_id = get_tenant_id(storage_passwords=storage_passwords)
    assert tenant_id == 11111


@patch(
    "cron_job_ingest_events.get_collection_value", return_value="not_an_isoformat_date"
)
def test_get_start_date_expect_none(get_collection_value_mock: MagicMock) -> None:
    kvstore = MagicMock()
    assert get_start_date(kvstore=kvstore) is None


@patch(
    "cron_job_ingest_events.get_collection_value", return_value=date.today().isoformat()
)
def test_get_start_date_expect_date(get_collection_value_mock: MagicMock) -> None:
    kvstore = MagicMock()
    assert isinstance(get_start_date(kvstore), date)


@patch("cron_job_ingest_events.get_collection_value", return_value="not_a_number")
def test_get_last_ingested_tenant_id_expect_none(
    get_collection_value_mock: MagicMock,
) -> None:
    kvstore = MagicMock()
    assert get_last_ingested_tenant_id(kvstore=kvstore) is None


@patch("cron_job_ingest_events.get_collection_value", return_value="11111")
def test_get_last_ingested_tenant_id_expect_integer(
    get_collection_value_mock: MagicMock,
) -> None:
    kvstore = MagicMock()
    assert get_last_ingested_tenant_id(kvstore=kvstore) == 11111


@patch(
    "cron_job_ingest_events.get_collection_value", return_value="not_an_isoformat_date"
)
def test_get_last_fetched_expect_none(get_collection_value_mock: MagicMock) -> None:
    kvstore = MagicMock()
    assert get_last_fetched(kvstore=kvstore) is None


@patch(
    "cron_job_ingest_events.get_collection_value",
    return_value=datetime.now().isoformat(),
)
def test_get_last_fetched_expect_datetime(get_collection_value_mock: MagicMock) -> None:
    kvstore = MagicMock()
    assert isinstance(get_last_fetched(kvstore=kvstore), datetime)


@patch("cron_job_ingest_events.save_collection_value")
@patch("cron_job_ingest_events.get_last_ingested_tenant_id", return_value=None)
def test_save_last_ingested_tenant_id_expect_save_collection_value_called_and_tenant_id_unchanged(
    get_last_ingested_tenant_id_mock: MagicMock,
    save_collection_value_mock: MagicMock,
) -> None:
    kvstore = MagicMock()
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=11111)
    save_collection_value_mock.assert_has_calls(
        [
            call(
                kvstore=kvstore,
                key=CollectionKeys.START_DATE.value,
                value=date.today().isoformat(),
            ),
            call(
                kvstore=kvstore,
                key=CollectionKeys.LAST_INGESTED_TENANT_ID.value,
                value=11111,
            ),
        ]
    )


@patch("cron_job_ingest_events.save_collection_value")
@patch("cron_job_ingest_events.get_start_date", return_value=date.today())
@patch("cron_job_ingest_events.get_last_ingested_tenant_id", return_value=22222)
def test_save_last_ingested_tenant_id_expect_save_collection_value_not_called_and_tenant_id_changed(
    get_last_ingested_tenant_id_mock: MagicMock,
    get_start_date_mock: MagicMock,
    save_collection_value_mock: MagicMock,
) -> None:
    kvstore = MagicMock()
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=11111)
    save_collection_value_mock.assert_has_calls(
        [
            call(
                kvstore=kvstore,
                key=CollectionKeys.START_DATE.value,
                value=date.today().isoformat(),
            ),
            call(
                kvstore=kvstore,
                key=CollectionKeys.LAST_INGESTED_TENANT_ID.value,
                value=11111,
            ),
        ]
    )


@patch("cron_job_ingest_events.save_collection_value")
@patch("cron_job_ingest_events.get_start_date", return_value=date.today())
@patch("cron_job_ingest_events.get_last_ingested_tenant_id", return_value=11111)
def test_save_last_ingested_tenant_id_expect_same_tenant_id(
    get_last_ingested_tenant_id_mock: MagicMock,
    get_start_date_mock: MagicMock,
    save_collection_value_mock: MagicMock,
) -> None:
    kvstore = MagicMock()
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=11111)
    save_collection_value_mock.assert_called_once_with(
        kvstore=kvstore, key=CollectionKeys.LAST_INGESTED_TENANT_ID.value, value=11111
    )


def test_fetch_feed_expect_exception() -> None:
    logger = MagicMock()
    kvstore = MagicMock()
    for _ in fetch_feed(
        logger=logger,
        kvstore=kvstore,
        api_key="some_key",
        tenant_id=11111,
        ingest_metadata_only=False,
        severities=[],
        source_types=[],
    ):
        pass

    logger.error.assert_called_once_with("Exception=Failed to fetch API Token")


@patch("cron_job_ingest_events.FlareAPI")
@patch("time.sleep", return_value=None)
def test_fetch_feed_expect_feed_response(
    sleep: Any, flare_api_mock: MagicMock, capfd: Any
) -> None:
    logger = MagicMock()
    kvstore = MagicMock()

    next = "some_next_value"
    first_item = {
        "actor": "this guy",
    }
    second_item = {
        "actor": "some other guy",
    }
    expected_items = [first_item, second_item]
    flare_api_mock_instance = flare_api_mock.return_value
    flare_api_mock_instance.fetch_feed_events.return_value = iter(
        [(first_item, next), (second_item, next)]
    )

    events: list[dict] = []
    for event, next_token in fetch_feed(
        logger=logger,
        kvstore=kvstore,
        api_key="some_key",
        tenant_id=11111,
        ingest_metadata_only=False,
        severities=[],
        source_types=[],
    ):
        assert next_token == next
        events.append(event)

    for i in range(len(events)):
        assert events[i] == expected_items[i]


@patch(
    "cron_job_ingest_events.get_last_fetched",
    return_value=datetime.now() - timedelta(minutes=5),
)
def test_main_expect_early_return(get_last_fetched_mock: MagicMock) -> None:
    logger = MagicMock()
    storage_passwords = MagicMock()
    kvstore = MagicMock()

    main(logger=logger, storage_passwords=storage_passwords, kvstore=kvstore)
    logger.info.assert_called_once_with(
        f"Fetched events less than {int(CRON_JOB_THRESHOLD_SINCE_LAST_FETCH.seconds / 60)} minutes ago, exiting"
    )


@patch("cron_job_ingest_events.fetch_feed")
@patch(
    "cron_job_ingest_events.get_ingest_metadata_only",
    return_value=(False),
)
@patch(
    "cron_job_ingest_events.get_tenant_id",
    return_value=(111),
)
@patch(
    "cron_job_ingest_events.get_api_key",
    return_value=("some_api_key"),
)
@patch(
    "cron_job_ingest_events.get_last_fetched",
    return_value=datetime.now() - timedelta(minutes=10),
)
def test_main_expect_normal_run(
    get_last_fetched_mock: MagicMock,
    get_api_key_mock: MagicMock,
    get_tenant_id_mock: MagicMock,
    get_ingest_metadata_only_mock: MagicMock,
    fetch_feed_mock: MagicMock,
) -> None:
    logger = MagicMock()
    storage_passwords = MagicMock()
    kvstore = MagicMock()

    main(logger=logger, storage_passwords=storage_passwords, kvstore=kvstore)
    fetch_feed_mock.assert_called_once_with(
        logger=logger,
        kvstore=kvstore,
        api_key="some_api_key",
        tenant_id=111,
        ingest_metadata_only=False,
        severities=[],
        source_types=[],
    )
