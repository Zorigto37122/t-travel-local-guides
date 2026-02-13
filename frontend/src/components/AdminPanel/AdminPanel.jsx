import React, { useMemo, useEffect, useRef } from "react";
import { AdminContext, AdminUI, Resource, ShowGuesser } from "react-admin";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { useAuth } from "../../AuthContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import {
  adminGetUsers,
  adminGetUser,
  adminUpdateUser,
  adminGetGuides,
  adminGetPendingGuides,
  adminApproveGuide,
  adminGetExcursions,
  adminGetExcursion,
  adminUpdateExcursion,
  adminDeleteExcursion,
  adminGetBookings,
  adminGetBooking,
} from "../../api";
import { UserList } from "./UserList";
import { UserEdit } from "./UserEdit";
import { GuideList } from "./GuideList";
import { GuideEdit } from "./GuideEdit";
import { PendingGuidesList } from "./PendingGuidesList";
import { ExcursionList } from "./ExcursionList";
import { ExcursionEdit } from "./ExcursionEdit";
import { BookingList } from "./BookingList";
import "./AdminPanel.css";

// Создаем тему для Material-UI
const theme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

// Error Boundary для админ-панели
class AdminErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("AdminPanel error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-panel-container">
          <div className="admin-access-denied">
            <h2>Ошибка загрузки админ-панели</h2>
            <p>{this.state.error?.message || "Произошла ошибка при загрузке админ-панели"}</p>
            <button onClick={() => window.location.reload()}>Перезагрузить страницу</button>
            <button onClick={() => this.props.navigate("/")} style={{ marginLeft: "10px" }}>
              Вернуться на главную
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Внутренний компонент AdminPanel
const AdminPanelContent = ({ navigate, location }) => {
  const { token, user } = useAuth();
  
  // Получаем путь относительно /admin
  const getAdminPath = (fullPath) => {
    if (fullPath === "/admin" || fullPath === "/admin/") {
      return "/";
    }
    if (fullPath.startsWith("/admin/")) {
      return fullPath.substring(7);
    }
    if (fullPath.startsWith("/admin")) {
      return fullPath.substring(6);
    }
    return fullPath;
  };

  // Преобразуем путь React Admin в полный путь для основного роутера
  const getFullPath = (adminPath) => {
    if (adminPath.startsWith("/admin")) {
      return adminPath;
    }
    if (!adminPath || adminPath === "/") {
      return "/admin";
    }
    if (adminPath.startsWith("/")) {
      return `/admin${adminPath}`;
    }
    return `/admin/${adminPath}`;
  };
  
  // Используем useRef для хранения актуального location и callbacks
  const locationRef = useRef(location);
  const listenersRef = useRef([]);
  
  useEffect(() => {
    locationRef.current = location;
    // Уведомляем всех слушателей об изменении location
    const adminPath = getAdminPath(location.pathname);
    listenersRef.current.forEach((listener) => {
      listener({
        location: {
          pathname: adminPath,
          search: location.search,
          hash: location.hash,
          state: location.state,
        },
        action: "POP",
      });
    });
  }, [location]);

  // Создаем кастомный history для React Admin
  const history = useMemo(() => {
    const getCurrentLocation = () => {
      const currentLoc = locationRef.current;
      const adminPath = getAdminPath(currentLoc.pathname);
      return {
        pathname: adminPath,
        search: currentLoc.search,
        hash: currentLoc.hash,
        state: currentLoc.state,
      };
    };

    return {
      listen: (callback) => {
        listenersRef.current.push(callback);
        // Вызываем callback сразу с текущим location
        const currentLoc = getCurrentLocation();
        callback({
          location: currentLoc,
          action: "POP",
        });
        // Возвращаем функцию для отписки
        return () => {
          listenersRef.current = listenersRef.current.filter((cb) => cb !== callback);
        };
      },
      push: (path, state) => {
        const pathStr = typeof path === "string" ? path : (path.pathname || "/");
        const fullPath = getFullPath(pathStr);
        console.log("React Admin push:", pathStr, "->", fullPath);
        navigate(fullPath, { state });
      },
      replace: (path, state) => {
        const pathStr = typeof path === "string" ? path : (path.pathname || "/");
        const fullPath = getFullPath(pathStr);
        console.log("React Admin replace:", pathStr, "->", fullPath);
        navigate(fullPath, { replace: true, state });
      },
      goBack: () => navigate(-1),
      goForward: () => navigate(1),
      go: (n) => navigate(n),
      get location() {
        return getCurrentLocation();
      },
      createHref: (loc) => {
        const path = typeof loc === "string" ? loc : (loc.pathname || "/");
        return getFullPath(path);
      },
    };
  }, [navigate]);
  
  // Редирект на первый ресурс, если находимся на /admin
  useEffect(() => {
    if (location.pathname === "/admin" || location.pathname === "/admin/") {
      navigate("/admin/users", { replace: true });
    }
  }, [location.pathname, navigate]);

  // Создаем кастомный dataProvider с мемоизацией
  const dataProvider = useMemo(() => ({
    getList: async (resource, params) => {
      try {
        let data;
        switch (resource) {
          case "users":
            data = await adminGetUsers(token);
            return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
          case "guides":
            data = await adminGetGuides(token);
            return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
          case "pendingGuides":
            data = await adminGetPendingGuides(token);
            return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
          case "excursions":
            data = await adminGetExcursions(token, params.filter?.status);
            return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
          case "bookings":
            data = await adminGetBookings(token);
            return { data: Array.isArray(data) ? data : [], total: Array.isArray(data) ? data.length : 0 };
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error(`Error in getList for ${resource}:`, error);
        const errorMessage = error.message || "Произошла ошибка при загрузке данных";
        const httpError = new Error(errorMessage);
        httpError.status = error.status || 500;
        httpError.body = { message: errorMessage };
        throw httpError;
      }
    },
    getOne: async (resource, params) => {
      try {
        let data;
        switch (resource) {
          case "users":
            data = await adminGetUser(token, params.id);
            return { data };
          case "guides":
            const guides = await adminGetGuides(token);
            data = guides.find((g) => g.guide_id === params.id);
            if (!data) throw new Error("Guide not found");
            return { data };
          case "excursions":
            data = await adminGetExcursion(token, params.id);
            return { data };
          case "bookings":
            data = await adminGetBooking(token, params.id);
            return { data };
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error(`Error in getOne for ${resource}:`, error);
        const errorMessage = error.message || "Произошла ошибка при загрузке данных";
        const httpError = new Error(errorMessage);
        httpError.status = error.status || 500;
        httpError.body = { message: errorMessage };
        throw httpError;
      }
    },
    getMany: async (resource, params) => {
      try {
        let data;
        switch (resource) {
          case "users":
            data = await adminGetUsers(token);
            return { data: Array.isArray(data) ? data.filter((u) => params.ids.includes(u.id)) : [] };
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error(`Error in getMany for ${resource}:`, error);
        const errorMessage = error.message || "Произошла ошибка при загрузке данных";
        const httpError = new Error(errorMessage);
        httpError.status = error.status || 500;
        httpError.body = { message: errorMessage };
        throw httpError;
      }
    },
    update: async (resource, params) => {
      try {
        let data;
        switch (resource) {
          case "users":
            data = await adminUpdateUser(token, params.id, params.data);
            return { data };
          case "excursions":
            data = await adminUpdateExcursion(token, params.id, params.data);
            return { data };
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error(`Error in update for ${resource}:`, error);
        const errorMessage = error.message || "Произошла ошибка при обновлении данных";
        const httpError = new Error(errorMessage);
        httpError.status = error.status || 500;
        httpError.body = { message: errorMessage };
        throw httpError;
      }
    },
    delete: async (resource, params) => {
      try {
        switch (resource) {
          case "excursions":
            await adminDeleteExcursion(token, params.id);
            return { data: { id: params.id } };
          default:
            throw new Error(`Unknown resource: ${resource}`);
        }
      } catch (error) {
        console.error(`Error in delete for ${resource}:`, error);
        const errorMessage = error.message || "Произошла ошибка при удалении данных";
        const httpError = new Error(errorMessage);
        httpError.status = error.status || 500;
        httpError.body = { message: errorMessage };
        throw httpError;
      }
    },
    create: async (resource, params) => {
      throw new Error("Create not implemented");
    },
  }), [token]);

  // Создаем простой authProvider для react-admin
  const authProvider = useMemo(() => ({
    login: async () => Promise.resolve(),
    logout: async () => {
      navigate("/");
      return Promise.resolve();
    },
    checkAuth: async () => {
      if (!token || !user || !user.is_superuser) {
        return Promise.reject(new Error("Unauthorized"));
      }
      return Promise.resolve();
    },
    checkError: async (error) => {
      const status = error?.status || error?.statusCode;
      if (status === 401 || status === 403) {
        return Promise.reject();
      }
      return Promise.resolve();
    },
    getPermissions: async () => Promise.resolve("admin"),
    getIdentity: async () => {
      if (!user) {
        return Promise.reject(new Error("User not found"));
      }
      return Promise.resolve({ id: user.id, fullName: user.name || user.email });
    },
  }), [token, user, navigate]);

  return (
    <AdminContext
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      <AdminUI
        title="Админ-панель - Авторские экскурсии"
        history={history}
      >
        <Resource
          name="users"
          list={UserList}
          edit={UserEdit}
          show={ShowGuesser}
          recordRepresentation="name"
        />
        <Resource
          name="guides"
          list={GuideList}
          edit={GuideEdit}
          show={ShowGuesser}
          recordRepresentation={(record) => `${record.user_name} (${record.user_email})`}
        />
        <Resource
          name="pendingGuides"
          list={PendingGuidesList}
          recordRepresentation={(record) => `${record.user_name} (${record.user_email})`}
        />
        <Resource
          name="excursions"
          list={ExcursionList}
          edit={ExcursionEdit}
          show={ShowGuesser}
          recordRepresentation="title"
        />
        <Resource
          name="bookings"
          list={BookingList}
          show={ShowGuesser}
          recordRepresentation={(record) => `Бронирование #${record.booking_id}`}
        />
      </AdminUI>
    </AdminContext>
  );
};

// Основной компонент AdminPanel
const AdminPanel = () => {
  const { token, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Логируем состояние для отладки
    console.log("AdminPanel render:", { 
      hasToken: !!token, 
      hasUser: !!user, 
      isSuperuser: user?.is_superuser, 
      loading,
      pathname: location.pathname 
    });
  }, [token, user, loading, location.pathname]);

  // Показываем загрузку, пока проверяем пользователя
  if (loading) {
    return (
      <div className="admin-panel-container">
        <div style={{ padding: "20px", textAlign: "center" }}>Загрузка админ-панели...</div>
      </div>
    );
  }

  // Если нет токена, показываем ошибку
  if (!token) {
    return (
      <div className="admin-panel-container">
        <div className="admin-access-denied">
          <h2>Ошибка авторизации</h2>
          <p>Токен авторизации не найден. Пожалуйста, войдите в систему.</p>
          <button onClick={() => navigate("/")}>Вернуться на главную</button>
        </div>
      </div>
    );
  }

  // Проверка прав доступа
  if (!user || !user.is_superuser) {
    return (
      <div className="admin-panel-container">
        <div className="admin-access-denied">
          <h2>Доступ запрещен</h2>
          <p>У вас нет прав для доступа к админ-панели.</p>
          <button onClick={() => navigate("/")}>Вернуться на главную</button>
        </div>
      </div>
    );
  }

  // Используем кастомный history для интеграции React Admin с существующим роутером
  return (
    <AdminErrorBoundary navigate={navigate}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <div className="admin-panel-wrapper" style={{ width: "100%", height: "100vh" }}>
          <AdminPanelContent navigate={navigate} location={location} />
        </div>
      </ThemeProvider>
    </AdminErrorBoundary>
  );
};

export default AdminPanel;
