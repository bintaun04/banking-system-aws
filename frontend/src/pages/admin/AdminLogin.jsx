import {
  useState,
} from "react";

import {
  Button,
  Card,
  Form,
  Input,
  Typography,
  Alert,
} from "antd";

import {
  BankOutlined,
  LockOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import {
  Navigate,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../auth/AuthContext";

const {
  Title,
  Text,
} = Typography;

export default function AdminLogin() {
  const navigate = useNavigate();

  const {
    login,
    token,
    user,
  } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  if (
    token &&
    user?.role === "admin"
  ) {
    return (
      <Navigate
        to="/admin/dashboard"
        replace
      />
    );
  }

  const handleLogin = async (
    values
  ) => {
    setLoading(true);
    setError("");

    try {
        const loggedUser = await login(
    values.username,
    values.password
    );

    if (loggedUser?.role !== "admin") {
    logout();

    setError(
        "Tài khoản không có quyền quản trị"
    );

    return;
    }

    navigate(
    "/admin/dashboard",
    {
        replace: true,
    }
    );

    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Tên đăng nhập hoặc mật khẩu không chính xác."
      );

    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "100vh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: 24,

        background:
          "linear-gradient(135deg,#06182d,#0b3155)",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: 440,
          maxWidth: "100%",

          padding: "18px 14px",

          borderRadius: 20,

          boxShadow:
            "0 30px 80px rgba(0,0,0,.28)",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: 62,
              height: 62,

              margin: "0 auto 16px",

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: 17,

              background: "#1677ff",

              color: "#fff",

              fontSize: 29,
            }}
          >
            <BankOutlined />
          </div>

          <Title
            level={2}
            style={{
              marginBottom: 3,
            }}
          >
            NOVA BANK
          </Title>

          <Text type="secondary">
            Internal Administration Portal
          </Text>
        </div>

        <Alert
          type="info"
          showIcon
          icon={
            <SafetyCertificateOutlined />
          }
          message="Khu vực dành cho nhân viên quản trị"
          style={{
            marginBottom: 22,
          }}
        />

        {error && (
          <Alert
            type="error"
            showIcon
            message={error}
            style={{
              marginBottom: 20,
            }}
          />
        )}

        <Form
          layout="vertical"
          onFinish={handleLogin}
          size="large"
        >
          <Form.Item
            name="username"
            label="Tên đăng nhập"
            rules={[
              {
                required: true,
                message:
                  "Nhập tên đăng nhập",
              },
            ]}
          >
            <Input
              prefix={
                <UserOutlined />
              }
              placeholder="Admin username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label="Mật khẩu"
            rules={[
              {
                required: true,
                message:
                  "Nhập mật khẩu",
              },
            ]}
          >
            <Input.Password
              prefix={
                <LockOutlined />
              }
              placeholder="Password"
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={loading}
            style={{
              height: 48,
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            Đăng nhập hệ thống
          </Button>
        </Form>

        <Button
          type="link"
          block
          onClick={() =>
            navigate("/")
          }
          style={{
            marginTop: 12,
          }}
        >
          ← Quay về website
        </Button>
      </Card>
    </div>
  );
}