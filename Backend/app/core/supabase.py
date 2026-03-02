from supabase import create_client, Client
from app.core.config import settings

_anon_client: Client | None = None
_service_client: Client | None = None


def get_anon_client() -> Client:
    """Return the anon/public Supabase client (lazy-initialised)."""
    global _anon_client
    if _anon_client is None:
        _anon_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
    return _anon_client


def get_service_client() -> Client:
    """Return the service-role Supabase client (lazy-initialised, bypasses RLS)."""
    global _service_client
    if _service_client is None:
        _service_client = create_client(
            settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY
        )
    return _service_client


# Backward-compatible module-level aliases (resolved on first access via property-like pattern)
# Callers can use: from app.core.supabase import anon_client, service_client
# OR call the getter functions directly.
class _ClientProxy:
    """
    Thin proxy that defers actual client creation until first attribute access.
    Allows `from app.core.supabase import anon_client` at module level without
    triggering Supabase connection at import time.
    """
    def __init__(self, getter):
        object.__setattr__(self, "_getter", getter)
        object.__setattr__(self, "_client", None)

    def _resolve(self):
        client = object.__getattribute__(self, "_client")
        if client is None:
            getter = object.__getattribute__(self, "_getter")
            client = getter()
            object.__setattr__(self, "_client", client)
        return client

    def __getattr__(self, name):
        return getattr(self._resolve(), name)

    def __repr__(self):
        return repr(self._resolve())


anon_client: Client = _ClientProxy(get_anon_client)  # type: ignore[assignment]
service_client: Client = _ClientProxy(get_service_client)  # type: ignore[assignment]
