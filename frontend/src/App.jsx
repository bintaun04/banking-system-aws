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


// AUTH

import {
  AuthProvider,
  useAuth,
} from "./auth/AuthContext";


// CUSTOMER COMPONENTS

import PrivateRoute from "./components/PrivateRoute";
import AppLayout from "./components/Layout";


// ADMIN COMPONENTS

import AdminRoute from "./components/AdminRoute";
import AdminLayout from "./components/AdminLayout";


// PUBLIC PAGES

import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";


// CUSTOMER PAGES

import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Loans from "./pages/Loans";
import Profile from "./pages/Profile";


// ADMIN PAGES

import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminLoans from "./pages/admin/AdminLoans";

// ============================================================
// PUBLIC ROUTE
// ============================================================

function PublicRoute({
  children,
}) {
  const {
    token,
    user,
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
          justifyContent:
            "center",

          background:
            "#f4f7fb",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  if (token) {
    if (user?.role === "admin") {
      return (
        <Navigate
          to="/admin/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }
  return children;
}


// ============================================================
// ADMIN PAGE WRAPPER
// ============================================================

function AdminPage({
  children,
}) {
  return (
    <AdminRoute>
      <AdminLayout>
        {children}
      </AdminLayout>
    </AdminRoute>
  );
}


// ============================================================
// CUSTOMER PAGE WRAPPER
// ============================================================

function CustomerPage({
  children,
}) {
  return (
    <PrivateRoute>
      <AppLayout>
        {children}
      </AppLayout>
    </PrivateRoute>
  );
}


// ============================================================
// ROUTES
// ============================================================

function AppRoutes() {
  return (
    <Routes>

      {/* PUBLIC */}

      <Route
        path="/"
        element={<Landing />}
      />

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


      {/* CUSTOMER */}

      <Route
        path="/dashboard"
        element={
          <CustomerPage>
            <Dashboard />
          </CustomerPage>
        }
      />

      <Route
        path="/accounts"
        element={
          <CustomerPage>
            <Accounts />
          </CustomerPage>
        }
      />

      <Route
        path="/transactions"
        element={
          <CustomerPage>
            <Transactions />
          </CustomerPage>
        }
      />

      <Route
        path="/loans"
        element={
          <CustomerPage>
            <Loans />
          </CustomerPage>
        }
      />

      <Route
        path="/profile"
        element={
          <CustomerPage>
            <Profile />
          </CustomerPage>
        }
      />


      {/* ADMIN LOGIN */}

      <Route
        path="/admin/login"
        element={
          <AdminLogin />
        }
      />


      {/* ADMIN DASHBOARD */}

      <Route
        path="/admin"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <AdminPage>
            <AdminDashboard />
          </AdminPage>
        }
      />


      {/* ADMIN CUSTOMERS */}

      <Route
        path="/admin/customers"
        element={
          <AdminPage>
            <AdminCustomers />
          </AdminPage>
        }
      />


      {/* ADMIN ROUTES
          Các trang này mình sẽ viết tiếp.
      */}

      <Route
        path="/admin/accounts"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/transactions"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/loans"
        element={
          <AdminPage>
            <AdminLoans />
          </AdminPage>
        }

      />

      <Route
        path="/admin/credits"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/predictions"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/branches"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />

      <Route
        path="/admin/audit-logs"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />


      {/* 404 */}

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
          colorPrimary:
            "#1677ff",

          borderRadius: 10,

          fontFamily:
            "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",

          colorBgLayout:
            "#f4f7fb",

          colorText:
            "#172033",

          colorTextSecondary:
            "#78869b",
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
            headerBg:
              "#f7f9fc",
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