import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_successful_registration(client: AsyncClient):
    """Тест успешной регистрации."""
    registration_data = {
        "email": "newuser@example.com",
        "password": "StrongPassword123!",
        "name": "New User",
        "phone": "+79991234567"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    print(f"Response status: {response.status_code}")
    print(f"Response body: {response.text}")
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    data = response.json()
    
    assert "id" in data
    assert data["email"] == registration_data["email"]
    assert data["name"] == registration_data["name"]
    assert data["phone"] == registration_data["phone"]
    assert "hashed_password" not in data  


@pytest.mark.anyio
async def test_registration_without_optional_fields(client: AsyncClient):
    """Тест регистрации без необязательных полей."""
    registration_data = {
        "email": "simple@example.com",
        "password": "SimplePass123!",  
        "name": "Simple User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    print(f"Response status: {response.status_code}")
    
    assert response.status_code == 201, f"Expected 201, got {response.status_code}: {response.text}"
    
    data = response.json()
    
    assert data["email"] == registration_data["email"]
    assert data["name"] == registration_data["name"]
    assert data["phone"] is None


@pytest.mark.anyio
async def test_duplicate_email_registration(client: AsyncClient, test_user):
    """Тест регистрации с уже существующим email."""
    registration_data = {
        "email": test_user.email, 
        "password": "AnotherPassword123!", 
        "name": "Another User",
        "phone": "+79998765432"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    print(f"Duplicate email response: {response.status_code}")
    print(f"Response: {response.text}")
    
    assert response.status_code == 400
    data = response.json()
    assert "detail" in data


@pytest.mark.anyio
async def test_registration_invalid_email(client: AsyncClient):
    """Тест регистрации с некорректным email."""
    registration_data = {
        "email": "invalid-email", 
        "password": "Password123!",
        "name": "Invalid Email User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    
    print(f"Invalid email response: {response.status_code}")
    
    assert response.status_code == 422


@pytest.mark.anyio
async def test_registration_weak_password(client: AsyncClient):
    """Тест регистрации со слабым паролем."""
    
    
    
    registration_data = {
        "email": "short@example.com",
        "password": "Ab1!",  
        "name": "Short Password User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
    
    registration_data = {
        "email": "nodigit@example.com",
        "password": "NoDigitPass!",
        "name": "No Digit User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
    
    registration_data = {
        "email": "noupper@example.com",
        "password": "noupper123!",
        "name": "No Upper User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
    
    registration_data = {
        "email": "nolower@example.com",
        "password": "NOLOWER123!",
        "name": "No Lower User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
    
    registration_data = {
        "email": "nospecial@example.com",
        "password": "NoSpecial123",  
        "name": "No Special User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
    
    registration_data = {
        "email": "invalidspecial@example.com",
        "password": "InvalidPass123-",  
        "name": "Invalid Special User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_registration_missing_required_fields(client: AsyncClient):
    """Тест регистрации без обязательных полей."""
    

    registration_data = {
        "password": "Password123!",
        "name": "No Email User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    

    registration_data = {
        "email": "nopass@example.com",
        "name": "No Password User"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422
    
   
    registration_data = {
        "email": "noname@example.com",
        "password": "Password123!"
    }
    
    response = await client.post("/auth/register", json=registration_data)
    assert response.status_code == 422


@pytest.mark.anyio
async def test_registration_with_valid_special_characters(client: AsyncClient):
    """Тест регистрации с допустимыми специальными символами."""
    test_chars = ["!", "@", "#", "$", "%", "&", "*", "(", ")", "."]
    
    for i, special in enumerate(test_chars):
        registration_data = {
            "email": f'user{i}@example.com',
            "password": f'ValidPass123{special}',
            "name": f"User {i}"
        }
        
        response = await client.post("/auth/register", json=registration_data)
        
        print(f"Testing special character '{special}': status={response.status_code}")
        
        
        assert response.status_code in [201, 400], f"Unexpected error with special character '{special}': {response.text}"
        
        if response.status_code == 201:
            data = response.json()
            assert data["email"] == registration_data["email"]


@pytest.mark.anyio
async def test_registration_with_invalid_special_characters(client: AsyncClient):
    """Тест регистрации с недопустимыми специальными символами."""
    
    invalid_special_chars = ["-", "_", "+", "=", "~", "`", "[", "]", ";", "'", "\\", "/"]
    
    for i, special in enumerate(invalid_special_chars[:3]): 
        registration_data = {
            "email": f"invalid{i}@example.com",
            "password": f"InvalidPass123{special}",
            "name": f"Invalid {i}"
        }
        
        response = await client.post("/auth/register", json=registration_data)
        
        print(f"Testing invalid special character '{special}': status={response.status_code}")
        
        
        assert response.status_code == 422, f"Expected validation error for character '{special}', got {response.status_code}"
        
        
        if response.status_code == 422:
            error_data = response.json()
            
            assert any("пароль" in detail.get("msg", "").lower() for detail in error_data.get("detail", []))