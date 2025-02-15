import os
import pytest
import sys

from conftest import FakeFlareAPI
from conftest import FakeKVStoreCollections
from conftest import FakeLogger
from conftest import FakeStoragePasswords
from datetime import datetime
from datetime import timezone
from freezegun import freeze_time


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
from constants import CRON_JOB_THRESHOLD_SINCE_LAST_FETCH
from constants import KV_COLLECTION_NAME
from constants import CollectionKeys
from constants import PasswordKeys
from cron_job_ingest_events import fetch_feed
from cron_job_ingest_events import get_api_key
from cron_job_ingest_events import get_collection_value
from cron_job_ingest_events import get_ingest_full_event_data
from cron_job_ingest_events import get_last_fetched
from cron_job_ingest_events import get_last_ingested_tenant_id
from cron_job_ingest_events import get_start_date
from cron_job_ingest_events import get_tenant_id
from cron_job_ingest_events import main
from cron_job_ingest_events import save_collection_value
from cron_job_ingest_events import save_last_ingested_tenant_id


def test_get_collection_value_expect_none(kvstore: FakeKVStoreCollections) -> None:
    assert get_collection_value(kvstore=kvstore, key="some_key") is None


@pytest.mark.parametrize("kvstore", [[("some_key", "some_value")]], indirect=True)
def test_get_collection_value_expect_result(kvstore: FakeKVStoreCollections) -> None:
    assert get_collection_value(kvstore=kvstore, key="some_key") == "some_value"


def test_save_collection_value_expect_insert(kvstore: FakeKVStoreCollections) -> None:
    save_collection_value(kvstore=kvstore, key="some_key", value="some_value")
    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": "some_key", "value": "some_value"}
    ]


@pytest.mark.parametrize("kvstore", [[("some_key", "old_value")]], indirect=True)
def test_save_collection_value_expect_update(kvstore: FakeKVStoreCollections) -> None:
    key = "some_key"
    value = "update_value"

    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": key, "value": "old_value"}
    ]
    save_collection_value(kvstore=kvstore, key=key, value=value)
    assert kvstore[KV_COLLECTION_NAME].data.query() == [{"_key": key, "value": value}]


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


@pytest.mark.parametrize(
    "kvstore",
    [[(CollectionKeys.START_DATE.value, "non_date_parseable_value")]],
    indirect=True,
)
def test_get_start_date_expect_none(kvstore: FakeKVStoreCollections) -> None:
    assert get_start_date(kvstore=kvstore) is None


@pytest.mark.parametrize(
    "kvstore",
    [[(CollectionKeys.START_DATE.value, "2000-01-01T00:00:00+00:00")]],
    indirect=True,
)
def test_get_start_date_expect_date(kvstore: FakeKVStoreCollections) -> None:
    assert get_start_date(kvstore) == datetime(2000, 1, 1, 0, 0, tzinfo=timezone.utc)


def test_get_last_ingested_tenant_id_expect_none(
    kvstore: FakeKVStoreCollections,
) -> None:
    assert get_last_ingested_tenant_id(kvstore=kvstore) is None


@pytest.mark.parametrize(
    "kvstore",
    [[(CollectionKeys.LAST_INGESTED_TENANT_ID.value, "11111")]],
    indirect=True,
)
def test_get_last_ingested_tenant_id_expect_integer(
    kvstore: FakeKVStoreCollections,
) -> None:
    assert get_last_ingested_tenant_id(kvstore=kvstore) == 11111


@freeze_time("2000-01-01T00:00:00+00:00")
def test_save_last_ingested_tenant_id_expect_new_tenant_id_and_new_start_date(
    kvstore: FakeKVStoreCollections,
) -> None:
    # First run will not have data yet.
    with pytest.raises(KeyError, match="'event_ingestion_collection'"):
        kvstore[KV_COLLECTION_NAME]

    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=11111)
    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": CollectionKeys.START_DATE.value, "value": "1999-12-02T00:00:00+00:00"},
        {"_key": CollectionKeys.LAST_INGESTED_TENANT_ID.value, "value": 11111},
    ]


@pytest.mark.parametrize(
    "kvstore",
    [
        [
            (CollectionKeys.START_DATE.value, "1999-12-12T00:00:00+00:00"),
            (CollectionKeys.LAST_INGESTED_TENANT_ID.value, 11111),
        ]
    ],
    indirect=True,
)
@freeze_time("2000-01-01T00:00:00+00:00")
def test_save_last_ingested_tenant_id_expect_updated_tenant_id_and_updated_start_date(
    kvstore: FakeKVStoreCollections,
) -> None:
    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": CollectionKeys.START_DATE.value, "value": "1999-12-12T00:00:00+00:00"},
        {"_key": CollectionKeys.LAST_INGESTED_TENANT_ID.value, "value": 11111},
    ]
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=22222)
    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": CollectionKeys.START_DATE.value, "value": "1999-12-02T00:00:00+00:00"},
        {"_key": CollectionKeys.LAST_INGESTED_TENANT_ID.value, "value": 22222},
    ]


