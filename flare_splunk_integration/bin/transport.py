from http.client import HTTPMessage
from typing import Optional
from requests import PreparedRequest, post, Session
import sys

from datetime import datetime
from requests.auth import AuthBase

from urllib.error import HTTPError

APP_NAME = 'flare_splunk_integration'

class FlareAuthenticationHandler(AuthBase):

    def __init__(self, *, app):
        # Should be able to use app.service.storage_passwords.get(),
        # but I can't seem to get that to work. list() works.
        server_key : Optional[str] = None
        tenant_id : Optional[str] = None
        for item in app.service.storage_passwords.list():
            if item.content.username == 'serverkey':
                server_key = item.clear_password

            if item.content.username == 'tenantid':
                tenant_id = item.clear_password

        self.generate_token_path = app.service.confs["flare"]["endpoints"]["generate_token_endpoint"]
        self.api_key = server_key
        self.tenant_id = tenant_id

    def is_valid_token(self):
        if not hasattr(self, 'access_token'):
            return False

        # refresh tokens are stored in cookies
        now_timestamp = int(round(datetime.timestamp(datetime.now())))
        return self.access_token['refresh_token_exp'] - 60 > now_timestamp

    def get_access_token(self):
        if self.api_key is None:
            raise Exception("API Key is empty. Cannot retrieve access token")
        if self.tenant_id is None:
            raise Exception("Tenant ID is empty. Cannot retrieve access token")
        
        resp = post(
            url=self.generate_token_path,
            data={'tenant_id': self.tenant_id},
            headers={
                'Authorization': self.api_key,
            }
        )

        if resp.status_code != 200:
            # This is a bit of a hack in order to see the error message within Splunk search.
            print(resp.text, file=sys.stderr)
            headers = HTTPMessage()
            for key, value in resp.headers.items():
                headers.add_header(key, value)
            raise HTTPError(url=self.generate_token_path,
                code=resp.status_code,
                msg=resp.text,
                hdrs=headers,
                fp=None
            )

        self.access_token = resp.json()

    def authorize(self, request) -> PreparedRequest:
        if not self.is_valid_token():
            self.get_access_token()

        session = Session()
        prepared_request : PreparedRequest = session.prepare_request(request=request)
        prepared_request.headers['Authorization'] = 'Bearer '+ self.access_token['token']
        return prepared_request
