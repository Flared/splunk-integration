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
from unittest.mock import patch


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
from constants import CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
from constants import KV_COLLECTION_NAME
from constants import CollectionKeys
from cron_job_ingest_events import fetch_feed
from cron_job_ingest_events import get_api_key
from cron_job_ingest_events import get_collection_value
from cron_job_ingest_events import get_current_tenant_id
from cron_job_ingest_events import get_last_fetched
from cron_job_ingest_events import get_start_date
from cron_job_ingest_events import get_tenant_id
from cron_job_ingest_events import main
from cron_job_ingest_events import save_collection_value
from cron_job_ingest_events import save_start_date


def test_get_collection_value_expect_none() -> None:
    app = MagicMock()
    assert get_collection_value(app=app, key="some_key") is None


def test_get_collection_value_expect_result() -> None:
    app = MagicMock()
    app.service.kvstore.__contains__.side_effect = lambda x: x == KV_COLLECTION_NAME
    app.service.kvstore[KV_COLLECTION_NAME].data.query.return_value = [
        {
            "_key": "some_key",
            "value": "some_value",
        },
    ]

    assert get_collection_value(app=app, key="some_key") == "some_value"


def test_save_collection_value_expect_insert() -> None:
    key = "some_key"
    value = "some_value"
    app = MagicMock()
    save_collection_value(app=app, key=key, value=value)
    app.service.kvstore[KV_COLLECTION_NAME].data.insert.assert_called_once_with(
        json.dumps({"_key": key, "value": value})
    )


def test_save_collection_value_expect_update() -> None:
    key = "some_key"
    value = "update_value"
    app = MagicMock()
    app.service.kvstore.__contains__.side_effect = lambda x: x == KV_COLLECTION_NAME
    app.service.kvstore[KV_COLLECTION_NAME].data.query.return_value = [
        {
            "_key": key,
            "value": "old_value",
        },
    ]
    save_collection_value(app=app, key=key, value=value)
    app.service.kvstore[KV_COLLECTION_NAME].data.update.assert_called_once_with(
        id=key,
        data=json.dumps({"value": value}),
    )


def test_get_api_key_tenant_id_expect_exception() -> None:
    app = MagicMock()

    with pytest.raises(Exception, match="API key not found"):
        get_api_key(app=app)

    with pytest.raises(Exception, match="Tenant ID not found"):
        get_tenant_id(app=app)


def test_get_api_credentials_expect_api_key_and_tenant_id() -> None:
    app = MagicMock()

    api_key_item = Mock()
    type(api_key_item.content).username = PropertyMock(return_value="api_key")
    type(api_key_item).clear_password = PropertyMock(return_value="some_api_key")

    tenant_id_item = Mock()
    type(tenant_id_item.content).username = PropertyMock(return_value="tenant_id")
    type(tenant_id_item).clear_password = PropertyMock(return_value=11111)

    app.service.storage_passwords.list.return_value = [api_key_item, tenant_id_item]

    api_key = get_api_key(app=app)
    assert api_key == "some_api_key"
    tenant_id = get_tenant_id(app=app)
    assert tenant_id == 11111


@patch(
    "cron_job_ingest_events.get_collection_value", return_value="not_an_isoformat_date"
)
def test_get_start_date_expect_none(get_collection_value_mock: MagicMock) -> None:
    app = MagicMock()
    assert get_start_date(app=app) is None


@patch(
    "cron_job_ingest_events.get_collection_value", return_value=date.today().isoformat()
)
def test_get_start_date_expect_date(get_collection_value_mock: MagicMock) -> None:
    app = MagicMock()
    assert isinstance(get_start_date(app=app), date)


@patch("cron_job_ingest_events.get_collection_value", return_value="not_a_number")
def test_get_current_tenant_id_expect_none(
    get_collection_value_mock: MagicMock,
) -> None:
    app = MagicMock()
    assert get_current_tenant_id(app=app) is None


