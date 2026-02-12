// Определяем базовый URL API
// Vite требует, чтобы переменные окружения начинались с VITE_
// и были доступны через import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Функция для перевода ошибок на русский язык
export function translateError(errorMessage) {
  if (!errorMessage) return "Произошла ошибка";
  
  const errorLower = errorMessage.toLowerCase();
  const errorUpper = errorMessage.toUpperCase();
  
  // Ошибки авторизации (конкретные коды ошибок)
  if (errorUpper.includes("LOGIN_BAD_CREDENTIALS") || errorLower.includes("login_bad_credentials")) {
    return "Неверный email или пароль";
  }
  if (errorLower.includes("bad credentials") || errorLower.includes("invalid credentials")) {
    return "Неверный email или пароль";
  }
  if (errorLower.includes("incorrect password") || errorLower.includes("wrong password")) {
    return "Неверный пароль";
  }
  if (errorLower.includes("user not found") || errorLower.includes("user does not exist")) {
    return "Пользователь с таким email не найден";
  }
  
  // Ошибки регистрации (конкретные коды ошибок)
  if (errorUpper.includes("REGISTER_USER_ALREADY_EXISTS") || errorLower.includes("register_user_already_exists")) {
    return "Пользователь с таким email уже зарегистрирован";
  }
  if (errorLower.includes("email already registered") || errorLower.includes("email already exists")) {
    return "Пользователь с таким email уже зарегистрирован";
  }
  
  // Ошибки валидации полей
  if (errorLower.includes("string should have at least") || 
      errorLower.includes("ensure this value has at least") ||
      errorLower.includes("string should have at least")) {
    if (errorLower.includes("10") || errorMessage.match(/at least\s+10/i)) {
      return "Телефон должен содержать минимум 10 символов";
    }
    if (errorLower.includes("8") || errorMessage.match(/at least\s+8/i)) {
      return "Пароль должен содержать минимум 8 символов";
    }
    if (errorLower.includes("2") || errorMessage.match(/at least\s+2/i)) {
      return "Имя должно содержать минимум 2 символа";
    }
    // Общий случай - извлекаем число из сообщения
    const match = errorMessage.match(/at least\s+(\d+)|(\d+)\s+characters?/i);
    if (match) {
      const num = match[1] || match[2];
      return `Поле должно содержать минимум ${num} символов`;
    }
    return "Поле слишком короткое";
  }
  if (errorLower.includes("password") && errorLower.includes("weak")) {
    return "Пароль слишком слабый";
  }
  if (errorLower.includes("password") && errorLower.includes("minimum")) {
    return "Пароль должен содержать минимум 8 символов";
  }
  if (errorLower.includes("password") && errorLower.includes("uppercase") || errorLower.includes("заглавную")) {
    return "Пароль должен содержать заглавную букву";
  }
  if (errorLower.includes("password") && errorLower.includes("lowercase") || errorLower.includes("строчную")) {
    return "Пароль должен содержать строчную букву";
  }
  if (errorLower.includes("password") && errorLower.includes("digit") || errorLower.includes("цифру")) {
    return "Пароль должен содержать цифру";
  }
  if (errorLower.includes("password") && errorLower.includes("special") || errorLower.includes("специальный")) {
    return "Пароль должен содержать специальный символ";
  }
  
  // Ошибки валидации
  if (errorLower.includes("invalid email") || errorLower.includes("email format")) {
    return "Неверный формат email";
  }
  if (errorLower.includes("phone") && errorLower.includes("invalid") || errorLower.includes("формат")) {
    return "Неверный формат телефона";
  }
  
  // Ошибки сети
  if (errorLower.includes("failed to fetch") || errorLower.includes("network error")) {
    return "Ошибка подключения к серверу. Проверьте подключение к интернету";
  }
  if (errorLower.includes("timeout")) {
    return "Превышено время ожидания ответа от сервера";
  }
  
  // Ошибки бронирования
  if (errorLower.includes("no available") || errorLower.includes("нет свободных мест")) {
    return "На выбранную дату и время нет свободных мест";
  }
  if (errorLower.includes("booking") && errorLower.includes("error")) {
    return "Не удалось забронировать экскурсию";
  }
  
  // Общие ошибки
  if (errorLower.includes("unauthorized") || errorLower.includes("401")) {
    return "Необходимо войти в систему";
  }
  if (errorLower.includes("forbidden") || errorLower.includes("403")) {
    return "Доступ запрещен";
  }
  if (errorLower.includes("not found") || errorLower.includes("404")) {
    return "Запрашиваемый ресурс не найден";
  }
  if (errorLower.includes("server error") || errorLower.includes("500")) {
    return "Ошибка сервера. Попробуйте позже";
  }
  
  // Если ошибка уже на русском или не распознана, возвращаем как есть
  return errorMessage;
}

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
          .map((err) => {
            // Обрабатываем разные форматы ошибок
            if (typeof err === "string") {
              return err;
            }
            if (err.msg) {
              return err.msg;
            }
            if (err.type) {
              return err.type;
            }
            return JSON.stringify(err);
          })
          .join("\n");
      } else if (data.detail && typeof data.detail === "string") {
        message = data.detail;
      } else if (data.detail && typeof data.detail === "object") {
        // Если detail это объект, пытаемся извлечь сообщение
        message = data.detail.msg || data.detail.message || JSON.stringify(data.detail);
      } else if (data.message) {
        message = data.message;
      } else {
        message = JSON.stringify(data);
      }
    } catch {
      try {
        message = await response.text();
      } catch {
        message = "Ошибка запроса";
      }
    }
    throw new Error(translateError(message));
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function registerUser({ name, email, phone, password, is_guide = false }) {
  const body = {
    name,
    email,
    password,
    phone: phone || null,
    is_guide: is_guide || false,
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
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
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
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
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
        throw new Error(translateError(`Не удалось подключиться к серверу (${API_BASE_URL}). Убедитесь, что бэкенд запущен и доступен.`));
      }
      throw new Error(translateError(`Ошибка сети: ${error.message}`));
    }
    throw error;
  }
}

export async function getMyBookings(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function cancelBooking(token, bookingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}/cancel`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function updateUser(token, userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

// Guide API functions
export async function getGuideProfile(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function updateGuideProfile(token, guideData) {
  try {
    // Проверяем размер данных перед отправкой
    const jsonData = JSON.stringify(guideData);
    const sizeInMB = new Blob([jsonData]).size / (1024 * 1024);
    
    if (sizeInMB > 10) {
      throw new Error("Размер фотографии слишком большой. Пожалуйста, выберите изображение размером менее 10 МБ.");
    }

    const response = await fetch(`${API_BASE_URL}/api/guides/me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: jsonData,
    });
    
    if (!response.ok) {
      // Пытаемся получить детальную информацию об ошибке
      let errorMessage = "Не удалось обновить профиль";
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map(e => e.msg || e.message || JSON.stringify(e)).join(", ");
          } else {
            errorMessage = errorData.detail;
          }
        }
      } catch {
        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      }
      throw new Error(translateError(errorMessage));
    }
    
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету и убедитесь, что сервер запущен."));
    }
    throw error;
  }
}

export async function getMyExcursions(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/excursions`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function createExcursion(token, excursionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/excursions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(excursionData),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function updateExcursion(token, excursionId, excursionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/excursions/${excursionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(excursionData),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function getGuideBookings(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/bookings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function checkIfGuide(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/check`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

