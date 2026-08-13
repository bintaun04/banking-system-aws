import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Row,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from "antd";

import {
  ArrowDownOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  BankOutlined,
  CreditCardOutlined,
  DollarOutlined,
  HistoryOutlined,
  SwapOutlined,
  UserOutlined,
  WalletOutlined,
} from "@ant-design/icons";

import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const { Title, Text } = Typography;


// ============================================================
// HELPERS
// ============================================================

const formatMoney = (value, currency = "VND") => {
  const amount = Number(value || 0);

  if (currency === "VND") {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }

  return `${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
};


const maskAccountNumber = (number) => {
  if (!number) return "-";

  if (number.length <= 4) {
    return number;
  }

  return `•••• •••• ${number.slice(-4)}`;
};


const transactionTypeText = {
  deposit: "Nạp tiền",
  withdraw: "Rút tiền",
  transfer: "Chuyển khoản",
};


const transactionTypeIcon = {
  deposit: <ArrowDownOutlined />,
  withdraw: <ArrowUpOutlined />,
  transfer: <SwapOutlined />,
};


// ============================================================
// DASHBOARD
// ============================================================

export default function Dashboard() {
  const navigate = useNavigate();

  const [customer, setCustomer] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);

  const [loading, setLoading] = useState(true);


  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const [
        customerResult,
        accountResult,
        transactionResult,
        loanResult,
      ] = await Promise.allSettled([
        api.get("/customers/me"),
        api.get("/accounts/"),
        api.get("/transactions/?limit=10"),
        api.get("/loans/"),
      ]);


      // Customer
      if (customerResult.status === "fulfilled") {
        setCustomer(customerResult.value.data);
      } else {
        setCustomer(null);
      }


      // Accounts
      if (accountResult.status === "fulfilled") {
        setAccounts(accountResult.value.data || []);
      } else {
        setAccounts([]);
      }


      // Transactions
      if (transactionResult.status === "fulfilled") {
        setTransactions(transactionResult.value.data || []);
      } else {
        setTransactions([]);
      }


      // Loans
      if (loanResult.status === "fulfilled") {
        setLoans(loanResult.value.data || []);
      } else {
        setLoans([]);
      }

    } catch (error) {
      message.error("Không thể tải Dashboard");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboard();
  }, []);


  // ============================================================
  // CALCULATIONS
  // ============================================================

  const totalBalance = useMemo(() => {
    return accounts
      .filter((account) => account.currency === "VND")
      .reduce(
        (total, account) =>
          total + Number(account.available_balance || 0),
        0
      );
  }, [accounts]);


  const activeLoans = useMemo(() => {
    return loans.filter((loan) =>
      ["approved", "active", "overdue"].includes(
        loan.loan_status
      )
    );
  }, [loans]);


  // ============================================================
  // TRANSACTION TABLE
  // ============================================================

  const transactionColumns = [
    {
      title: "Giao dịch",
      key: "transaction",
      render: (_, record) => (
        <Space>
          <Avatar
            icon={
              transactionTypeIcon[record.transaction_type] ||
              <HistoryOutlined />
            }
          />

          <div>
            <div style={{ fontWeight: 600 }}>
              {transactionTypeText[record.transaction_type] ||
                record.transaction_type}
            </div>

            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description || record.transaction_code}
            </Text>
          </div>
        </Space>
      ),
    },

    {
      title: "Thời gian",
      dataIndex: "created_at",
      render: (value) =>
        value
          ? new Date(value).toLocaleString("vi-VN")
          : "-",
    },

    {
      title: "Số tiền",
      key: "amount",
      align: "right",
      render: (_, record) => {
        const isDeposit =
          record.transaction_type === "deposit";

        return (
          <Text
            strong
            style={{
              color: isDeposit ? "#16a34a" : "#dc2626",
            }}
          >
            {isDeposit ? "+" : "-"}
            {formatMoney(record.amount, record.currency)}
          </Text>
        );
      },
    },

    {
      title: "Trạng thái",
      dataIndex: "status",
      align: "center",
      render: (value) => {
        const color =
          value === "success"
            ? "green"
            : value === "pending"
            ? "orange"
            : "red";

        return (
          <Tag color={color}>
            {String(value).toUpperCase()}
          </Tag>
        );
      },
    },
  ];


  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <div style={{ width: "100%" }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }


  // ============================================================
  // UI
  // ============================================================

  return (
    <div style={{ width: "100%" }}>

      {/* ======================================================
          WELCOME
      ====================================================== */}

      <div style={{ marginBottom: 28 }}>
        <Text type="secondary">
          Ngân hàng số NOVA
        </Text>

        <Title
          level={2}
          style={{
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          Xin chào,{" "}
          {customer?.full_name || "Quý khách"} 👋
        </Title>

        <Text type="secondary">
          Chúc bạn một ngày giao dịch thuận lợi.
        </Text>
      </div>


      {/* ======================================================
          CHƯA CÓ CUSTOMER
      ====================================================== */}

      {!customer && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
          message="Bạn chưa hoàn thiện hồ sơ khách hàng"
          description={
            <div>
              Hãy hoàn thiện thông tin KYC để sử dụng đầy đủ
              chức năng ngân hàng.

              <div style={{ marginTop: 12 }}>
                <Button
                  type="primary"
                  onClick={() => navigate("/profile")}
                >
                  Hoàn thiện hồ sơ
                </Button>
              </div>
            </div>
          }
        />
      )}


      {/* ======================================================
          BALANCE + INFO
      ====================================================== */}

      <Row gutter={[20, 20]}>

        <Col xs={24} lg={15}>
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 22,
              color: "white",
              background:
                "linear-gradient(135deg, #071a30 0%, #064b92 55%, #1686e8 100%)",
              boxShadow:
                "0 16px 38px rgba(9, 79, 145, 0.20)",
            }}
          >
            <Text
              style={{
                color: "rgba(255,255,255,.75)",
              }}
            >
              Tổng số dư khả dụng
            </Text>

            <Title
              level={1}
              style={{
                color: "white",
                marginTop: 8,
                marginBottom: 28,
              }}
            >
              {formatMoney(totalBalance)}
            </Title>


            <Row gutter={[16, 16]}>

              <Col xs={12}>
                <Text
                  style={{
                    color: "rgba(255,255,255,.7)",
                  }}
                >
                  Số tài khoản
                </Text>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {accounts.length}
                </div>
              </Col>


              <Col xs={12}>
                <Text
                  style={{
                    color: "rgba(255,255,255,.7)",
                  }}
                >
                  Khoản vay
                </Text>

                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginTop: 4,
                  }}
                >
                  {activeLoans.length}
                </div>
              </Col>

            </Row>
          </Card>
        </Col>


        <Col xs={24} lg={9}>
          <Card
            bordered={false}
            style={{
              height: "100%",
              borderRadius: 22,
            }}
          >
            <Space
              direction="vertical"
              size={18}
              style={{ width: "100%" }}
            >
              <div>
                <Text type="secondary">
                  Mã khách hàng
                </Text>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {customer?.customer_code || "-"}
                </div>
              </div>


              <div>
                <Text type="secondary">
                  Họ và tên
                </Text>

                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                  }}
                >
                  {customer?.full_name || "-"}
                </div>
              </div>


              <div>
                <Text type="secondary">
                  Trạng thái tín dụng
                </Text>

                <div style={{ marginTop: 5 }}>
                  {customer ? (
                    customer.bad_debt ? (
                      <Tag color="red">CÓ NỢ XẤU</Tag>
                    ) : (
                      <Tag color="green">
                        BÌNH THƯỜNG
                      </Tag>
                    )
                  ) : (
                    "-"
                  )}
                </div>
              </div>
            </Space>
          </Card>
        </Col>

      </Row>


      {/* ======================================================
          QUICK ACTION
      ====================================================== */}

      <Title
        level={4}
        style={{
          marginTop: 30,
          marginBottom: 16,
        }}
      >
        Giao dịch nhanh
      </Title>

      <Row gutter={[16, 16]}>

        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            onClick={() =>
              navigate("/transactions?tab=transfer")
            }
            style={{
              textAlign: "center",
              borderRadius: 16,
            }}
          >
            <SwapOutlined
              style={{
                fontSize: 28,
                color: "#1677ff",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              Chuyển tiền
            </div>
          </Card>
        </Col>


        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            onClick={() =>
              navigate("/transactions?tab=deposit")
            }
            style={{
              textAlign: "center",
              borderRadius: 16,
            }}
          >
            <ArrowDownOutlined
              style={{
                fontSize: 28,
                color: "#16a34a",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              Nạp tiền
            </div>
          </Card>
        </Col>


        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            onClick={() =>
              navigate("/transactions?tab=withdraw")
            }
            style={{
              textAlign: "center",
              borderRadius: 16,
            }}
          >
            <ArrowUpOutlined
              style={{
                fontSize: 28,
                color: "#dc2626",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              Rút tiền
            </div>
          </Card>
        </Col>


        <Col xs={12} sm={12} md={6}>
          <Card
            hoverable
            onClick={() => navigate("/loans")}
            style={{
              textAlign: "center",
              borderRadius: 16,
            }}
          >
            <DollarOutlined
              style={{
                fontSize: 28,
                color: "#7c3aed",
              }}
            />

            <div
              style={{
                marginTop: 10,
                fontWeight: 600,
              }}
            >
              Khoản vay
            </div>
          </Card>
        </Col>

      </Row>


      {/* ======================================================
          ACCOUNTS
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 32,
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Tài khoản của tôi
        </Title>

        <Button
          type="link"
          onClick={() => navigate("/accounts")}
        >
          Xem tất cả <ArrowRightOutlined />
        </Button>
      </div>


      {accounts.length === 0 ? (
        <Card style={{ borderRadius: 16 }}>
          <Empty description="Chưa có tài khoản ngân hàng" />
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {accounts.slice(0, 3).map((account) => (
            <Col
              xs={24}
              md={12}
              xl={8}
              key={account.id}
            >
              <Card
                hoverable
                bordered={false}
                style={{
                  borderRadius: 18,
                  boxShadow:
                    "0 8px 24px rgba(0,0,0,.06)",
                }}
              >
                <Space
                  align="start"
                  style={{
                    width: "100%",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Text type="secondary">
                      {account.account_type === "saving"
                        ? "Tài khoản tiết kiệm"
                        : "Tài khoản thanh toán"}
                    </Text>

                    <Title
                      level={4}
                      style={{
                        marginTop: 5,
                        marginBottom: 4,
                      }}
                    >
                      {maskAccountNumber(
                        account.account_number
                      )}
                    </Title>

                    <Tag
                      color={
                        account.status === "active"
                          ? "green"
                          : "orange"
                      }
                    >
                      {String(
                        account.status
                      ).toUpperCase()}
                    </Tag>
                  </div>

                  <Avatar
                    size={44}
                    icon={<CreditCardOutlined />}
                  />
                </Space>


                <div style={{ marginTop: 24 }}>
                  <Text type="secondary">
                    Số dư khả dụng
                  </Text>

                  <div
                    style={{
                      marginTop: 4,
                      fontWeight: 700,
                      fontSize: 22,
                    }}
                  >
                    {formatMoney(
                      account.available_balance,
                      account.currency
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}


      {/* ======================================================
          RECENT TRANSACTIONS
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 32,
          marginBottom: 16,
        }}
      >
        <Title level={4} style={{ margin: 0 }}>
          Giao dịch gần đây
        </Title>

        <Button
          type="link"
          onClick={() => navigate("/transactions")}
        >
          Xem lịch sử <ArrowRightOutlined />
        </Button>
      </div>


      <Card
        bordered={false}
        style={{
          borderRadius: 18,
        }}
      >
        <Table
          columns={transactionColumns}
          dataSource={transactions.slice(0, 8)}
          rowKey="id"
          pagination={false}
          scroll={{ x: 760 }}
          locale={{
            emptyText: (
              <Empty description="Chưa có giao dịch" />
            ),
          }}
        />
      </Card>

    </div>
  );
}