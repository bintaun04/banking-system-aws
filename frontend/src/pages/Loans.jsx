import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  DollarOutlined,
  PlusOutlined,
} from "@ant-design/icons";

import api from "../api/axios";


const { Title, Text } = Typography;


// ============================================================
// HELPERS
// ============================================================

const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString(
    "vi-VN"
  )} ₫`;
};


const statusInfo = {
  pending: {
    text: "Chờ duyệt",
    color: "orange",
  },

  approved: {
    text: "Đã duyệt",
    color: "blue",
  },

  rejected: {
    text: "Từ chối",
    color: "red",
  },

  active: {
    text: "Đang vay",
    color: "green",
  },

  overdue: {
    text: "Quá hạn",
    color: "red",
  },

  closed: {
    text: "Đã tất toán",
    color: "default",
  },
};


// ============================================================
// LOANS
// ============================================================

export default function Loans() {
  const [customer, setCustomer] = useState(null);
  const [loans, setLoans] = useState([]);

  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form] = Form.useForm();


  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        customerResult,
        loanResult,
      ] = await Promise.allSettled([
        api.get("/customers/me"),
        api.get("/loans/"),
      ]);


      if (customerResult.status === "fulfilled") {
        setCustomer(customerResult.value.data);
      } else {
        setCustomer(null);
      }


      if (loanResult.status === "fulfilled") {
        setLoans(loanResult.value.data || []);
      } else {
        setLoans([]);
      }

    } catch (error) {
      message.error("Không thể tải khoản vay");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // ============================================================
  // CREATE LOAN
  // ============================================================

  const handleCreate = async (values) => {
    if (!customer) {
      message.warning(
        "Bạn cần hoàn thiện hồ sơ khách hàng trước"
      );
      return;
    }

    const payload = {
      customer_id: customer.id,

      loan_amount: Number(values.loan_amount),

      interest_rate: Number(
        values.interest_rate || 0
      ),

      loan_term: Number(values.loan_term),

      purpose: values.purpose || null,

      start_date: null,
      end_date: null,
    };


    setSubmitting(true);

    try {
      await api.post("/loans/", payload);

      message.success(
        "Đã gửi yêu cầu vay thành công"
      );

      setModalOpen(false);

      form.resetFields();

      fetchData();

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể tạo khoản vay"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // STATISTICS
  // ============================================================

  const totalLoanAmount = loans.reduce(
    (sum, loan) =>
      sum + Number(loan.loan_amount || 0),
    0
  );


  const activeLoanCount = loans.filter((loan) =>
    ["approved", "active", "overdue"].includes(
      loan.loan_status
    )
  ).length;


  const pendingLoanCount = loans.filter(
    (loan) => loan.loan_status === "pending"
  ).length;


  // ============================================================
  // TABLE
  // ============================================================

  const columns = [
    {
      title: "Mã khoản vay",
      dataIndex: "loan_code",
      width: 210,

      render: (value) => (
        <Text strong>{value}</Text>
      ),
    },

    {
      title: "Số tiền vay",
      dataIndex: "loan_amount",
      align: "right",

      render: (value) => (
        <Text strong>
          {formatMoney(value)}
        </Text>
      ),
    },

    {
      title: "Lãi suất",
      dataIndex: "interest_rate",
      align: "center",

      render: (value) => `${value}% / năm`,
    },

    {
      title: "Kỳ hạn",
      dataIndex: "loan_term",
      align: "center",

      render: (value) => `${value} tháng`,
    },

    {
      title: "Mục đích",
      dataIndex: "purpose",

      render: (value) => value || "-",
    },

    {
      title: "Ngày bắt đầu",
      dataIndex: "start_date",

      render: (value) =>
        value
          ? new Date(value).toLocaleDateString(
              "vi-VN"
            )
          : "-",
    },

    {
      title: "Trạng thái",
      dataIndex: "loan_status",
      align: "center",

      render: (value) => {
        const info =
          statusInfo[value] || {
            text: value,
            color: "default",
          };

        return (
          <Tag color={info.color}>
            {info.text}
          </Tag>
        );
      },
    },
  ];


  // ============================================================
  // UI
  // ============================================================

  return (
    <div style={{ width: "100%" }}>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={2}
            style={{ marginBottom: 4 }}
          >
            Khoản vay
          </Title>

          <Text type="secondary">
            Quản lý và theo dõi các khoản vay của bạn
          </Text>
        </div>


        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
          disabled={!customer}
        >
          Đăng ký vay
        </Button>
      </div>


      {!customer && (
        <Alert
          type="warning"
          showIcon
          message="Chưa có hồ sơ khách hàng"
          description="Bạn cần hoàn thiện hồ sơ KYC trước khi đăng ký khoản vay."
          style={{ marginBottom: 20 }}
        />
      )}


      {/* ======================================================
          STATS
      ====================================================== */}

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic
              title="Tổng giá trị khoản vay"
              value={totalLoanAmount}
              formatter={(value) =>
                Number(value).toLocaleString(
                  "vi-VN"
                )
              }
              suffix="₫"
              prefix={<DollarOutlined />}
            />
          </Card>
        </Col>


        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic
              title="Khoản vay đang hoạt động"
              value={activeLoanCount}
            />
          </Card>
        </Col>


        <Col xs={24} md={8}>
          <Card style={{ borderRadius: 16 }}>
            <Statistic
              title="Đang chờ duyệt"
              value={pendingLoanCount}
            />
          </Card>
        </Col>
      </Row>


      {/* ======================================================
          LIST
      ====================================================== */}

      <Card
        title="Danh sách khoản vay"
        style={{
          marginTop: 24,
          borderRadius: 18,
        }}
      >
        <Table
          columns={columns}
          dataSource={loans}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1000 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: false,
          }}
          locale={{
            emptyText: (
              <Empty description="Chưa có khoản vay" />
            ),
          }}
        />
      </Card>


      {/* ======================================================
          CREATE MODAL
      ====================================================== */}

      <Modal
        title="Đăng ký khoản vay"
        open={modalOpen}
        width={650}
        destroyOnClose
        onCancel={() => {
          setModalOpen(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Alert
          type="info"
          showIcon
          message="Yêu cầu vay sẽ được gửi để xét duyệt"
          style={{ marginBottom: 20 }}
        />


        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="loan_amount"
            label="Số tiền muốn vay"
            rules={[
              {
                required: true,
                message: "Nhập số tiền vay",
              },
            ]}
          >
            <InputNumber
              min={1000000}
              step={1000000}
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
                value
                  ? value.replace(/,/g, "")
                  : ""
              }
            />
          </Form.Item>


          <Form.Item
            name="loan_term"
            label="Thời hạn vay"
            rules={[
              {
                required: true,
                message: "Chọn thời hạn vay",
              },
            ]}
          >
            <Select
              size="large"
              options={[
                {
                  value: 3,
                  label: "3 tháng",
                },
                {
                  value: 6,
                  label: "6 tháng",
                },
                {
                  value: 12,
                  label: "12 tháng",
                },
                {
                  value: 24,
                  label: "24 tháng",
                },
                {
                  value: 36,
                  label: "36 tháng",
                },
                {
                  value: 48,
                  label: "48 tháng",
                },
                {
                  value: 60,
                  label: "60 tháng",
                },
              ]}
            />
          </Form.Item>


          <Form.Item
            name="interest_rate"
            label="Lãi suất dự kiến (%/năm)"
            initialValue={10}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.1}
              size="large"
              style={{ width: "100%" }}
              addonAfter="%"
            />
          </Form.Item>


          <Form.Item
            name="purpose"
            label="Mục đích vay"
          >
            <Input.TextArea
              rows={3}
              placeholder="Ví dụ: Mua xe, kinh doanh, học tập..."
            />
          </Form.Item>


          <Space
            style={{
              width: "100%",
              justifyContent: "flex-end",
            }}
          >
            <Button
              onClick={() =>
                setModalOpen(false)
              }
            >
              Hủy
            </Button>

            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
            >
              Gửi yêu cầu
            </Button>
          </Space>
        </Form>
      </Modal>

    </div>
  );
}