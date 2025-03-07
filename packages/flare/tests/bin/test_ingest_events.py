import datetime
import os
import pytest
import sys

from conftest import FakeFlareAPI
from conftest import FakeLogger
from conftest import FakeStoragePasswords
from data_store import ConfigDataStore
from freezegun import freeze_time


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
from constants import CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
from constants import PasswordKeys
from cron_job_ingest_events import fetch_feed
from cron_job_ingest_events import get_api_key
from cron_job_ingest_events import get_ingest_full_event_data
from cron_job_ingest_events import get_tenant_id
from cron_job_ingest_events import main


@pytest.mark.parametrize("storage_passwords", [[]], indirect=True)
def test_get_api_key_expect_exception(storage_passwords: FakeStoragePasswords) -> None:
    with pytest.raises(Exception, match="API key not found"):
        get_api_key(storage_passwords=storage_passwords)


@pytest.mark.parametrize(
    "storage_passwords",
    [[(PasswordKeys.API_KEY.value, "some_api_key")]],
    indirect=True,
)
def test_tenant_id_expect_exception(storage_passwords: FakeStoragePasswords) -> None:
    with pytest.raises(Exception, match="Tenant ID not found"):
        get_tenant_id(storage_passwords=storage_passwords)


@pytest.mark.parametrize(
    "storage_passwords",
    [
        [
            (PasswordKeys.API_KEY.value, "some_api_key"),
            (PasswordKeys.TENANT_ID.value, 11111),
        ],
    ],
    indirect=True,
)
def test_get_api_credentials_expect_api_key_and_tenant_id(
    storage_passwords: FakeStoragePasswords,
) -> None:
    assert get_api_key(storage_passwords=storage_passwords) == "some_api_key"
    assert get_tenant_id(storage_passwords=storage_passwords) == 11111


def test_get_default_ingest_full_event_data_value(
    storage_passwords: FakeStoragePasswords,
) -> None:
    assert get_ingest_full_event_data(storage_passwords=storage_passwords) is False


def test_fetch_feed_expect_feed_response(logger: FakeLogger, data_store) -> None:
    first_item = ({"actor": "this guy"}, "first_next_token")
    second_item = ({"actor": "some other guy"}, "second_next_token")
    expected_items = [first_item, second_item]

    index = 0
    for event, next_token in fetch_feed(
        logger=logger,
        api_key="some_key",
        tenant_id=11111,
        ingest_full_event_data=True,
        severities=[],
        source_types=[],
        flare_api_cls=FakeFlareAPI,
        data_store=data_store,
    ):
        assert event == expected_items[index][0]
        assert next_token == expected_items[index][1]
        index += 1

    assert logger.messages == [
        "INFO: Fetching tenant_id=11111, next=None, start_date=None"
    ]


@pytest.mark.parametrize(
    "storage_passwords",
    [
        [
            (PasswordKeys.API_KEY.value, "some_api_key"),
            (PasswordKeys.TENANT_ID.value, 11111),
        ]
    ],
    indirect=True,
)
@freeze_time("2000-01-01 12:09:00")
def test_main_expect_early_return(
    logger: FakeLogger,
    storage_passwords: FakeStoragePasswords,
    data_store: ConfigDataStore,
) -> None:
    data_store.set_last_fetch(datetime.datetime.fromisoformat("2000-01-01T12:00:00"))

    main(
        logger=logger,
        storage_passwords=storage_passwords,
        flare_api_cls=FakeFlareAPI,
        data_store=data_store,
    )
    assert logger.messages == [
        f"INFO: Fetched events less than {int(CRON_JOB_THRESHOLD_SINCE_LAST_FETCH.seconds / 60)} minutes ago, exiting"
    ]


@pytest.mark.parametrize(
    "storage_passwords",
    [
        [
            (PasswordKeys.API_KEY.value, "some_api_key"),
            (PasswordKeys.TENANT_ID.value, 11111),
        ]
    ],
    indirect=True,
)
@freeze_time("2000-01-01")
def test_main_expect_normal_run(
    logger: FakeLogger,
    storage_passwords: FakeStoragePasswords,
    data_store,
) -> None:
    main(
        logger=logger,
        storage_passwords=storage_passwords,
        flare_api_cls=FakeFlareAPI,
        data_store=data_store,
    )
    assert logger.messages == [
        "INFO: Fetching tenant_id=11111, next=None, start_date=FakeDatetime(1999, 12, 2, 0, 0, tzinfo=datetime.timezone.utc)",
        "INFO: Fetched 2 events",
    ]
