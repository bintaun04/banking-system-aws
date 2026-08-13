import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import api from "../api/axios";


const AuthContext = createContext(null);


// ============================================================
// AUTH PROVIDER
// ============================================================

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    localStorage.getItem("access_token")
  );

  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);


  // ============================================================
  // LOAD USER
  // ============================================================

  const fetchCurrentUser = async () => {
    const currentToken =
      localStorage.getItem("access_token");

    if (!currentToken) {
      setUser(null);
      setToken(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");

      setUser(response.data);
      setToken(currentToken);

    } catch (error) {
      localStorage.removeItem("access_token");

      setToken(null);
      setUser(null);

    } finally {
      setLoading(false);
    }
  };


  // ============================================================
  // INITIAL LOAD
  // ============================================================

  useEffect(() => {
    fetchCurrentUser();
  }, []);


  // ============================================================
  // LOGIN
  // ============================================================

  const login = async (
    username,
    password
  ) => {
    const formData =
      new URLSearchParams();

    formData.append(
      "username",
      username
    );

    formData.append(
      "password",
      password
    );


    const response = await api.post(
      "/auth/login",
      formData,
      {
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
      }
    );


    const accessToken =
      response.data.access_token;


    localStorage.setItem(
      "access_token",
      accessToken
    );


    setToken(accessToken);


    // Lấy thông tin user sau login
    const userResponse =
      await api.get("/auth/me");


    setUser(userResponse.data);


    return userResponse.data;
  };


  // ============================================================
  // LOGOUT
  // ============================================================

  const logout = () => {
    localStorage.removeItem(
      "access_token"
    );

    setToken(null);

    setUser(null);
  };


  // ============================================================
  // REFRESH USER
  // ============================================================

  const refreshUser = async () => {
    try {
      const response =
        await api.get("/auth/me");

      setUser(response.data);

      return response.data;

    } catch (error) {
      return null;
    }
  };


  // ============================================================
  // VALUES
  // ============================================================

  const value = {
    token,
    user,
    loading,

    login,
    logout,

    refreshUser,

    isAuthenticated:
      Boolean(token),

    isAdmin:
      user?.role === "admin",
  };


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


// ============================================================
// HOOK
// ============================================================

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}