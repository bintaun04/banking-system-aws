import { useState } from "react";
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Typography,
  message,
} from "antd";
import {
  BankOutlined,
  LockOutlined,
  MailOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axios";

const { Title, Text } = Typography;

export default function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const submit = async (values) => {
    if (values.password !== values.confirm_password) {
      message.error("Mật khẩu xác nhận không khớp");
      return;
    }

    const payload = {
      username: values.username.trim(),
      email: values.email.trim(),
      password: values.password,
      full_name: values.full_name.trim(),
      date_of_birth: values.date_of_birth.format("YYYY-MM-DD"),
      gender: values.gender,
      phone: values.phone?.trim() || null,
      permanent_address: values.permanent_address?.trim() || null,
      national_id: values.national_id.trim(),
      occupation: values.occupation?.trim() || null,
      monthly_income: Number(values.monthly_income || 0),
    };

    setLoading(true);

    try {
      await api.post("/auth/register", payload);
      message.success("Đăng ký thành công. Bạn có thể đăng nhập ngay.");
      navigate("/login");
    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Đăng ký thất bại. Vui lòng kiểm tra lại thông tin."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background:
          "linear-gradient(135deg, #061a33 0%, #093f79 48%, #0b6bcb 100%)",
        padding: "40px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Card
        bordered={false}
        style={{
          width: "min(980px, 100%)",
          borderRadius: 24,
          boxShadow: "0 24px 70px rgba(0,0,0,.25)",
        }}
        styles={{ body: { padding: 0 } }}
      >
        <Row>
          <Col
            xs={24}
            lg={8}
            style={{
              padding: 36,
              color: "#fff",
              background:
                "linear-gradient(160deg, #071a30 0%, #0b4f95 100%)",
              borderRadius: "24px 0 0 24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 36,
              }}
            >
              <BankOutlined style={{ fontSize: 32 }} />
              <Title level={2} style={{ color: "#fff", margin: 0 }}>
                NOVA BANK
              </Title>
            </div>

            <Title level={3} style={{ color: "#fff" }}>
              Mở tài khoản ngân hàng số
            </Title>

            <Text style={{ color: "rgba(255,255,255,.78)", fontSize: 15 }}>
              Đăng ký một lần để tạo đồng thời tài khoản đăng nhập và hồ sơ
              khách hàng.
            </Text>
          </Col>

          <Col xs={24} lg={16} style={{ padding: "34px 38px" }}>
            <Title level={2} style={{ marginTop: 0 }}>
              Đăng ký khách hàng
            </Title>

            <Text type="secondary">
              Vui lòng cung cấp đầy đủ thông tin định danh.
            </Text>

            <Form
              layout="vertical"
              onFinish={submit}
              style={{ marginTop: 24 }}
              requiredMark="optional"
            >
              <Title level={5}>Thông tin đăng nhập</Title>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="username"
                    label="Tên đăng nhập"
                    rules={[
                      { required: true, message: "Nhập tên đăng nhập" },
                      { min: 3, message: "Tối thiểu 3 ký tự" },
                    ]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      size="large"
                      placeholder="bintaun"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[
                      { required: true, message: "Nhập email" },
                      { type: "email", message: "Email không hợp lệ" },
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      size="large"
                      placeholder="name@email.com"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="password"
                    label="Mật khẩu"
                    rules={[
                      { required: true, message: "Nhập mật khẩu" },
                      { min: 6, message: "Tối thiểu 6 ký tự" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      size="large"
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="confirm_password"
                    label="Xác nhận mật khẩu"
                    rules={[
                      { required: true, message: "Nhập lại mật khẩu" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined />}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Title level={5} style={{ marginTop: 8 }}>
                Thông tin khách hàng
              </Title>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="full_name"
                    label="Họ và tên"
                    rules={[{ required: true, message: "Nhập họ tên" }]}
                  >
                    <Input size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="national_id"
                    label="Căn cước công dân"
                    rules={[
                      { required: true, message: "Nhập số căn cước" },
                      { min: 9, message: "CCCD không hợp lệ" },
                    ]}
                  >
                    <Input size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    name="date_of_birth"
                    label="Ngày sinh"
                    rules={[{ required: true, message: "Chọn ngày sinh" }]}
                  >
                    <DatePicker
                      size="large"
                      format="DD/MM/YYYY"
                      style={{ width: "100%" }}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="gender" label="Giới tính">
                    <Select
                      size="large"
                      placeholder="Chọn giới tính"
                      options={[
                        { value: "male", label: "Nam" },
                        { value: "female", label: "Nữ" },
                        { value: "other", label: "Khác" },
                      ]}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24}>
                  <Form.Item
                    name="permanent_address"
                    label="Hộ khẩu thường trú"
                  >
                    <Input.TextArea rows={2} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item name="occupation" label="Nghề nghiệp">
                    <Input size="large" />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    name="monthly_income"
                    label="Thu nhập hàng tháng"
                  >
                    <InputNumber
                      min={0}
                      size="large"
                      style={{ width: "100%" }}
                      addonAfter="VND"
                      formatter={(value) =>
                        value
                          ? `${value}`.replace(
                              /\B(?=(\d{3})+(?!\d))/g,
                              ","
                            )
                          : ""
                      }
                      parser={(value) =>
                        value ? value.replace(/,/g, "") : ""
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Button
                htmlType="submit"
                type="primary"
                size="large"
                block
                loading={loading}
              >
                Đăng ký
              </Button>

              <div style={{ textAlign: "center", marginTop: 18 }}>
                Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
              </div>
            </Form>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
