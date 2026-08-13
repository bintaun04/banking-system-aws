import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Select,
  message,
  Typography,
  Tag,
} from "antd";
import { PlusOutlined } from "@ant-design/icons";
import api from "../api/axios";

const { Title } = Typography;

const Accounts = () => {
  const [accounts, setAccounts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [accRes, cusRes] = await Promise.all([
        api.get("/accounts/"),
        api.get("/customers/"),
      ]);
      setAccounts(accRes.data);
      setCustomers(cusRes.data);
    } catch (error) {
      message.error("Không thể tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (values) => {
    try {
      await api.post("/accounts/", values);
      message.success("Tạo tài khoản thành công");
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.detail || "Có lỗi xảy ra");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Số tài khoản", dataIndex: "account_number" },
    {
      title: "Loại",
      dataIndex: "account_type",
      render: (val) => (val === "checking" ? "Thanh toán" : "Tiết kiệm"),
    },
    {
      title: "Số dư",
      dataIndex: "balance",
      render: (val) => Number(val).toLocaleString("vi-VN") + " đ",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (val) => {
        const color =
          val === "active" ? "green" : val === "locked" ? "orange" : "red";
        return <Tag color={color}>{val.toUpperCase()}</Tag>;
      },
    },
    { title: "Customer ID", dataIndex: "customer_id" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3}>Quản lý Tài khoản</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalOpen(true)}
        >
          Tạo tài khoản
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={accounts}
        rowKey="id"
        loading={loading}
        bordered
      />

      <Modal
        title="Tạo tài khoản mới"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Tạo"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="customer_id"
            label="Khách hàng"
            rules={[{ required: true, message: "Chọn khách hàng" }]}
          >
            <Select
              showSearch
              optionFilterProp="children"
              placeholder="Chọn khách hàng"
            >
              {customers.map((c) => (
                <Select.Option key={c.id} value={c.id}>
                  {c.id} - {c.full_name}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="account_type"
            label="Loại tài khoản"
            initialValue="checking"
          >
            <Select>
              <Select.Option value="checking">Thanh toán</Select.Option>
              <Select.Option value="saving">Tiết kiệm</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Accounts;