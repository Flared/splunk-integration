import json
import os
import splunk
import sys

from typing import Any


sys.path.insert(0, os.path.join(os.path.dirname(__file__), "vendor"))
from flareio import FlareApiClient


def parseParams(payload: str) -> dict[str, Any]:
    params = {}
    for param_entry in payload.split("&"):
        param = param_entry.split("=", 1)
        params[param[0]] = param[1]
    return params


class FlareUserTenants(splunk.rest.BaseRestHandler):
    def handle_POST(self) -> None:
        payload = self.request["payload"]
        params = parseParams(payload)
        self.flare_client = FlareApiClient(api_key=params["apiKey"])
        user_tenants_response = self.flare_client.get("firework/v2/me/tenants")
        self.response.setHeader("Content-Type", "application/json")
        self.response.write(json.dumps(user_tenants_response.json()))
