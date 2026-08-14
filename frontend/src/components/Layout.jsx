import {
  useEffect,
  useState,
} from "react";

import {
  Avatar,
  Badge,
  Button,
  Dropdown,
  Layout,
  Menu,
  Space,
  Typography,
} from "antd";

import {
  BankOutlined,
  BellOutlined,
  CreditCardOutlined,
  DashboardOutlined,
  DollarOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SettingOutlined,
  SwapOutlined,
  TeamOutlined,
  UserOutlined,
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

const {
  Text,
} = Typography;


// ============================================================
// APP LAYOUT
// ============================================================

export default function AppLayout({
  children,
}) {
  const navigate = useNavigate();

  const location = useLocation();

  const {
    user,
    logout,
    isAdmin,
  } = useAuth();


  const [collapsed, setCollapsed] =
    useState(false);


  // ============================================================
  // RESPONSIVE
  // ============================================================

  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth < 1000
      ) {
        setCollapsed(true);
      }
    };

    handleResize();

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);


  // ============================================================
  // USER MENU
  // ============================================================

  const userMenu = {
    items: [
      {
        key: "profile",
        icon: <UserOutlined />,
        label: "Hồ sơ cá nhân",
      },

      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Cài đặt",
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
      },
    ],

    onClick: ({ key }) => {
      if (key === "profile") {
        navigate("/profile");
      }

      if (key === "logout") {
        logout();

        navigate(
          "/login",
          {
            replace: true,
          }
        );
      }
    },
  };


  // ============================================================
  // MENU USER
  // ============================================================

  const userItems = [
    {
      key: "/dashboard",
      icon: <DashboardOutlined />,
      label: "Trang chủ",
    },

    {
      key: "/accounts",
      icon: <CreditCardOutlined />,
      label: "Tài khoản",
    },

    {
      key: "/transactions",
      icon: <SwapOutlined />,
      label: "Giao dịch",
    },

    {
      key: "/loans",
      icon: <DollarOutlined />,
      label: "Khoản vay",
    },

    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Cá nhân",
    },
  ];


  // ============================================================
  // MENU ADMIN
  // ============================================================

  const adminItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },

    {
      key: "/customers",
      icon: <TeamOutlined />,
      label: "Khách hàng",
    },

    {
      key: "/accounts",
      icon: <CreditCardOutlined />,
      label: "Tài khoản",
    },

    {
      key: "/transactions",
      icon: <SwapOutlined />,
      label: "Giao dịch",
    },

    {
      key: "/loans",
      icon: <DollarOutlined />,
      label: "Khoản vay",
    },

    {
      key: "/profile",
      icon: <UserOutlined />,
      label: "Cá nhân",
    },
  ];


  const menuItems =
    isAdmin
      ? adminItems
      : userItems;


  // ============================================================
  // SELECTED MENU
  // ============================================================

  const selectedKey = (() => {
    const pathname =
      location.pathname;

    if (pathname === "/") {
      return "/";
    }

    const match =
      menuItems.find(
        (item) =>
          pathname.startsWith(
            item.key
          )
      );

    return match?.key || "/";
  })();


  // ============================================================
  // UI
  // ============================================================

  return (
    <Layout
      className="bank-layout"
    >

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}

        width={250}

        collapsedWidth={78}

        className="bank-sidebar"
      >

        {/* Logo */}

        <div
          className="bank-logo"
          style={{
            justifyContent:
              collapsed
                ? "center"
                : "flex-start",
          }}
        >
          <div
            className="bank-logo-icon"
          >
            <BankOutlined />
          </div>

          {!collapsed && (
            <span>
              NOVA BANK
            </span>
          )}
        </div>


        {/* Menu */}

        <Menu
          theme="dark"

          mode="inline"

          selectedKeys={[
            selectedKey,
          ]}

          items={menuItems}

          onClick={({ key }) =>
            navigate(key)
          }
        />


        {/* Bottom */}

        {!collapsed && (
          <div
            style={{
              padding:
                "18px 20px 22px",

              color:
                "rgba(255,255,255,.4)",

              fontSize: 11,

              lineHeight: 1.6,
            }}
          >
            NOVA Banking System
            <br />
            Graduation Project
          </div>
        )}

      </Sider>


      {/* ======================================================
          MAIN
      ====================================================== */}

      <Layout
        className="bank-main-layout"
      >

        {/* ====================================================
            HEADER
        ==================================================== */}

        <Header
          className="bank-header"
        >

          <div
            className="bank-header-left"
          >

            <Button
              type="text"

              icon={
                collapsed
                  ? (
                    <MenuUnfoldOutlined />
                  )
                  : (
                    <MenuFoldOutlined />
                  )
              }

              onClick={() =>
                setCollapsed(
                  !collapsed
                )
              }

              style={{
                fontSize: 18,
              }}
            />


            <div>
              <Text
                strong
                style={{
                  fontSize: 15,
                }}
              >
                {isAdmin
                  ? "Quản trị hệ thống"
                  : "NOVA Digital Banking"}
              </Text>
            </div>

          </div>


          <div
            className="bank-header-right"
          >

            {/* Notifications */}

            <Badge
              count={0}
              size="small"
            >
              <Button
                type="text"

                shape="circle"

                icon={
                  <BellOutlined
                    style={{
                      fontSize: 18,
                    }}
                  />
                }
              />
            </Badge>


            {/* User */}

            <Dropdown
              menu={userMenu}

              placement="bottomRight"

              trigger={[
                "click",
              ]}
            >
              <div
                className="bank-header-user"
              >
                <Avatar
                  icon={
                    <UserOutlined />
                  }

                  style={{
                    background:
                      "#1677ff",
                  }}
                />


                <div
                  style={{
                    lineHeight: 1.25,
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    {
                      user?.username ||
                      "User"
                    }
                  </div>


                  <div
                    style={{
                      fontSize: 11,

                      color:
                        "#8a96a8",
                    }}
                  >
                    {user?.role ===
                    "admin"
                      ? "Quản trị viên"
                      : "Khách hàng"}
                  </div>
                </div>
              </div>
            </Dropdown>

          </div>

        </Header>


        {/* ====================================================
            CONTENT
        ==================================================== */}

        <Content
          className="bank-content"
        >
          {children}
        </Content>

      </Layout>
    </Layout>
  );
}