import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Typography,
  message,
} from "antd";
import {
  EditOutlined,
  IdcardOutlined,
  UserOutlined,
} from "@ant-design/icons";
import api from "../api/axios";
import dayjs from "dayjs";

const { Title, Text } = Typography;

const formatMoney = (value) => {
  if (value === null || value === undefined) return "-";
  return Number(value).toLocaleString("vi-VN") + " VND";
};

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);

  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const fetchProfile = async () => {
    setLoading(true);

    try {
      const res = await api.get("/customers/me");
      setProfile(res.data);
    } catch (error) {
      if (error.response?.status === 404) {
        setProfile(null);
      } else {
        message.error(
          error.response?.data?.detail ||
            "Không thể tải hồ sơ khách hàng"
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleCreate = async (values) => {
    const payload = {
      full_name: values.full_name.trim(),
      date_of_birth: values.date_of_birth.format("YYYY-MM-DD"),
      gender: values.gender || null,
      phone: values.phone?.trim() || null,
      email: values.email?.trim() || null,
      permanent_address:
        values.permanent_address?.trim() || null,
      national_id: values.national_id.trim(),
      occupation: values.occupation?.trim() || null,
      monthly_income: Number(values.monthly_income || 0),
      bad_debt: false,
    };

    setCreating(true);

    try {
      await api.post("/customers/", payload);

      message.success("Hoàn thiện hồ sơ khách hàng thành công");

      createForm.resetFields();
      await fetchProfile();
    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể tạo hồ sơ khách hàng"
      );
    } finally {
      setCreating(false);
    }
  };

  const openEdit = () => {
    if (!profile) return;

    editForm.setFieldsValue({
      ...profile,
      date_of_birth: profile.date_of_birth
        ? dayjs(profile.date_of_birth)
        : null,
    });

    setEditing(true);
  };

  const handleUpdate = async (values) => {
    if (!profile) return;

    const payload = {
      ...values,
      date_of_birth: values.date_of_birth
        ? values.date_of_birth.format("YYYY-MM-DD")
        : null,
      monthly_income:
        values.monthly_income !== undefined
          ? Number(values.monthly_income)
          : undefined,
    };

    try {
      await api.put(`/customers/${profile.id}`, payload);

      message.success("Cập nhật hồ sơ thành công");

      setEditing(false);
      await fetchProfile();
    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể cập nhật hồ sơ"
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: 400,
          display: "grid",
          placeItems: "center",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // =========================================================
  // CHƯA CÓ PROFILE -> HIỆN FORM TẠO
  // =========================================================

  if (!profile) {
    return (
      <div style={{ width: "100%" }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={2} style={{ marginBottom: 6 }}>
            Hồ sơ khách hàng
          </Title>

          <Text type="secondary">
            Hoàn thiện thông tin định danh để sử dụng đầy đủ
            chức năng ngân hàng.
          </Text>
        </div>

        <Alert
          type="warning"
          showIcon
          message="Chưa có hồ sơ khách hàng"
          description="Vui lòng hoàn thiện hồ sơ KYC bên dưới."
          style={{ marginBottom: 24 }}
        />

        <Card
          title={
            <div style={{ display: "flex", gap: 10 }}>
              <IdcardOutlined />
              Hoàn thiện hồ sơ KYC
            </div>
          }
          style={{
            width: "100%",
            borderRadius: 16,
          }}
        >
          <Form
            form={createForm}
            layout="vertical"
            onFinish={handleCreate}
          >
            <Row gutter={[20, 0]}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="full_name"
                  label="Họ và tên"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập họ tên",
                    },
                  ]}
                >
                  <Input
                    size="large"
                    prefix={<UserOutlined />}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="national_id"
                  label="Căn cước công dân"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng nhập CCCD",
                    },
                    {
                      min: 9,
                      message: "CCCD không hợp lệ",
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="date_of_birth"
                  label="Ngày sinh"
                  rules={[
                    {
                      required: true,
                      message: "Vui lòng chọn ngày sinh",
                    },
                  ]}
                >
                  <DatePicker
                    size="large"
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                >
                  <Select
                    size="large"
                    placeholder="Chọn giới tính"
                    options={[
                      {
                        value: "male",
                        label: "Nam",
                      },
                      {
                        value: "female",
                        label: "Nữ",
                      },
                      {
                        value: "other",
                        label: "Khác",
                      },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                >
                  <Input size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                  rules={[
                    {
                      type: "email",
                      message: "Email không hợp lệ",
                    },
                  ]}
                >
                  <Input size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="occupation"
                  label="Nghề nghiệp"
                >
                  <Input size="large" />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="permanent_address"
                  label="Hộ khẩu thường trú"
                >
                  <Input.TextArea rows={3} />
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
              type="primary"
              htmlType="submit"
              size="large"
              loading={creating}
            >
              Hoàn thiện hồ sơ
            </Button>
          </Form>
        </Card>
      </div>
    );
  }

  // =========================================================
  // ĐÃ CÓ PROFILE
  // =========================================================

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              marginBottom: 6,
            }}
          >
            Hồ sơ khách hàng
          </Title>

          <Text type="secondary">
            Thông tin định danh và hồ sơ ngân hàng
          </Text>
        </div>

        <Button
          type="primary"
          icon={<EditOutlined />}
          onClick={openEdit}
        >
          Chỉnh sửa
        </Button>
      </div>

      <Card
        style={{
          width: "100%",
          borderRadius: 16,
        }}
      >
        <Descriptions
          column={{
            xs: 1,
            sm: 1,
            md: 2,
            lg: 3,
          }}
          bordered
        >
          <Descriptions.Item label="Mã khách hàng">
            {profile.customer_code}
          </Descriptions.Item>

          <Descriptions.Item label="Họ và tên">
            {profile.full_name}
          </Descriptions.Item>

          <Descriptions.Item label="CCCD">
            {profile.national_id}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày sinh">
            {profile.date_of_birth || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Giới tính">
            {profile.gender === "male"
              ? "Nam"
              : profile.gender === "female"
              ? "Nữ"
              : profile.gender === "other"
              ? "Khác"
              : "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Số điện thoại">
            {profile.phone || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Email">
            {profile.email || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Nghề nghiệp">
            {profile.occupation || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Thu nhập">
            {formatMoney(profile.monthly_income)}
          </Descriptions.Item>

          <Descriptions.Item
            label="Hộ khẩu thường trú"
            span={3}
          >
            {profile.permanent_address || "-"}
          </Descriptions.Item>

          <Descriptions.Item label="Nợ xấu">
            {profile.bad_debt ? "Có" : "Không"}
          </Descriptions.Item>

          <Descriptions.Item label="Ngày tạo">
            {profile.created_at
              ? new Date(
                  profile.created_at
                ).toLocaleString("vi-VN")
              : "-"}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {editing && (
        <Card
          title="Cập nhật hồ sơ"
          style={{
            marginTop: 24,
            borderRadius: 16,
          }}
        >
          <Form
            form={editForm}
            layout="vertical"
            onFinish={handleUpdate}
          >
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item
                  name="full_name"
                  label="Họ và tên"
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="national_id"
                  label="CCCD"
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="date_of_birth"
                  label="Ngày sinh"
                >
                  <DatePicker
                    format="DD/MM/YYYY"
                    style={{ width: "100%" }}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="gender"
                  label="Giới tính"
                >
                  <Select
                    options={[
                      {
                        value: "male",
                        label: "Nam",
                      },
                      {
                        value: "female",
                        label: "Nữ",
                      },
                      {
                        value: "other",
                        label: "Khác",
                      },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col xs={24} md={8}>
                <Form.Item
                  name="phone"
                  label="Số điện thoại"
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="email"
                  label="Email"
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="occupation"
                  label="Nghề nghiệp"
                >
                  <Input />
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item
                  name="permanent_address"
                  label="Hộ khẩu thường trú"
                >
                  <Input.TextArea rows={3} />
                </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item
                  name="monthly_income"
                  label="Thu nhập hàng tháng"
                >
                  <InputNumber
                    min={0}
                    style={{ width: "100%" }}
                    addonAfter="VND"
                  />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              htmlType="submit"
            >
              Lưu thay đổi
            </Button>

            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setEditing(false)}
            >
              Hủy
            </Button>
          </Form>
        </Card>
      )}
    </div>
  );
}