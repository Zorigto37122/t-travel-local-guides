import logging

from fastapi import Depends, Request
from fastapi_users import BaseUserManager, IntegerIDMixin

from src.config import settings
from src.database.dependencies import get_user_db
from src.database.engine import async_session_factory
from src.models import User, Client

log = logging.getLogger(__name__)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = settings.RESET_PASSWORD_TOKEN_SECRET
    verification_token_secret = settings.VERIFICATION_TOKEN_SECRET

    async def on_after_register(self, user: User, request: Request | None = None):
        log.warning("User %r has registered.", user.id)

        async with async_session_factory() as session:
            client = Client(user_id=user.id)
            session.add(client)
            await session.commit()

    async def on_after_forgot_password(
            self, user: User, token: str, request: Request | None = None
    ):
        log.warning("User %r has forgot their password. Reset token: %r", user.id, token)

    async def on_after_request_verify(
            self, user: User, token: str, request: Request | None = None
    ):
        log.warning("Verification requested for user %r. Verification token: %r", user.id, token)


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
