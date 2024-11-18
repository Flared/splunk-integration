import json
import os
import splunk
import sys

from urllib import parse


sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))
from flare import FlareAPI
from logger import Logger


class FlareUserTenants(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        logger = Logger(class_name=__file__)
        payload = self.request["payload"]
        params = parse.parse_qs(payload)

        if "apiKey" in params:
            flare_api = FlareAPI(api_key=params["apiKey"][0])
            user_tenants_response = flare_api.fetch_tenants()
            tenants_response = user_tenants_response.json()
            logger.debug(tenants_response)
            self.response.setHeader("Content-Type", "application/json")
            self.response.write(json.dumps(tenants_response))
        else:
            raise Exception("API Key is required")
