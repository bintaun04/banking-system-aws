import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import {
  ConfigProvider,
  App as AntdApp,
  Spin,
} from "antd";

// ==================== AUTH ====================

import {
  AuthProvider,
  useAuth,
} from "./auth/AuthContext";

// ==================== COMPONENTS ====================

import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./components/Layout";

// ==================== PAGES ====================

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Loans from "./pages/Loans";
import Profile from "./pages/Profile";


// ============================================================
// PUBLIC ROUTE
// Nếu đã đăng nhập thì không cho quay lại Login/Register
// ============================================================

function PublicRoute({ children }) {
  const {
    token,
    loading,
  } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f4f7fb",
        }}
      >
        <Spin
          size="large"
          tip="Đang tải..."
        />
      </div>
    );
  }

  if (token) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  return children;
}


// ============================================================
// ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC ROUTES
      ====================================================== */}

      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />


      {/* ======================================================
          DASHBOARD
      ====================================================== */}

      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </PrivateRoute>
        }
      />


      {/* ======================================================
          ACCOUNTS
      ====================================================== */}

      <Route
        path="/accounts"
        element={
          <PrivateRoute>
            <AppLayout>
              <Accounts />
            </AppLayout>
          </PrivateRoute>
        }
      />


      {/* ======================================================
          TRANSACTIONS
      ====================================================== */}

      <Route
        path="/transactions"
        element={
          <PrivateRoute>
            <AppLayout>
              <Transactions />
            </AppLayout>
          </PrivateRoute>
        }
      />


      {/* ======================================================
          LOANS
      ====================================================== */}

      <Route
        path="/loans"
        element={
          <PrivateRoute>
            <AppLayout>
              <Loans />
            </AppLayout>
          </PrivateRoute>
        }
      />


      {/* ======================================================
          PROFILE / KYC
      ====================================================== */}

      <Route
        path="/profile"
        element={
          <PrivateRoute>
            <AppLayout>
              <Profile />
            </AppLayout>
          </PrivateRoute>
        }
      />


      {/* ======================================================
          404
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


// ============================================================
// APP
// ============================================================

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#1677ff",

          borderRadius: 10,

          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

          colorBgLayout: "#f4f7fb",

          colorText: "#172033",

          colorTextSecondary: "#78869b",
        },

        components: {
          Button: {
            controlHeight: 42,
            borderRadius: 9,
          },

          Card: {
            borderRadiusLG: 16,
          },

          Input: {
            controlHeight: 42,
          },

          InputNumber: {
            controlHeight: 42,
          },

          Select: {
            controlHeight: 42,
          },

          DatePicker: {
            controlHeight: 42,
          },

          Menu: {
            itemBorderRadius: 8,
          },

          Table: {
            headerBg: "#f7f9fc",
          },
        },
      }}
    >
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
}