@patch("cron_job_ingest_events.get_collection_value", return_value="11111")
def test_get_current_tenant_id_expect_integer(
    get_collection_value_mock: MagicMock,
) -> None:
    app = MagicMock()
    assert get_current_tenant_id(app=app) == 11111


@patch(
    "cron_job_ingest_events.get_collection_value", return_value="not_an_isoformat_date"
)
def test_get_last_fetched_expect_none(get_collection_value_mock: MagicMock) -> None:
    app = MagicMock()
    assert get_last_fetched(app=app) is None


@patch(
    "cron_job_ingest_events.get_collection_value",
    return_value=datetime.now().isoformat(),
)
def test_get_last_fetched_expect_datetime(get_collection_value_mock: MagicMock) -> None:
    app = MagicMock()
    assert isinstance(get_last_fetched(app=app), datetime)


@patch("cron_job_ingest_events.save_collection_value")
@patch("cron_job_ingest_events.get_start_date", return_value=None)
@patch("cron_job_ingest_events.get_current_tenant_id", return_value=11111)
def test_save_start_date_expect_save_collection_value_called_and_tenant_id_unchanged(
    get_current_tenant_id_mock: MagicMock,
    get_start_date_mock: MagicMock,
    save_collection_value_mock: MagicMock,
) -> None:
    app = MagicMock()
    save_start_date(app=app, tenant_id=11111)
    save_collection_value_mock.assert_called_once_with(
        app=app, key=CollectionKeys.START_DATE.value, value=date.today().isoformat()
    )
    app.service.kvstore[KV_COLLECTION_NAME].data.update.assert_not_called()


@patch("cron_job_ingest_events.save_collection_value")
@patch("cron_job_ingest_events.get_start_date", return_value=date.today())
@patch("cron_job_ingest_events.get_current_tenant_id", return_value=22222)
def test_save_start_date_expect_save_collection_value_not_called_and_tenant_id_changed(
    get_current_tenant_id_mock: MagicMock,
    get_start_date_mock: MagicMock,
    save_collection_value_mock: MagicMock,
) -> None:
    app = MagicMock()
    save_start_date(app=app, tenant_id=11111)
    save_collection_value_mock.assert_not_called()
    app.service.kvstore[KV_COLLECTION_NAME].data.update.assert_called_once_with(
        id=CollectionKeys.START_DATE.value,
        data=json.dumps({"value": date.today().isoformat()}),
    )


def test_fetch_feed_expect_exception() -> None:
    logger = MagicMock()
    app = MagicMock()
    for _ in fetch_feed(
        logger=logger,
        app=app,
        api_key="some_key",
        tenant_id=11111,
        ingest_metadata_only=False,
    ):
        pass

    logger.error.assert_called_once_with("Exception=Failed to fetch API Token")


@patch("cron_job_ingest_events.FlareAPI")
@patch("time.sleep", return_value=None)
def test_fetch_feed_expect_feed_response(
    sleep: Any, flare_api_mock: MagicMock, capfd: Any
) -> None:
    logger = MagicMock()
    app = MagicMock()

    expected_return_value = {
        "next": "some_next_value",
        "items": [
            {
                "actor": "this guy",
            },
            {
                "actor": "some other guy",
            },
        ],
    }

    flare_api_mock_instance = flare_api_mock.return_value
    flare_api_mock_instance.retrieve_feed.return_value = iter([expected_return_value])

    for feed_event in fetch_feed(
        logger=logger,
        app=app,
        api_key="some_key",
        tenant_id=11111,
        ingest_metadata_only=False,
    ):
        assert feed_event == expected_return_value


@patch(
    "cron_job_ingest_events.get_last_fetched",
    return_value=datetime.now() - timedelta(minutes=5),
)
def test_main_expect_early_return(get_last_fetched_mock: MagicMock) -> None:
    logger = MagicMock()
    app = MagicMock()

    main(logger=logger, app=app)
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
    app = MagicMock()

    main(logger=logger, app=app)
    fetch_feed_mock.assert_called_once_with(
        logger=logger,
        app=app,
        api_key="some_api_key",
        tenant_id=111,
        ingest_metadata_only=False,
    )
