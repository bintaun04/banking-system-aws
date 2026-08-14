import { useState } from "react";

import {
  Button,
  Card,
  Checkbox,
  Col,
  Form,
  Input,
  Row,
  Typography,
  message,
} from "antd";

import {
  BankOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../auth/AuthContext";


const {
  Title,
  Text,
  Paragraph,
} = Typography;


// ============================================================
// LOGIN
// ============================================================

export default function Login() {
  const navigate = useNavigate();

  const { login } = useAuth();

  const [loading, setLoading] =
    useState(false);


  // ============================================================
  // SUBMIT
  // ============================================================

  const onFinish = async (values) => {
  setLoading(true);

  try {
    const loggedUser = await login(
      values.username,
      values.password
    );

    message.success(
      "Đăng nhập thành công"
    );

    if (loggedUser?.role === "admin") {
      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    } else {
      navigate(
        "/dashboard",
        {
          replace: true,
        }
      );
    }

  } catch (error) {
    message.error(
      error.response?.data?.detail ||
        "Tên đăng nhập hoặc mật khẩu không đúng"
    );
  } finally {
    setLoading(false);
  }
};


  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",

        display: "flex",
        alignItems: "center",
        justifyContent: "center",

        padding: "24px",

        background:
          "linear-gradient(135deg, #041426 0%, #073a70 45%, #0875d1 100%)",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "min(1050px, 100%)",

          overflow: "hidden",

          borderRadius: 26,

          boxShadow:
            "0 30px 80px rgba(0,0,0,.35)",
        }}
        styles={{
          body: {
            padding: 0,
          },
        }}
      >
        <Row>

          {/* ==================================================
              LEFT
          ================================================== */}

          <Col
            xs={0}
            lg={13}
            style={{
              minHeight: 650,

              padding: 52,

              color: "white",

              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",

              background:
                "linear-gradient(145deg, #06182e 0%, #074c8f 62%, #0a77d5 100%)",
            }}
          >

            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  gap: 12,

                  marginBottom: 70,
                }}
              >
                <BankOutlined
                  style={{
                    fontSize: 38,
                  }}
                />

                <Title
                  level={2}
                  style={{
                    margin: 0,
                    color: "white",
                  }}
                >
                  NOVA BANK
                </Title>
              </div>


              <Title
                style={{
                  color: "white",

                  fontSize: 44,

                  lineHeight: 1.15,

                  maxWidth: 520,
                }}
              >
                Ngân hàng số
                <br />
                hiện đại và an toàn
              </Title>


              <Paragraph
                style={{
                  color:
                    "rgba(255,255,255,.72)",

                  fontSize: 17,

                  lineHeight: 1.8,

                  maxWidth: 500,
                }}
              >
                Quản lý tài khoản, chuyển tiền,
                theo dõi giao dịch và khoản vay
                trên một nền tảng duy nhất.
              </Paragraph>
            </div>


            <div
              style={{
                display: "flex",
                alignItems: "center",

                gap: 12,

                color:
                  "rgba(255,255,255,.85)",
              }}
            >
              <SafetyCertificateOutlined
                style={{
                  fontSize: 27,
                }}
              />

              <div>
                <div
                  style={{
                    fontWeight: 700,
                  }}
                >
                  Bảo mật thông tin
                </div>

                <div
                  style={{
                    fontSize: 13,

                    color:
                      "rgba(255,255,255,.65)",
                  }}
                >
                  Mật khẩu được mã hóa và
                  xác thực bằng JWT
                </div>
              </div>
            </div>

          </Col>


          {/* ==================================================
              LOGIN FORM
          ================================================== */}

          <Col
            xs={24}
            lg={11}
            style={{
              minHeight: 650,

              padding: "64px 50px",

              display: "flex",
              alignItems: "center",
            }}
          >

            <div
              style={{
                width: "100%",
              }}
            >

              <div
                style={{
                  display: "none",
                }}
                className="mobile-bank-logo"
              >
                NOVA BANK
              </div>


              <Text
                type="secondary"
                style={{
                  fontSize: 15,
                }}
              >
                Chào mừng trở lại
              </Text>


              <Title
                level={2}
                style={{
                  marginTop: 5,
                  marginBottom: 8,
                }}
              >
                Đăng nhập
              </Title>


              <Text type="secondary">
                Đăng nhập để truy cập tài khoản
                ngân hàng của bạn.
              </Text>


              <Form
                name="login"
                layout="vertical"

                onFinish={onFinish}

                size="large"

                style={{
                  marginTop: 34,
                }}
              >

                {/* Username */}

                <Form.Item
                  label="Tên đăng nhập"
                  name="username"

                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng nhập tên đăng nhập",
                    },
                  ]}
                >
                  <Input
                    prefix={
                      <UserOutlined />
                    }

                    placeholder="Tên đăng nhập"

                    autoComplete="username"

                    style={{
                      height: 48,

                      borderRadius: 10,
                    }}
                  />
                </Form.Item>


                {/* Password */}

                <Form.Item
                  label="Mật khẩu"
                  name="password"

                  rules={[
                    {
                      required: true,
                      message:
                        "Vui lòng nhập mật khẩu",
                    },
                  ]}
                >
                  <Input.Password
                    prefix={
                      <LockOutlined />
                    }

                    placeholder="Mật khẩu"

                    autoComplete="current-password"

                    style={{
                      height: 48,

                      borderRadius: 10,
                    }}
                  />
                </Form.Item>


                <div
                  style={{
                    display: "flex",

                    justifyContent:
                      "space-between",

                    alignItems: "center",

                    marginBottom: 25,
                  }}
                >
                  <Checkbox>
                    Ghi nhớ đăng nhập
                  </Checkbox>

                  <Button type="link">
                    Quên mật khẩu?
                  </Button>
                </div>


                <Button
                  type="primary"

                  htmlType="submit"

                  loading={loading}

                  block

                  style={{
                    height: 50,

                    fontWeight: 600,

                    borderRadius: 10,

                    fontSize: 16,
                  }}
                >
                  Đăng nhập
                </Button>


                <div
                  style={{
                    marginTop: 28,

                    textAlign: "center",
                  }}
                >
                  <Text type="secondary">
                    Chưa có tài khoản?{" "}
                  </Text>

                  <Link
                    to="/register"
                    style={{
                      fontWeight: 600,
                    }}
                  >
                    Đăng ký ngay
                  </Link>
                </div>

              </Form>

            </div>

          </Col>

        </Row>
      </Card>
    </div>
  );
}