@pytest.mark.parametrize(
    "kvstore",
    [
        [
            (CollectionKeys.START_DATE.value, "1999-12-12"),
            (CollectionKeys.LAST_INGESTED_TENANT_ID.value, 11111),
        ]
    ],
    indirect=True,
)
def test_save_last_ingested_tenant_id_expect_same_tenant_id(
    kvstore: FakeKVStoreCollections,
) -> None:
    save_last_ingested_tenant_id(kvstore=kvstore, tenant_id=11111)
    assert kvstore[KV_COLLECTION_NAME].data.query() == [
        {"_key": CollectionKeys.START_DATE.value, "value": "1999-12-12"},
        {"_key": CollectionKeys.LAST_INGESTED_TENANT_ID.value, "value": 11111},
    ]


def test_get_last_fetched_expect_none(kvstore: FakeKVStoreCollections) -> None:
    assert get_last_fetched(kvstore=kvstore) is None


def test_get_default_ingest_full_event_data_value(
    storage_passwords: FakeStoragePasswords,
) -> None:
    assert get_ingest_full_event_data(storage_passwords=storage_passwords) is False


@pytest.mark.parametrize(
    "kvstore",
    [
        [
            (
                CollectionKeys.TIMESTAMP_LAST_FETCH.value,
                datetime(2000, 1, 1, 12, 0, 0).isoformat(),
            )
        ]
    ],
    indirect=True,
)
def test_get_last_fetched_expect_datetime(kvstore: FakeKVStoreCollections) -> None:
    assert get_last_fetched(kvstore=kvstore) == datetime(2000, 1, 1, 12, 0, 0)


def test_fetch_feed_expect_exception(
    logger: FakeLogger, kvstore: FakeKVStoreCollections
) -> None:
    for _ in fetch_feed(
        logger=logger,
        kvstore=kvstore,
        api_key="some_key",
        tenant_id=11111,
        ingest_full_event_data=True,
        severities=[],
        source_types=[],
    ):
        pass

    assert logger.messages == [
        "INFO: Fetching tenant_id=11111, next=None, start_date=None",
        "ERROR: Exception=Failed to fetch API Token",
    ]


def test_fetch_feed_expect_feed_response(
    logger: FakeLogger,
    kvstore: FakeKVStoreCollections,
) -> None:
    first_item = ({"actor": "this guy"}, "first_next_token")
    second_item = ({"actor": "some other guy"}, "second_next_token")
    expected_items = [first_item, second_item]

    index = 0
    for event, next_token in fetch_feed(
        logger=logger,
        kvstore=kvstore,
        api_key="some_key",
        tenant_id=11111,
        ingest_full_event_data=True,
        severities=[],
        source_types=[],
        flare_api_cls=FakeFlareAPI,
    ):
        assert event == expected_items[index][0]
        assert next_token == expected_items[index][1]
        index += 1

    assert logger.messages == [
        "INFO: Fetching tenant_id=11111, next=None, start_date=None"
    ]


@pytest.mark.parametrize(
    "kvstore",
    [
        [
            (
                CollectionKeys.TIMESTAMP_LAST_FETCH.value,
                datetime(2000, 1, 1, 12, 0, 0).isoformat(),
            ),
        ]
    ],
    indirect=True,
)
@freeze_time("2000-01-01 12:09:00")
def test_main_expect_early_return(
    logger: FakeLogger,
    storage_passwords: FakeStoragePasswords,
    kvstore: FakeKVStoreCollections,
) -> None:
    main(
        logger=logger,
        storage_passwords=storage_passwords,
        kvstore=kvstore,
        flare_api_cls=FakeFlareAPI,
    )
    logger.messages == [
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
    kvstore: FakeKVStoreCollections,
) -> None:
    main(
        logger=logger,
        storage_passwords=storage_passwords,
        kvstore=kvstore,
        flare_api_cls=FakeFlareAPI,
    )
    assert logger.messages == [
        "INFO: Fetching tenant_id=11111, next=None, start_date=FakeDatetime(1999, 12, 2, 0, 0, tzinfo=datetime.timezone.utc)",
        "INFO: Fetched 2 events",
    ]
