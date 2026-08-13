import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  message,
  Space,
  Popconfirm,
  Typography,
} from "antd";
import { PlusOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import api from "../api/axios";
import dayjs from "dayjs";

const { Title } = Typography;

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form] = Form.useForm();

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/customers/");
      setCustomers(res.data);
    } catch (error) {
      message.error("Không thể tải danh sách khách hàng");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openModal = (record = null) => {
    setEditing(record);
    if (record) {
      form.setFieldsValue({
        ...record,
        date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
      });
    } else {
      form.resetFields();
    }
    setModalOpen(true);
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        ...values,
        date_of_birth: values.date_of_birth
          ? values.date_of_birth.format("YYYY-MM-DD")
          : null,
      };

      if (editing) {
        await api.put(`/customers/${editing.id}`, payload);
        message.success("Cập nhật thành công");
      } else {
        await api.post("/customers/", payload);
        message.success("Thêm khách hàng thành công");
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.detail || "Có lỗi xảy ra");
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/customers/${id}`);
      message.success("Xóa thành công");
      fetchCustomers();
    } catch (error) {
      message.error(error.response?.data?.detail || "Không thể xóa");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Họ tên", dataIndex: "full_name" },
    { title: "Số điện thoại", dataIndex: "phone" },
    { title: "Nghề nghiệp", dataIndex: "occupation" },
    {
      title: "Thu nhập",
      dataIndex: "monthly_income",
      render: (val) => Number(val).toLocaleString("vi-VN") + " đ",
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            onClick={() => openModal(record)}
          />
          <Popconfirm
            title="Bạn chắc chắn muốn xóa?"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <Title level={3}>Quản lý Khách hàng</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openModal()}>
          Thêm khách hàng
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={customers}
        rowKey="id"
        loading={loading}
        bordered
      />

      <Modal
        title={editing ? "Cập nhật khách hàng" : "Thêm khách hàng"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Lưu"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="full_name"
            label="Họ tên"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="date_of_birth" label="Ngày sinh">
            <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="gender" label="Giới tính">
            <Select allowClear>
              <Select.Option value="male">Nam</Select.Option>
              <Select.Option value="female">Nữ</Select.Option>
              <Select.Option value="other">Khác</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="phone" label="Số điện thoại">
            <Input />
          </Form.Item>
          <Form.Item name="permanent_address" label="Địa chỉ">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="occupation" label="Nghề nghiệp">
            <Input />
          </Form.Item>
          <Form.Item name="monthly_income" label="Thu nhập">
            <Input type="number" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Customers;