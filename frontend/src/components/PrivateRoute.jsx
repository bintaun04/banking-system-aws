import {
  Navigate,
  useLocation,
} from "react-router-dom";

import {
  Spin,
} from "antd";

import {
  useAuth,
} from "../auth/AuthContext";


// ============================================================
// PRIVATE ROUTE
// ============================================================

export default function PrivateRoute({
  children,
}) {
  const {
    token,
    loading,
  } = useAuth();

  const location =
    useLocation();


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",

          display: "flex",
          alignItems: "center",
          justifyContent: "center",

          background:
            "#f4f7fb",
        }}
      >
        <Spin
          size="large"
          tip="Đang xác thực..."
        />
      </div>
    );
  }


  // ============================================================
  // NOT LOGIN
  // ============================================================

  if (!token) {
    return (
      <Navigate
        to="/login"

        replace

        state={{
          from: location,
        }}
      />
    );
  }


  // ============================================================
  // AUTHENTICATED
  // ============================================================

  return children;
}