from datetime import timedelta
from enum import Enum


APP_NAME = "flare"
HOST = "localhost"
SPLUNK_PORT = 8089
REALM = APP_NAME + "_realm"
KV_COLLECTION_NAME = "event_ingestion_collection"
CRON_JOB_THRESHOLD_SINCE_LAST_FETCH = timedelta(minutes=10)


class PasswordKeys(Enum):
    API_KEY = "api_key"
    TENANT_ID = "tenant_id"


class CollectionKeys(Enum):
    CURRENT_TENANT_ID = "current_tenant_id"
    START_DATE = "start_date"
    TIMESTAMP_LAST_FETCH = "timestamp_last_fetch"

    @staticmethod
    def get_next_token(tenantId: int) -> str:
        return f"next_{tenantId}"
