from data_store import ConfigDataStore
from datetime import datetime
from datetime import timezone


def test_get_and_set_last_fetch(data_store: ConfigDataStore) -> None:
    date = datetime(2024, 3, 6, 14, 0, 0, tzinfo=timezone.utc)
    data_store.set_last_fetch(date)
    assert data_store.get_last_fetch() == date


def test_get_and_set_next_by_tenant(data_store: ConfigDataStore) -> None:
    tenant_id = 789
    next_token = "next_token_value"
    data_store.set_next_by_tenant(tenant_id, next_token)
    assert data_store.get_next_by_tenant(tenant_id) == "next_token_value"


def test_get_and_set_earliest_ingested_by_tenant(data_store: ConfigDataStore) -> None:
    tenant_id = 789
    date = datetime(2024, 3, 6, 14, 0, 0, tzinfo=timezone.utc)
    data_store.set_earliest_ingested_by_tenant(tenant_id, date)
    assert data_store.get_earliest_ingested_by_tenant(tenant_id) == date
