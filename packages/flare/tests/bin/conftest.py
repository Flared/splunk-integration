import os
import pytest
import sys


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../../bin"))


from data_store import ConfigDataStore
from datetime import datetime
from typing import List
from typing import Optional
from unittest import mock


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
        ingest_full_event_data: bool,
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
def storage_passwords(request: pytest.FixtureRequest) -> FakeStoragePasswords:
    passwords: list[FakeStoragePassword] = []
    data: list[tuple[str, str]] = request.param if hasattr(request, "param") else []

    if data:
        for item in data:
            passwords.append(
                FakeStoragePassword(username=item[0], clear_password=item[1])
            )

    return FakeStoragePasswords(passwords=passwords)


@pytest.fixture
def logger() -> FakeLogger:
    return FakeLogger()


@pytest.fixture
def mock_config_file(tmp_path):
    # Creates a temporary config file for testing.
    config_file = tmp_path / "data_store.conf"
    with open(config_file, "w") as f:
        f.write("[metadata]\n")
    return config_file


@pytest.fixture
def mock_env(mock_config_file):
    # Mocks environment variable and file interactions.
    with mock.patch.dict(os.environ, {"SPLUNK_HOME": str(mock_config_file.parent)}):
        with mock.patch("builtins.open", mock.mock_open(read_data="[metadata]\n")):
            yield


@pytest.fixture
def data_store(mock_env):
    # Reset singleton instance
    ConfigDataStore._instance = None

    # Creates an instance of ConfigDataStore with mocked dependencies.
    with mock.patch("configparser.ConfigParser.read") as mock_read:
        mock_read.return_value = None
        store = ConfigDataStore()
        store._commit = lambda: None
        yield store
