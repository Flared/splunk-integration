import json
import os
import splunk
import sys

from urllib import parse


sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))
from flare import FlareAPI
from logger import Logger


class FlareValidateApiKey(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        payload = self.request["payload"]
        params = parse.parse_qs(payload)

        if "apiKey" not in params:
            raise Exception("API Key is required")

        flare_api = FlareAPI(api_key=params["apiKey"][0])
        flare_api.fetch_api_key_validation()
        self.response.setHeader("Content-Type", "application/json")
        self.response.write(json.dumps({}))


class FlareUserTenants(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        logger = Logger(class_name=__file__)
        payload = self.request["payload"]
        params = parse.parse_qs(payload)

        if "apiKey" not in params:
            raise Exception("API Key is required")

        flare_api = FlareAPI(api_key=params["apiKey"][0])
        response = flare_api.fetch_tenants()
        response_json = response.json()
        logger.debug(f"FlareUserTenants: {response_json}")
        self.response.setHeader("Content-Type", "application/json")
        self.response.write(json.dumps(response_json))


class FlareFiltersSeverity(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        logger = Logger(class_name=__file__)
        payload = self.request["payload"]
        params = parse.parse_qs(payload)

        if "apiKey" not in params:
            raise Exception("API Key is required")

        flare_api = FlareAPI(api_key=params["apiKey"][0])
        response = flare_api.fetch_filters_severity()
        response_json = response.json()
        logger.debug(f"FlareFiltersSeverity: {response_json}")
        self.response.setHeader("Content-Type", "application/json")
        self.response.write(json.dumps(response_json))


class FlareFiltersSourceTypes(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        logger = Logger(class_name=__file__)
        payload = self.request["payload"]
        params = parse.parse_qs(payload)

        if "apiKey" not in params:
            raise Exception("API Key is required")

        flare_api = FlareAPI(api_key=params["apiKey"][0])
        response = flare_api.fetch_filters_source_types()
        response_json = response.json()
        logger.debug(f"FlareFiltersSourceTypes: {response_json}")
        self.response.setHeader("Content-Type", "application/json")
        self.response.write(json.dumps(response_json))
