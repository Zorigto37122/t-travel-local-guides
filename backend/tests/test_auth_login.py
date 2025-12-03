import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_successful_login(client: AsyncClient, test_user):
    """Тест успешного входа."""
    login_data = {
        "username": test_user.email,
        "password": "testpassword123"
    }
    
    response = await client.post("/auth/jwt/login", data=login_data)
    
    print(f"Login response status: {response.status_code}")
    print(f"Login response body: {response.text[:100]}...")
    
    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    data = response.json()
    
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert len(data["access_token"]) > 0


@pytest.mark.anyio
async def test_login_wrong_password(client: AsyncClient, test_user):
    """Тест входа с неверным паролем."""
    login_data = {
        "username": test_user.email,
        "password": "wrong_password"
    }
    
    response = await client.post("/auth/jwt/login", data=login_data)
    
    print(f"Wrong password response: {response.status_code}")
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.anyio
async def test_login_nonexistent_user(client: AsyncClient):
    """Тест входа с несуществующим пользователем."""
    login_data = {
        "username": "nonexistent@example.com",
        "password": "SomePassword123"
    }
    
    response = await client.post("/auth/jwt/login", data=login_data)
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.anyio
async def test_login_missing_credentials(client: AsyncClient):
    """Тест входа без учетных данных."""

    response = await client.post("/auth/jwt/login", data={"password": "password"})
    assert response.status_code == 422
    
    
    response = await client.post("/auth/jwt/login", data={"username": "test@example.com"})
    assert response.status_code == 422
    
    
    response = await client.post("/auth/jwt/login", data={})
    assert response.status_code == 422