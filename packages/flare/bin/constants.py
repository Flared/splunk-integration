from datetime import timedelta
from enum import Enum


APP_NAME = "flare"
HOST = "localhost"
SPLUNK_PORT = 8089
REALM = APP_NAME + "_realm"
CRON_JOB_THRESHOLD_SINCE_LAST_FETCH = timedelta(minutes=10)


class PasswordKeys(Enum):
    API_KEY = "api_key"
    TENANT_ID = "tenant_id"
    INGEST_FULL_EVENT_DATA = "ingest_full_event_data"
    SEVERITIES_FILTER = "severities_filter"
    SOURCE_TYPES_FILTER = "source_types_filter"


class DataStoreKeys(Enum):
    LAST_INGESTED_TENANT_ID = "last_ingested_tenant_id"
    START_DATE = "start_date"
    TIMESTAMP_LAST_FETCH = "timestamp_last_fetch"

    @staticmethod
    def get_next_token(tenant_id: int) -> str:
        return f"next_{tenant_id}"
