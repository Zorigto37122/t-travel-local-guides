// Определяем базовый URL API
// Vite требует, чтобы переменные окружения начинались с VITE_
// и были доступны через import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Логируем используемый URL для отладки
if (typeof window !== 'undefined') {
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("VITE_API_URL env:", import.meta.env.VITE_API_URL);
  console.log("Current hostname:", window.location.hostname);
  console.log("Current origin:", window.location.origin);
}

async function handleResponse(response) {
  if (!response.ok) {
    let message = "Ошибка запроса";
    try {
      const data = await response.json();
      if (Array.isArray(data.detail)) {
        // Ошибки валидации FastAPI/Pydantic
        message = data.detail
          .map((err) => err.msg || JSON.stringify(err))
          .join("\n");
      } else if (data.detail && typeof data.detail === "string") {
        message = data.detail;
      } else {
        message = JSON.stringify(data);
      }
    } catch {
      message = await response.text();
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function registerUser({ name, email, phone, password }) {
  const body = {
    name,
    email,
    password,
    phone: phone || null,
  };

  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return handleResponse(response);
}

export async function loginUser({ email, password }) {
  const body = new URLSearchParams({
    username: email,
    password,
  });

  const response = await fetch(`${API_BASE_URL}/auth/jwt/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  return handleResponse(response);
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return handleResponse(response);
}

export async function searchExcursions({ country, city, date, people, hasChildren }) {
  const params = new URLSearchParams();
  if (country) params.append("country", country);
  if (city) params.append("city", city);
  if (date) params.append("date", date);
  if (people) params.append("people", String(people));
  if (hasChildren) params.append("has_children", "true");

  const response = await fetch(`${API_BASE_URL}/api/excursions?${params.toString()}`);
  return handleResponse(response);
}

export async function getExcursionById(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/excursions/${id}`);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Не удалось подключиться к серверу. Проверьте подключение к интернету.");
    }
    throw error;
  }
}

export async function getAvailableDates(excursionId, people = 1) {
  try {
    const params = new URLSearchParams();
    if (people) params.append("people", String(people));
    
    const response = await fetch(`${API_BASE_URL}/api/excursions/${excursionId}/available-dates?${params.toString()}`);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error("Не удалось подключиться к серверу. Проверьте подключение к интернету.");
    }
    throw error;
  }
}

export async function createBooking({ token, excursionId, dateTimeISO, people }) {
  try {
    console.log("Creating booking:", { API_BASE_URL, excursionId, dateTimeISO, people });
    
    const response = await fetch(`${API_BASE_URL}/api/bookings`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        excursion_id: excursionId,
        date: dateTimeISO,
        number_of_people: people,
        has_children: false,
      }),
    });

    console.log("Booking response status:", response.status);
    return handleResponse(response);
  } catch (error) {
    console.error("Booking error:", error);
    if (error instanceof TypeError) {
      if (error.message === "Failed to fetch") {
        throw new Error(`Не удалось подключиться к серверу (${API_BASE_URL}). Убедитесь, что бэкенд запущен и доступен.`);
      }
      throw new Error(`Ошибка сети: ${error.message}`);
    }
    throw error;
  }
}

