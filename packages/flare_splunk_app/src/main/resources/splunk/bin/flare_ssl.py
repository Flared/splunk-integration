"""TLS helpers for requests sessions that skip certificate verification.

Passing ``verify=False`` to requests leaves urllib3's SSLContext unset, and
urllib3 then falls back to ``SSLContext.load_default_certs()``. On Windows that
reads the OS certificate store, so a single malformed entry aborts the handshake
with "[ASN1: NOT_ENOUGH_DATA]" even though verification was meant to be off.
Splunk's bundled Python 3.9 rejects that entry while 3.13 parses it, which is
why the failure only surfaces in the scheduled input. Supplying an explicit
context keeps verification disabled without ever reading the OS store.
"""

import ssl

from requests.adapters import HTTPAdapter
from typing import Any


def build_unverified_ssl_context() -> ssl.SSLContext:
    """Build an SSLContext with verification disabled that loads no CA store."""
    # ssl.create_default_context() would itself call load_default_certs(), so the
    # context is constructed directly.
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
    # check_hostname must be cleared before verify_mode, otherwise stdlib raises.
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    return context


class UnverifiedHTTPAdapter(HTTPAdapter):
    """HTTPAdapter that injects an explicit unverified SSLContext."""

    def init_poolmanager(self, *args: Any, **kwargs: Any) -> Any:
        kwargs["ssl_context"] = build_unverified_ssl_context()
        return super().init_poolmanager(*args, **kwargs)

    def proxy_manager_for(self, *args: Any, **kwargs: Any) -> Any:
        kwargs["ssl_context"] = build_unverified_ssl_context()
        return super().proxy_manager_for(*args, **kwargs)