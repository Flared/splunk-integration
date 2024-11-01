import logging
import os
import tempfile

from constants import APP_NAME
from logging.handlers import TimedRotatingFileHandler
from typing import Any


class Logger:
    def __init__(self, *, class_name: str) -> None:
        SPLUNK_HOME = os.environ.get("SPLUNK_HOME")
        is_local_build = False
        log_filepath = ""
        if SPLUNK_HOME:
            log_filepath = os.path.join(
                SPLUNK_HOME, "var", "log", "splunk", "{}.log".format(APP_NAME)
            )
            APPLICATION_FOLDER = os.path.join(SPLUNK_HOME, "etc", "apps", APP_NAME)
            is_local_build = os.path.islink(APPLICATION_FOLDER)
        else:
            log_filepath = os.path.join(
                tempfile.gettempdir(), "{}.log".format(APP_NAME)
            )

        self.tag_name = os.path.splitext(os.path.basename(class_name))[0]
        self._logger = logging.getLogger("flare-{}".format(self.tag_name))

        if is_local_build:
            # If the application is a symlink, it's been installed locally
            self._logger.setLevel(logging.DEBUG)
        else:
            self._logger.setLevel(logging.ERROR)
        formatter = logging.Formatter("%(asctime)s %(levelname)-5s %(message)s")
        handler = TimedRotatingFileHandler(
            log_filepath, when="d", interval=1, backupCount=5
        )
        handler.setFormatter(formatter)
        self._logger.addHandler(handler)

    def debug(self, msg: Any) -> None:
        self._logger.debug(msg="{}: {}".format(self.tag_name, msg))

    def info(self, msg: Any) -> None:
        self._logger.info(msg="{}: {}".format(self.tag_name, msg))

    def warning(self, msg: Any) -> None:
        self._logger.warning(msg="{}: {}".format(self.tag_name, msg))

    def error(self, msg: Any) -> None:
        self._logger.error(msg="{}: {}".format(self.tag_name, msg))

    def exception(self, msg: Any) -> None:
        self._logger.exception(msg="{}: {}".format(self.tag_name, msg))

    def critical(self, msg: Any) -> None:
        self._logger.critical(msg="{}: {}".format(self.tag_name, msg))
