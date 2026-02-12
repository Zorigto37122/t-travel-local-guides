from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.auth.auth import auth_backend, fastapi_users
from src.schemas.user import UserRead, UserCreate, UserUpdate
from src.database import get_session
from src.models import Guide, Client
from src.auth.manager import get_user_manager
from fastapi_users import BaseUserManager

http_bearer = HTTPBearer(auto_error=False)

router = APIRouter(dependencies=[Depends(http_bearer)])

# /login /logout
router.include_router(
    fastapi_users.get_auth_router(auth_backend),
    prefix="/auth/jwt",
    tags=["auth"],
)

# Custom /register endpoint to handle is_guide
@router.post("/auth/register", response_model=UserRead, status_code=status.HTTP_201_CREATED, tags=["auth"])
async def register(
    user_create: UserCreate,
    user_manager: BaseUserManager = Depends(get_user_manager),
    session: AsyncSession = Depends(get_session),
):
    """Custom registration endpoint that handles guide profile creation."""
    from src.models import User
    
    # Extract is_guide before creating user (fastapi-users doesn't handle custom fields)
    is_guide = user_create.is_guide
    
    # Create user using fastapi_users (this will use the same session)
    user = await user_manager.create(user_create)
    
    # Ensure we have the user ID
    user_id = user.id
    
    # Update is_guide field directly using SQL update to avoid session issues
    await session.execute(
        update(User).where(User.id == user_id).values(is_guide=is_guide)
    )
    
    # Create client profile for all users
    client_result = await session.execute(
        select(Client).where(Client.user_id == user_id)
    )
    client = client_result.scalar_one_or_none()
    
    if client is None:
        client = Client(user_id=user_id)
        session.add(client)
    
    # If user selected to be a guide, create guide profile
    if is_guide:
        guide_result = await session.execute(
            select(Guide).where(Guide.user_id == user_id)
        )
        guide = guide_result.scalar_one_or_none()
        
        if guide is None:
            guide = Guide(user_id=user_id)
            session.add(guide)
    
    await session.commit()
    
    # Get the updated user from the database
    user_result = await session.execute(
        select(User).where(User.id == user_id)
    )
    user_in_session = user_result.scalar_one()
    
    return user_in_session

# /users
router.include_router(
    fastapi_users.get_users_router(UserRead, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# /request-verify-token /verify
router.include_router(
    fastapi_users.get_verify_router(UserRead),
    prefix="/auth",
    tags=["auth"],
)

# /forgot-password /reset-password
router.include_router(
    fastapi_users.get_reset_password_router(),
    prefix="/auth",
    tags=["auth"],
)
