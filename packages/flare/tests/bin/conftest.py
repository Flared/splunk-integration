import json
import os
import pytest
import sys

from datetime import datetime
from pytest import FixtureRequest
from typing import Any
from typing import Dict
from typing import List
from typing import Optional


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))
from constants import KV_COLLECTION_NAME


class FakeStoragePassword:
    def __init__(self, username: str, clear_password: str) -> None:
        self._state = {
            "username": username,
            "clear_password": clear_password,
        }

    @property
    def content(self: "FakeStoragePassword") -> "FakeStoragePassword":
        return self

    @property
    def username(self) -> str:
        return self._state["username"]

    @property
    def clear_password(self) -> str:
        return self._state["clear_password"]


class FakeStoragePasswords:
    def __init__(self, passwords: List[FakeStoragePassword]) -> None:
        self._passwords = passwords

    def list(self) -> List[FakeStoragePassword]:
        return self._passwords


class FakeKVStoreCollectionData:
    def __init__(self) -> None:
        self._data: dict[str, str] = {}

    def insert(self, data: str) -> dict[str, str]:
        entry = json.loads(data)
        self._data[entry["_key"]] = entry["value"]
        return entry

    def update(self, id: str, data: str) -> dict[str, str]:
        entry = json.loads(data)
        self._data[id] = entry["value"]
        return entry

    def query(self, **query: dict) -> List[Dict[str, str]]:
        return [{"_key": key, "value": value} for key, value in self._data.items()]


class FakeKVStoreCollection:
    def __init__(self) -> None:
        self._data = FakeKVStoreCollectionData()

    @property
    def data(self) -> FakeKVStoreCollectionData:
        return self._data


class FakeKVStoreCollections:
    def __init__(self) -> None:
        self._collections: dict[str, Any] = {}

    def __getitem__(self, key: str) -> FakeKVStoreCollection:
        return self._collections[key]

    def __contains__(self, key: str) -> bool:
        return key in self._collections

    def create(self, name: str, fields: dict) -> dict[str, Any]:
        self._collections[name] = FakeKVStoreCollection()
        return {"headers": {}, "reason": "Created", "status": 200, "body": ""}


class FakeLogger:
    def __init__(self) -> None:
        self.messages: List[str] = []

    def info(self, message: str) -> None:
        self.messages.append(f"INFO: {message}")

    def error(self, message: str) -> None:
        self.messages.append(f"ERROR: {message}")


class FakeFlareAPI:
    def __init__(self, api_key: str, tenant_id: int) -> None:
        pass

    def fetch_feed_events(
        self,
        next: Optional[str],
        start_date: Optional[datetime],
        ingest_metadata_only: bool,
        severities: list[str],
        source_types: list[str],
    ) -> List[tuple[dict, str]]:
        return [
            (
                {"actor": "this guy"},
                "first_next_token",
            ),
            (
                {"actor": "some other guy"},
                "second_next_token",
            ),
        ]


@pytest.fixture
def storage_passwords(request: FixtureRequest) -> FakeStoragePasswords:
    passwords: list[FakeStoragePassword] = []
    data: list[tuple[str, str]] = request.param if hasattr(request, "param") else []

    if data:
        for item in data:
            passwords.append(
                FakeStoragePassword(username=item[0], clear_password=item[1])
            )

    return FakeStoragePasswords(passwords=passwords)


@pytest.fixture
def kvstore(request: FixtureRequest) -> FakeKVStoreCollections:
    kvstore = FakeKVStoreCollections()
    data: list[tuple[str, str]] = request.param if hasattr(request, "param") else []

    if data:
        kvstore.create(name=KV_COLLECTION_NAME, fields={})
        for item in data:
            kvstore[KV_COLLECTION_NAME].data.insert(
                json.dumps({"_key": item[0], "value": item[1]})
            )

    return kvstore


@pytest.fixture
def logger() -> FakeLogger:
    return FakeLogger()
