import configparser
import os

from constants import APP_NAME
from constants import DataStoreKeys
from datetime import datetime
from typing import Optional


# Define the config file path
splunk_home = os.environ.get("SPLUNK_HOME", "/opt/splunk")
config_path = os.path.join(
    splunk_home, "etc", "apps", f"{APP_NAME}", "local", "data_store.conf"
)


class ConfigDataStore:
    _instance = None
    _store: configparser.ConfigParser

    # Make ConfigDataStore a singleton
    def __new__(cls) -> "ConfigDataStore":
        if not cls._instance:
            cls._instance = super(ConfigDataStore, cls).__new__(cls)
        return cls._instance

    def __init__(self) -> None:
        config_store = configparser.ConfigParser()
        config_store.read(config_path)

        # Add data sections
        if "metadata" not in config_store.sections():
            config_store.add_section("metadata")
        if "next_tokens" not in config_store.sections():
            config_store.add_section("next_tokens")
        self._store = config_store

    def _commit(self) -> None:
        with open(config_path, "w") as configfile:
            self._store.write(configfile)

    def get_last_tenant_id(self) -> Optional[int]:
        last_ingested_tenant_id = self._store.get(
            "metadata", DataStoreKeys.LAST_INGESTED_TENANT_ID.value, fallback=None
        )

        try:
            return int(last_ingested_tenant_id) if last_ingested_tenant_id else None
        except Exception:
            pass
        return None

    def set_last_tenant_id(self, tenant_id: int) -> None:
        self._store.set(
            "metadata", DataStoreKeys.LAST_INGESTED_TENANT_ID.value, str(tenant_id)
        )
        self._commit()

    def get_start_date(self) -> Optional[datetime]:
        start_date = self._store.get(
            "metadata", DataStoreKeys.START_DATE.value, fallback=None
        )

        if start_date:
            try:
                return datetime.fromisoformat(start_date)
            except Exception:
                pass
        return None

    def set_start_date(self, start_date: datetime) -> None:
        self._store.set(
            "metadata", DataStoreKeys.START_DATE.value, start_date.isoformat()
        )
        self._commit()

    def get_last_fetch(self) -> Optional[datetime]:
        last_fetched = self._store.get(
            "metadata", DataStoreKeys.TIMESTAMP_LAST_FETCH.value, fallback=None
        )

        if last_fetched:
            try:
                return datetime.fromisoformat(last_fetched)
            except Exception:
                pass
        return None

    def set_last_fetch(self, last_fetch: datetime) -> None:
        self._store.set(
            "metadata",
            DataStoreKeys.TIMESTAMP_LAST_FETCH.value,
            last_fetch.isoformat(),
        )
        self._commit()

    def get_next_by_tenant(self, tenant_id: int) -> Optional[str]:
        return self._store.get(
            "next_tokens",
            DataStoreKeys.get_next_token(tenantId=tenant_id),
            fallback=None,
        )

    def set_next_by_tenant(self, tenant_id: int, next: Optional[str]) -> None:
        if not next:
            return

        self._store.set(
            "next_tokens", DataStoreKeys.get_next_token(tenantId=tenant_id), next
        )
