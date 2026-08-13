import {
  useEffect,
  useMemo,
  useState,
} from "react";

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
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";

import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  HistoryOutlined,
  SwapOutlined,
} from "@ant-design/icons";

import {
  useLocation,
  useNavigate,
} from "react-router-dom";

import api from "../api/axios";


const {
  Title,
  Text,
} = Typography;


// ============================================================
// HELPERS
// ============================================================

const formatMoney = (
  value,
  currency = "VND"
) => {
  const number = Number(value || 0);

  if (currency === "VND") {
    return `${number.toLocaleString(
      "vi-VN"
    )} ₫`;
  }

  return `${number.toLocaleString(
    "en-US"
  )} ${currency}`;
};


const transactionName = {
  deposit: "Nạp tiền",
  withdraw: "Rút tiền",
  transfer: "Chuyển khoản",
};


// ============================================================
// TRANSACTIONS
// ============================================================

export default function Transactions() {
  const location = useLocation();

  const navigate = useNavigate();


  const queryParams =
    new URLSearchParams(
      location.search
    );


  const requestedTab =
    queryParams.get("tab");


  const defaultTab = [
    "history",
    "transfer",
    "deposit",
    "withdraw",
  ].includes(requestedTab)
    ? requestedTab
    : "history";


  const [activeTab, setActiveTab] =
    useState(defaultTab);


  const [accounts, setAccounts] =
    useState([]);


  const [
    transactions,
    setTransactions,
  ] = useState([]);


  const [loading, setLoading] =
    useState(false);


  const [
    submitting,
    setSubmitting,
  ] = useState(false);


  const [transferForm] =
    Form.useForm();


  const [depositForm] =
    Form.useForm();


  const [withdrawForm] =
    Form.useForm();


  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        accountsResponse,
        transactionsResponse,
      ] = await Promise.all([
        api.get("/accounts/"),

        api.get(
          "/transactions/?limit=100"
        ),
      ]);


      setAccounts(
        accountsResponse.data || []
      );


      setTransactions(
        transactionsResponse.data || []
      );

    } catch (error) {
      message.error(
        "Không thể tải dữ liệu giao dịch"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // ============================================================
  // ACCOUNT OPTIONS
  // ============================================================

  const accountOptions =
    useMemo(
      () =>
        accounts
          .filter(
            (account) =>
              account.status === "active"
          )
          .map((account) => ({
            value: account.id,

            label:
              `${account.account_number}` +
              ` - ${formatMoney(
                account.available_balance,
                account.currency
              )}`,
          })),
      [accounts]
    );


  // ============================================================
  // TAB
  // ============================================================

  const changeTab = (key) => {
    setActiveTab(key);

    navigate(
      `/transactions?tab=${key}`,
      {
        replace: true,
      }
    );
  };


  // ============================================================
  // TRANSFER
  // ============================================================

  const handleTransfer = async (
    values
  ) => {
    if (
      values.from_account_id ===
      values.to_account_id
    ) {
      message.warning(
        "Tài khoản gửi và nhận không được giống nhau"
      );

      return;
    }


    setSubmitting(true);

    try {
      await api.post(
        "/transactions/transfer",
        {
          from_account_id:
            values.from_account_id,

          to_account_id:
            values.to_account_id,

          amount:
            Number(values.amount),

          description:
            values.description ||
            "Chuyển khoản",
        }
      );


      message.success(
        "Chuyển tiền thành công"
      );


      transferForm.resetFields();


      await fetchData();


      changeTab("history");

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Chuyển tiền thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // DEPOSIT
  // ============================================================

  const handleDeposit = async (
    values
  ) => {
    setSubmitting(true);

    try {
      await api.post(
        "/transactions/deposit",
        {
          account_id:
            values.account_id,

          amount:
            Number(values.amount),

          description:
            values.description ||
            "Nạp tiền",
        }
      );


      message.success(
        "Nạp tiền thành công"
      );


      depositForm.resetFields();


      await fetchData();


      changeTab("history");

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Nạp tiền thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // WITHDRAW
  // ============================================================

  const handleWithdraw = async (
    values
  ) => {
    setSubmitting(true);

    try {
      await api.post(
        "/transactions/withdraw",
        {
          account_id:
            values.account_id,

          amount:
            Number(values.amount),

          description:
            values.description ||
            "Rút tiền",
        }
      );


      message.success(
        "Rút tiền thành công"
      );


      withdrawForm.resetFields();


      await fetchData();


      changeTab("history");

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Rút tiền thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // HISTORY TABLE
  // ============================================================

  const columns = [
    {
      title: "Mã giao dịch",

      dataIndex:
        "transaction_code",

      width: 210,

      render: (value) => (
        <Text strong>
          {value}
        </Text>
      ),
    },


    {
      title: "Loại",

      dataIndex:
        "transaction_type",

      width: 150,

      render: (value) => {
        let color = "blue";

        let icon =
          <SwapOutlined />;


        if (value === "deposit") {
          color = "green";

          icon =
            <ArrowDownOutlined />;
        }


        if (value === "withdraw") {
          color = "red";

          icon =
            <ArrowUpOutlined />;
        }


        return (
          <Tag
            color={color}
            icon={icon}
          >
            {
              transactionName[
                value
              ]
            }
          </Tag>
        );
      },
    },


    {
      title:
        "Tài khoản gửi",

      dataIndex:
        "from_account_id",

      render: (value) =>
        value || "-",
    },


    {
      title:
        "Tài khoản nhận",

      dataIndex:
        "to_account_id",

      render: (value) =>
        value || "-",
    },


    {
      title: "Số tiền",

      key: "amount",

      align: "right",

      render: (_, record) => (
        <Text strong>
          {formatMoney(
            record.amount,
            record.currency
          )}
        </Text>
      ),
    },


    {
      title: "Nội dung",

      dataIndex: "description",

      render: (value) =>
        value || "-",
    },


    {
      title: "Thời gian",

      dataIndex: "created_at",

      width: 180,

      render: (value) =>
        value
          ? new Date(
              value
            ).toLocaleString(
              "vi-VN"
            )
          : "-",
    },


    {
      title:
        "Trạng thái",

      dataIndex: "status",

      align: "center",

      width: 120,

      render: (value) => {
        const color =
          value === "success"
            ? "green"
            : value ===
              "pending"
            ? "orange"
            : "red";


        return (
          <Tag color={color}>
            {String(
              value
            ).toUpperCase()}
          </Tag>
        );
      },
    },
  ];


  // ============================================================
  // FORM CARD
  // ============================================================

  const FormContainer = ({
    title,
    description,
    children,
  }) => (
    <Card
      style={{
        borderRadius: 18,

        maxWidth: 800,
      }}
    >
      <Title
        level={4}
        style={{
          marginBottom: 5,
        }}
      >
        {title}
      </Title>

      <Text type="secondary">
        {description}
      </Text>

      <div
        style={{
          marginTop: 26,
        }}
      >
        {children}
      </div>
    </Card>
  );


  // ============================================================
  // TABS
  // ============================================================

  const items = [

    // ==========================================================
    // HISTORY
    // ==========================================================

    {
      key: "history",

      label: (
        <Space>
          <HistoryOutlined />
          Lịch sử
        </Space>
      ),

      children: (
        <Card
          bordered={false}

          style={{
            borderRadius: 18,
          }}
        >
          <Table
            columns={columns}

            dataSource={
              transactions
            }

            rowKey="id"

            loading={loading}

            scroll={{
              x: 1200,
            }}

            pagination={{
              pageSize: 10,

              showSizeChanger:
                false,
            }}

            locale={{
              emptyText: (
                <Empty description="Chưa có giao dịch" />
              ),
            }}
          />
        </Card>
      ),
    },


    // ==========================================================
    // TRANSFER
    // ==========================================================

    {
      key: "transfer",

      label: (
        <Space>
          <SwapOutlined />
          Chuyển tiền
        </Space>
      ),

      children: (
        <FormContainer
          title="Chuyển tiền"
          description="Chuyển tiền giữa các tài khoản trong hệ thống NOVA Bank."
        >
          {accounts.length < 1 && (
            <Alert
              type="warning"

              showIcon

              message="Bạn chưa có tài khoản hoạt động"

              style={{
                marginBottom: 20,
              }}
            />
          )}


          <Form
            form={transferForm}

            layout="vertical"

            onFinish={
              handleTransfer
            }
          >

            <Form.Item
              name="from_account_id"

              label="Tài khoản nguồn"

              rules={[
                {
                  required: true,

                  message:
                    "Chọn tài khoản nguồn",
                },
              ]}
            >
              <Select
                size="large"

                options={
                  accountOptions
                }

                placeholder="Chọn tài khoản"
              />
            </Form.Item>


            <Form.Item
              name="to_account_id"

              label="Tài khoản nhận"

              rules={[
                {
                  required: true,

                  message:
                    "Chọn tài khoản nhận",
                },
              ]}
            >
              <Select
                size="large"

                options={
                  accountOptions
                }

                placeholder="Chọn tài khoản nhận"
              />
            </Form.Item>


            <Form.Item
              name="amount"

              label="Số tiền"

              rules={[
                {
                  required: true,

                  message:
                    "Nhập số tiền",
                },
              ]}
            >
              <InputNumber
                min={1}

                size="large"

                style={{
                  width: "100%",
                }}

                addonAfter="VND"

                formatter={(
                  value
                ) =>
                  value
                    ? `${value}`.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                      )
                    : ""
                }

                parser={(
                  value
                ) =>
                  value
                    ? value.replace(
                        /,/g,
                        ""
                      )
                    : ""
                }
              />
            </Form.Item>


            <Form.Item
              name="description"

              label="Nội dung chuyển tiền"
            >
              <Input
                size="large"

                maxLength={255}

                placeholder="Nhập nội dung"
              />
            </Form.Item>


            <Button
              type="primary"

              htmlType="submit"

              size="large"

              loading={
                submitting
              }

              disabled={
                accountOptions.length ===
                0
              }
            >
              Chuyển tiền
            </Button>

          </Form>
        </FormContainer>
      ),
    },


    // ==========================================================
    // DEPOSIT
    // ==========================================================

    {
      key: "deposit",

      label: (
        <Space>
          <ArrowDownOutlined />
          Nạp tiền
        </Space>
      ),

      children: (
        <FormContainer
          title="Nạp tiền"
          description="Nạp tiền mô phỏng vào tài khoản."
        >
          <Form
            form={depositForm}

            layout="vertical"

            onFinish={
              handleDeposit
            }
          >

            <Form.Item
              name="account_id"

              label="Tài khoản"

              rules={[
                {
                  required: true,

                  message:
                    "Chọn tài khoản",
                },
              ]}
            >
              <Select
                size="large"

                options={
                  accountOptions
                }

                placeholder="Chọn tài khoản"
              />
            </Form.Item>


            <Form.Item
              name="amount"

              label="Số tiền nạp"

              rules={[
                {
                  required: true,

                  message:
                    "Nhập số tiền",
                },
              ]}
            >
              <InputNumber
                min={1}

                size="large"

                style={{
                  width: "100%",
                }}

                addonAfter="VND"

                formatter={(
                  value
                ) =>
                  value
                    ? `${value}`.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                      )
                    : ""
                }

                parser={(
                  value
                ) =>
                  value
                    ? value.replace(
                        /,/g,
                        ""
                      )
                    : ""
                }
              />
            </Form.Item>


            <Form.Item
              name="description"

              label="Nội dung"
            >
              <Input
                size="large"
                maxLength={255}
              />
            </Form.Item>


            <Button
              type="primary"

              htmlType="submit"

              size="large"

              loading={
                submitting
              }
            >
              Nạp tiền
            </Button>

          </Form>
        </FormContainer>
      ),
    },


    // ==========================================================
    // WITHDRAW
    // ==========================================================

    {
      key: "withdraw",

      label: (
        <Space>
          <ArrowUpOutlined />
          Rút tiền
        </Space>
      ),

      children: (
        <FormContainer
          title="Rút tiền"
          description="Rút tiền mô phỏng từ tài khoản."
        >
          <Form
            form={withdrawForm}

            layout="vertical"

            onFinish={
              handleWithdraw
            }
          >

            <Form.Item
              name="account_id"

              label="Tài khoản"

              rules={[
                {
                  required: true,

                  message:
                    "Chọn tài khoản",
                },
              ]}
            >
              <Select
                size="large"

                options={
                  accountOptions
                }
              />
            </Form.Item>


            <Form.Item
              name="amount"

              label="Số tiền rút"

              rules={[
                {
                  required: true,

                  message:
                    "Nhập số tiền",
                },
              ]}
            >
              <InputNumber
                min={1}

                size="large"

                style={{
                  width: "100%",
                }}

                addonAfter="VND"

                formatter={(
                  value
                ) =>
                  value
                    ? `${value}`.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ","
                      )
                    : ""
                }

                parser={(
                  value
                ) =>
                  value
                    ? value.replace(
                        /,/g,
                        ""
                      )
                    : ""
                }
              />
            </Form.Item>


            <Form.Item
              name="description"

              label="Nội dung"
            >
              <Input
                size="large"
                maxLength={255}
              />
            </Form.Item>


            <Button
              danger

              type="primary"

              htmlType="submit"

              size="large"

              loading={
                submitting
              }
            >
              Rút tiền
            </Button>

          </Form>
        </FormContainer>
      ),
    },

  ];


  // ============================================================
  // UI
  // ============================================================

  return (
    <div
      style={{
        width: "100%",
      }}
    >

      <div
        style={{
          marginBottom: 22,
        }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 5,
          }}
        >
          Giao dịch
        </Title>

        <Text type="secondary">
          Chuyển tiền, nạp/rút tiền và
          tra cứu lịch sử giao dịch.
        </Text>
      </div>


      <Tabs
        activeKey={activeTab}

        onChange={changeTab}

        items={items}

        size="large"
      />

    </div>
  );
}