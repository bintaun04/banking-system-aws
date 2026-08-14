import { useState } from "react";

import {
  Layout,
  Menu,
  Avatar,
  Dropdown,
  Typography,
  Space,
  Badge,
} from "antd";

import {
  DashboardOutlined,
  UserOutlined,
  BankOutlined,
  SwapOutlined,
  DollarOutlined,
  SafetyCertificateOutlined,
  BranchesOutlined,
  AuditOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  RobotOutlined,
} from "@ant-design/icons";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";

const {
  Header,
  Sider,
  Content,
} = Layout;

const { Text } = Typography;

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    logout,
  } = useAuth();

  const [collapsed, setCollapsed] =
    useState(false);

  const menuItems = [
    {
      key: "/admin/dashboard",
      icon: <DashboardOutlined />,
      label: "Tổng quan",
    },

    {
      key: "/admin/customers",
      icon: <UserOutlined />,
      label: "Khách hàng",
    },

    {
      key: "/admin/accounts",
      icon: <BankOutlined />,
      label: "Tài khoản",
    },

    {
      key: "/admin/transactions",
      icon: <SwapOutlined />,
      label: "Giao dịch",
    },

    {
      key: "/admin/loans",
      icon: <DollarOutlined />,
      label: "Khoản vay",
    },

    {
      key: "/admin/credits",
      icon: <SafetyCertificateOutlined />,
      label: "Hồ sơ tín dụng",
    },

    {
      key: "/admin/predictions",
      icon: <RobotOutlined />,
      label: "Dự đoán rủi ro",
    },

    {
      key: "/admin/branches",
      icon: <BranchesOutlined />,
      label: "Chi nhánh",
    },

    {
      key: "/admin/audit-logs",
      icon: <AuditOutlined />,
      label: "Audit Log",
    },
  ];

  const handleLogout = () => {
    logout();

    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );
  };

  const userMenu = {
    items: [
      {
        key: "username",
        icon: <UserOutlined />,
        label: user?.username || "Admin",
        disabled: true,
      },

      {
        type: "divider",
      },

      {
        key: "logout",
        icon: <LogoutOutlined />,
        label: "Đăng xuất",
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout
      style={{
        minHeight: "100vh",
        width: "100%",
      }}
    >
      {/* SIDEBAR */}

      <Sider
        width={260}
        collapsedWidth={80}
        collapsed={collapsed}
        trigger={null}
        style={{
          background: "#071b2f",
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          height: "100vh",
          overflow: "auto",
          zIndex: 100,
        }}
      >
        {/* LOGO */}

        <div
          onClick={() =>
            navigate("/admin/dashboard")
          }
          style={{
            height: 72,

            display: "flex",
            alignItems: "center",

            padding: collapsed
              ? "0 20px"
              : "0 24px",

            gap: 12,

            cursor: "pointer",

            borderBottom:
              "1px solid rgba(255,255,255,.08)",
          }}
        >
          <div
            style={{
              minWidth: 40,
              width: 40,
              height: 40,

              borderRadius: 10,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              background: "#1677ff",

              color: "#fff",

              fontSize: 21,
            }}
          >
            <BankOutlined />
          </div>

          {!collapsed && (
            <div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 18,
                  fontWeight: 800,
                }}
              >
                NOVA BANK
              </div>

              <div
                style={{
                  color:
                    "rgba(255,255,255,.45)",
                  fontSize: 10,
                  letterSpacing: 1.5,
                }}
              >
                ADMIN PORTAL
              </div>
            </div>
          )}
        </div>

        {/* MENU */}

        <Menu
          mode="inline"
          theme="dark"
          selectedKeys={[
            location.pathname,
          ]}
          items={menuItems}
          onClick={({ key }) =>
            navigate(key)
          }
          style={{
            marginTop: 14,
            background: "transparent",
            border: 0,
          }}
        />
      </Sider>

      {/* MAIN */}

      <Layout
        style={{
          marginLeft: collapsed
            ? 80
            : 260,

          transition:
            "margin-left .2s",
        }}
      >
        {/* HEADER */}

        <Header
          style={{
            height: 72,

            padding: "0 28px",

            background: "#ffffff",

            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

            position: "sticky",
            top: 0,
            zIndex: 50,

            borderBottom:
              "1px solid #edf0f4",
          }}
        >
          <Space size={20}>
            <div
              onClick={() =>
                setCollapsed(!collapsed)
              }
              style={{
                fontSize: 19,
                cursor: "pointer",
              }}
            >
              {collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )}
            </div>

            <div>
              <Text
                strong
                style={{
                  fontSize: 16,
                }}
              >
                Hệ thống quản trị ngân hàng
              </Text>

              <div>
                <Text
                  type="secondary"
                  style={{
                    fontSize: 12,
                  }}
                >
                  NOVA Banking Management System
                </Text>
              </div>
            </div>
          </Space>

          <Space size={22}>
            <Badge count={0}>
              <BellOutlined
                style={{
                  fontSize: 20,
                  cursor: "pointer",
                }}
              />
            </Badge>

            <Dropdown
              menu={userMenu}
              placement="bottomRight"
              trigger={["click"]}
            >
              <Space
                style={{
                  cursor: "pointer",
                }}
              >
                <Avatar
                  style={{
                    background:
                      "#1677ff",
                  }}
                  icon={<UserOutlined />}
                />

                <div>
                  <div
                    style={{
                      lineHeight: 1.2,
                      fontWeight: 600,
                    }}
                  >
                    {user?.username ||
                      "Administrator"}
                  </div>

                  <Text
                    type="secondary"
                    style={{
                      fontSize: 11,
                    }}
                  >
                    Quản trị viên
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* CONTENT */}

        <Content
          style={{
            minHeight:
              "calc(100vh - 72px)",

            padding: 28,

            background: "#f5f7fa",
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}