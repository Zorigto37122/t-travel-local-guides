import { API_BASE_URL, translateError, handleResponse } from "./userApi";

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

let _locationsCache = null;
let _locationsCacheTime = 0;
const LOCATIONS_CACHE_TTL = 5 * 60 * 1000; // 5 минут

export async function getAllLocations() {
  const now = Date.now();
  if (_locationsCache && now - _locationsCacheTime < LOCATIONS_CACHE_TTL) {
    return _locationsCache;
  }
  const response = await fetch(`${API_BASE_URL}/api/locations`);
  _locationsCache = await handleResponse(response);
  _locationsCacheTime = now;
  return _locationsCache;
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

export async function getExcursionReviews(id) {
  const response = await fetch(`${API_BASE_URL}/api/excursions/${id}/reviews`);
  return handleResponse(response);
}

export async function getAvailableDates(excursionId, people = 1) {
  try {
    const params = new URLSearchParams();
    if (people) params.append("people", String(people));

    const response = await fetch(
      `${API_BASE_URL}/api/excursions/${excursionId}/available-dates?${params.toString()}`
    );
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

    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError) {
      if (error.message === "Failed to fetch") {
        throw new Error(
          translateError(
            `Не удалось подключиться к серверу (${API_BASE_URL}). Убедитесь, что бэкенд запущен и доступен.`
          )
        );
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

export async function uploadExcursionPhotos(token, photoFiles) {
  try {
    const formData = new FormData();
    photoFiles.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${API_BASE_URL}/api/uploads/excursion-photos`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = "Не удалось загрузить фотографии";
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = errorData.detail;
        }
      } catch {
        errorMessage = `Ошибка сервера: ${response.status} ${response.statusText}`;
      }
      throw new Error(translateError(errorMessage));
    }

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

// Расписание экскурсии (когда гид может её проводить)
export async function getExcursionSchedule(token, excursionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/excursions/${excursionId}/schedule`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function saveExcursionSchedule(token, excursionId, schedule) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/guides/me/excursions/${excursionId}/schedule`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(schedule),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

// Reviews
export async function submitReview(token, excursionId, rating, comment) {
  const response = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ excursion_id: excursionId, rating, comment }),
  });
  return handleResponse(response);
}

export async function canReviewExcursion(token, excursionId) {
  const response = await fetch(`${API_BASE_URL}/api/excursions/${excursionId}/can-review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}

export async function getMyReview(token, excursionId) {
  const response = await fetch(`${API_BASE_URL}/api/excursions/${excursionId}/my-review`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204 || response.status === 200) {
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  }
  return handleResponse(response);
}

// Favorites
export async function getFavorites(token) {
  const response = await fetch(`${API_BASE_URL}/api/favorites/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}

export async function addFavorite(token, excursionId) {
  const response = await fetch(`${API_BASE_URL}/api/favorites?excursion_id=${excursionId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}

export async function removeFavorite(token, excursionId) {
  const response = await fetch(`${API_BASE_URL}/api/favorites/${excursionId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (response.status === 204) return null;
  return handleResponse(response);
}

export async function checkFavorite(token, excursionId) {
  const response = await fetch(`${API_BASE_URL}/api/favorites/check/${excursionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return handleResponse(response);
}

// Guide public profile
export async function getPublicGuideProfile(guideId) {
  const response = await fetch(`${API_BASE_URL}/api/guides/${guideId}`);
  return handleResponse(response);
}

// Admin API functions
export async function adminGetExcursions(token, statusFilter = null) {
  try {
    const url = statusFilter
      ? `${API_BASE_URL}/api/admin/excursions?status_filter=${statusFilter}`
      : `${API_BASE_URL}/api/admin/excursions`;
    const response = await fetch(url, {
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

export async function adminGetExcursion(token, excursionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/excursions/${excursionId}`, {
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

export async function adminUpdateExcursion(token, excursionId, excursionData) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/excursions/${excursionId}`, {
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

export async function adminSetExcursionStatus(token, excursionId, status) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/excursions/${excursionId}/status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    return handleResponse(response);
  } catch (error) {
    if (error instanceof TypeError && error.message === "Failed to fetch") {
      throw new Error(translateError("Не удалось подключиться к серверу. Проверьте подключение к интернету."));
    }
    throw error;
  }
}

export async function adminDeleteExcursion(token, excursionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/excursions/${excursionId}`, {
      method: "DELETE",
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

export async function adminGetBookings(token) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings`, {
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

export async function adminGetBooking(token, bookingId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/bookings/${bookingId}`, {
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
