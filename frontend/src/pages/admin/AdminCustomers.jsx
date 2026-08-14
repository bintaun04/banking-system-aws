import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  UserOutlined,
} from "@ant-design/icons";

import dayjs from "dayjs";

import api from "../../api/axios";

const {
  Title,
  Text,
} = Typography;

const money = (value) =>
  Number(value || 0).toLocaleString(
    "vi-VN"
  ) + " ₫";

export default function AdminCustomers() {
  const [customers, setCustomers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [search, setSearch] =
    useState("");

  const [debtFilter, setDebtFilter] =
    useState("all");

  const [modalOpen, setModalOpen] =
    useState(false);

  const [drawerOpen, setDrawerOpen] =
    useState(false);

  const [editing, setEditing] =
    useState(null);

  const [selected, setSelected] =
    useState(null);

  const [form] = Form.useForm();

  const fetchCustomers =
    async () => {
      setLoading(true);

      try {
        const response =
          await api.get(
            "/customers/?limit=1000"
          );

        setCustomers(
          response.data || []
        );
      } catch (error) {
        message.error(
          "Không thể tải danh sách khách hàng"
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const filteredCustomers =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      return customers.filter(
        (customer) => {
          const matchSearch =
            !keyword ||
            customer.full_name
              ?.toLowerCase()
              .includes(keyword) ||
            customer.customer_code
              ?.toLowerCase()
              .includes(keyword) ||
            customer.national_id
              ?.toLowerCase()
              .includes(keyword) ||
            customer.phone
              ?.toLowerCase()
              .includes(keyword);

          const matchDebt =
            debtFilter === "all" ||
            (debtFilter === "bad" &&
              customer.bad_debt) ||
            (debtFilter ===
              "normal" &&
              !customer.bad_debt);

          return (
            matchSearch &&
            matchDebt
          );
        }
      );
    }, [
      customers,
      search,
      debtFilter,
    ]);

  const openCreate = () => {
    setEditing(null);

    form.resetFields();

    form.setFieldsValue({
      bad_debt: false,
      monthly_income: 0,
    });

    setModalOpen(true);
  };

  const openEdit = (
    customer
  ) => {
    setEditing(customer);

    form.setFieldsValue({
      ...customer,

      date_of_birth:
        customer.date_of_birth
          ? dayjs(
              customer.date_of_birth
            )
          : null,
    });

    setModalOpen(true);
  };

  const openDetail = (
    customer
  ) => {
    setSelected(customer);
    setDrawerOpen(true);
  };

  const submitCustomer =
    async (values) => {
      try {
        const payload = {
          ...values,

          date_of_birth:
            values.date_of_birth
              ? values.date_of_birth.format(
                  "YYYY-MM-DD"
                )
              : null,
        };

        if (editing) {
          await api.put(
            `/customers/${editing.id}`,
            payload
          );

          message.success(
            "Cập nhật khách hàng thành công"
          );
        } else {
          await api.post(
            "/customers/",
            payload
          );

          message.success(
            "Tạo khách hàng thành công"
          );
        }

        setModalOpen(false);

        await fetchCustomers();
      } catch (error) {
        message.error(
          error.response?.data
            ?.detail ||
            "Không thể lưu khách hàng"
        );
      }
    };

  const deleteCustomer =
    async (id) => {
      try {
        await api.delete(
          `/customers/${id}`
        );

        message.success(
          "Đã xóa khách hàng"
        );

        fetchCustomers();
      } catch (error) {
        message.error(
          error.response?.data
            ?.detail ||
            "Không thể xóa khách hàng"
        );
      }
    };

  const columns = [
    {
      title: "Mã KH",
      dataIndex:
        "customer_code",

      width: 135,

      render: (value) => (
        <Text strong>
          {value}
        </Text>
      ),
    },

    {
      title: "Khách hàng",
      key: "customer",

      width: 210,

      render: (_, record) => (
        <Space>
          <div
            style={{
              width: 38,
              height: 38,

              display: "flex",
              alignItems: "center",
              justifyContent:
                "center",

              borderRadius: "50%",

              background:
                "#eaf3ff",

              color: "#1677ff",
            }}
          >
            <UserOutlined />
          </div>

          <div>
            <Text strong>
              {record.full_name}
            </Text>

            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                }}
              >
                ID #{record.id}
              </Text>
            </div>
          </div>
        </Space>
      ),
    },

    {
      title: "CCCD",
      dataIndex:
        "national_id",

      width: 150,
    },

    {
      title: "SĐT",
      dataIndex: "phone",

      width: 130,

      render: (value) =>
        value || "-",
    },

    {
      title: "Nghề nghiệp",
      dataIndex:
        "occupation",

      width: 160,

      render: (value) =>
        value || "-",
    },

    {
      title: "Thu nhập",
      dataIndex:
        "monthly_income",

      width: 150,

      align: "right",

      render: (value) =>
        money(value),
    },

    {
      title: "Tín dụng",
      dataIndex:
        "bad_debt",

      width: 120,

      align: "center",

      render: (value) =>
        value ? (
          <Tag color="red">
            Nợ xấu
          </Tag>
        ) : (
          <Tag color="green">
            Bình thường
          </Tag>
        ),
    },

    {
      title: "Thao tác",
      key: "action",

      fixed: "right",

      width: 145,

      render: (_, record) => (
        <Space size={4}>
          <Button
            type="text"
            icon={
              <EyeOutlined />
            }
            onClick={() =>
              openDetail(
                record
              )
            }
          />

          <Button
            type="text"
            icon={
              <EditOutlined />
            }
            onClick={() =>
              openEdit(record)
            }
          />

          <Popconfirm
            title="Xóa khách hàng?"
            description="Hành động này có thể bị từ chối nếu khách hàng đang có tài khoản hoặc khoản vay."
            okText="Xóa"
            cancelText="Hủy"
            onConfirm={() =>
              deleteCustomer(
                record.id
              )
            }
          >
            <Button
              type="text"
              danger
              icon={
                <DeleteOutlined />
              }
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "flex-start",

          gap: 20,

          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={2}
            style={{
              marginBottom: 3,
            }}
          >
            Quản lý khách hàng
          </Title>

          <Text type="secondary">
            Quản lý hồ sơ KYC và
            thông tin khách hàng
            của ngân hàng.
          </Text>
        </div>

        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={openCreate}
        >
          Thêm khách hàng
        </Button>
      </div>

      {/* FILTER */}

      <Card
        style={{
          marginBottom: 18,
        }}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <Input
            allowClear
            prefix={
              <SearchOutlined />
            }
            placeholder="Tìm tên, mã KH, CCCD, SĐT..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            style={{
              width: 340,
            }}
          />

          <Select
            value={debtFilter}
            onChange={
              setDebtFilter
            }
            style={{
              width: 180,
            }}
            options={[
              {
                value: "all",
                label:
                  "Tất cả tín dụng",
              },

              {
                value: "normal",
                label:
                  "Bình thường",
              },

              {
                value: "bad",
                label: "Có nợ xấu",
              },
            ]}
          />

          <Button
            icon={
              <ReloadOutlined />
            }
            onClick={
              fetchCustomers
            }
          >
            Làm mới
          </Button>
        </div>
      </Card>

      {/* TABLE */}

      <Card>
        <div
          style={{
            marginBottom: 15,
          }}
        >
          <Text type="secondary">
            Tổng cộng{" "}
            <Text strong>
              {
                filteredCustomers.length
              }
            </Text>{" "}
            khách hàng
          </Text>
        </div>

        <Table
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={
            filteredCustomers
          }
          scroll={{
            x: 1300,
          }}
          pagination={{
            pageSize: 10,

            showSizeChanger: true,

            showTotal: (
              total
            ) =>
              `${total} khách hàng`,
          }}
        />
      </Card>

      {/* CREATE / EDIT */}

      <Modal
        title={
          editing
            ? "Cập nhật khách hàng"
            : "Thêm khách hàng"
        }
        open={modalOpen}
        onCancel={() =>
          setModalOpen(false)
        }
        onOk={() =>
          form.submit()
        }
        okText="Lưu"
        cancelText="Hủy"
        width={720}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={
            submitCustomer
          }
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "1fr 1fr",
              gap: "0 18px",
            }}
          >
            <Form.Item
              name="full_name"
              label="Họ và tên"
              rules={[
                {
                  required: true,
                  message:
                    "Nhập họ tên",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="date_of_birth"
              label="Ngày sinh"
              rules={[
                {
                  required: true,
                  message:
                    "Chọn ngày sinh",
                },
              ]}
            >
              <DatePicker
                style={{
                  width: "100%",
                }}
                format="DD/MM/YYYY"
              />
            </Form.Item>

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
                    value:
                      "female",
                    label: "Nữ",
                  },
                  {
                    value: "other",
                    label: "Khác",
                  },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="national_id"
              label="CCCD"
              rules={[
                {
                  required: true,
                  message:
                    "Nhập CCCD",
                },
              ]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Số điện thoại"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="occupation"
              label="Nghề nghiệp"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="monthly_income"
              label="Thu nhập/tháng"
            >
              <InputNumber
                min={0}
                style={{
                  width: "100%",
                }}
                addonAfter="VND"
              />
            </Form.Item>

            <Form.Item
              name="bad_debt"
              label="Trạng thái tín dụng"
            >
              <Select
                options={[
                  {
                    value: false,
                    label:
                      "Bình thường",
                  },

                  {
                    value: true,
                    label:
                      "Có nợ xấu",
                  },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="permanent_address"
            label="Địa chỉ thường trú"
          >
            <Input.TextArea
              rows={3}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* CUSTOMER DETAIL */}

      <Drawer
        title="Chi tiết khách hàng"
        width={620}
        open={drawerOpen}
        onClose={() =>
          setDrawerOpen(false)
        }
      >
        {selected && (
          <>
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 16,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,

                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",

                  borderRadius:
                    "50%",

                  background:
                    "#eaf3ff",

                  color:
                    "#1677ff",

                  fontSize: 25,
                }}
              >
                <UserOutlined />
              </div>

              <div>
                <Title
                  level={4}
                  style={{
                    margin: 0,
                  }}
                >
                  {
                    selected.full_name
                  }
                </Title>

                <Text type="secondary">
                  {
                    selected.customer_code
                  }
                </Text>
              </div>
            </div>

            <Descriptions
              bordered
              column={1}
            >
              <Descriptions.Item label="Customer ID">
                {selected.id}
              </Descriptions.Item>

              <Descriptions.Item label="CCCD">
                {
                  selected.national_id
                }
              </Descriptions.Item>

              <Descriptions.Item label="Ngày sinh">
                {
                  selected.date_of_birth
                }
              </Descriptions.Item>

              <Descriptions.Item label="Giới tính">
                {selected.gender ||
                  "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Số điện thoại">
                {selected.phone ||
                  "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Email">
                {selected.email ||
                  "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Nghề nghiệp">
                {selected.occupation ||
                  "-"}
              </Descriptions.Item>

              <Descriptions.Item label="Thu nhập">
                {money(
                  selected.monthly_income
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Địa chỉ thường trú">
                {
                  selected.permanent_address ||
                  "-"
                }
              </Descriptions.Item>

              <Descriptions.Item label="Tín dụng">
                {selected.bad_debt ? (
                  <Tag color="red">
                    Có nợ xấu
                  </Tag>
                ) : (
                  <Tag color="green">
                    Bình thường
                  </Tag>
                )}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày tạo">
                {selected.created_at
                  ? new Date(
                      selected.created_at
                    ).toLocaleString(
                      "vi-VN"
                    )
                  : "-"}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Drawer>
    </div>
  );
}