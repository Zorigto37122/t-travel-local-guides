from src.auth.auth import fastapi_users

current_user = fastapi_users.current_user(active=True)
