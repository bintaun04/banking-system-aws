import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tag,
  Typography,
  Space,
  Skeleton,
  Progress,
} from "antd";

import {
  UserOutlined,
  BankOutlined,
  SwapOutlined,
  DollarOutlined,
  WarningOutlined,
  RiseOutlined,
} from "@ant-design/icons";

import api from "../../api/axios";

const {
  Title,
  Text,
} = Typography;

const money = (value) =>
  Number(value || 0).toLocaleString(
    "vi-VN"
  ) + " ₫";

export default function AdminDashboard() {
  const [loading, setLoading] =
    useState(true);

  const [customers, setCustomers] =
    useState([]);

  const [accounts, setAccounts] =
    useState([]);

  const [
    transactions,
    setTransactions,
  ] = useState([]);

  const [loans, setLoans] =
    useState([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      const results =
        await Promise.allSettled([
          api.get(
            "/customers/?limit=1000"
          ),

          api.get(
            "/accounts/?limit=1000"
          ),

          api.get(
            "/transactions/?limit=1000"
          ),

          api.get(
            "/loans/?limit=1000"
          ),
        ]);

      if (
        results[0].status ===
        "fulfilled"
      )
        setCustomers(
          results[0].value.data || []
        );

      if (
        results[1].status ===
        "fulfilled"
      )
        setAccounts(
          results[1].value.data || []
        );

      if (
        results[2].status ===
        "fulfilled"
      )
        setTransactions(
          results[2].value.data || []
        );

      if (
        results[3].status ===
        "fulfilled"
      )
        setLoans(
          results[3].value.data || []
        );

      setLoading(false);
    };

    loadData();
  }, []);

  const totalBalance =
    useMemo(() => {
      return accounts
        .filter(
          (x) =>
            x.currency === "VND"
        )
        .reduce(
          (sum, x) =>
            sum +
            Number(
              x.balance || 0
            ),
          0
        );
    }, [accounts]);

  const badDebt =
    customers.filter(
      (x) => x.bad_debt
    ).length;

  const pendingLoans =
    loans.filter(
      (x) =>
        x.loan_status ===
        "pending"
    ).length;

  const badDebtRate =
    customers.length
      ? (
          (badDebt /
            customers.length) *
          100
        ).toFixed(1)
      : 0;

  const transactionColumns = [
    {
      title: "Mã giao dịch",
      dataIndex:
        "transaction_code",
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

      render: (value) => {
        const map = {
          deposit: "Nạp tiền",
          withdraw: "Rút tiền",
          transfer: "Chuyển khoản",
        };

        return (
          <Tag>
            {map[value] ||
              value}
          </Tag>
        );
      },
    },

    {
      title: "Số tiền",
      dataIndex: "amount",

      align: "right",

      render: (value) =>
        money(value),
    },

    {
      title: "Trạng thái",
      dataIndex: "status",

      render: (value) => (
        <Tag
          color={
            value === "success"
              ? "green"
              : value ===
                "pending"
              ? "orange"
              : "red"
          }
        >
          {value}
        </Tag>
      ),
    },

    {
      title: "Thời gian",
      dataIndex: "created_at",

      render: (value) =>
        value
          ? new Date(
              value
            ).toLocaleString(
              "vi-VN"
            )
          : "-",
    },
  ];

  if (loading) {
    return (
      <Skeleton
        active
        paragraph={{
          rows: 14,
        }}
      />
    );
  }

  return (
    <div>
      <div
        style={{
          marginBottom: 26,
        }}
      >
        <Title
          level={2}
          style={{
            marginBottom: 4,
          }}
        >
          Tổng quan hệ thống
        </Title>

        <Text type="secondary">
          Theo dõi hoạt động hệ
          thống NOVA Bank.
        </Text>
      </div>

      {/* KPI */}

      <Row
        gutter={[18, 18]}
      >
        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Khách hàng"
              value={
                customers.length
              }
              prefix={
                <UserOutlined />
              }
            />

            <Text type="secondary">
              Tổng số khách hàng
              trong hệ thống
            </Text>
          </Card>
        </Col>

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Tài khoản"
              value={
                accounts.length
              }
              prefix={
                <BankOutlined />
              }
            />

            <Text type="secondary">
              Tài khoản ngân hàng
            </Text>
          </Card>
        </Col>

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Giao dịch"
              value={
                transactions.length
              }
              prefix={
                <SwapOutlined />
              }
            />

            <Text type="secondary">
              Giao dịch được ghi
              nhận
            </Text>
          </Card>
        </Col>

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Khoản vay"
              value={
                loans.length
              }
              prefix={
                <DollarOutlined />
              }
            />

            <Text type="secondary">
              {pendingLoans} khoản
              đang chờ duyệt
            </Text>
          </Card>
        </Col>
      </Row>

      {/* FINANCIAL */}

      <Row
        gutter={[18, 18]}
        style={{
          marginTop: 18,
        }}
      >
        <Col
          xs={24}
          xl={16}
        >
          <Card>
            <Space
              direction="vertical"
              size={5}
            >
              <Text type="secondary">
                Tổng số dư tài khoản
                VND
              </Text>

              <Title
                level={2}
                style={{
                  margin: 0,
                }}
              >
                {money(
                  totalBalance
                )}
              </Title>

              <Text
                style={{
                  color:
                    "#16a34a",
                }}
              >
                <RiseOutlined />{" "}
                Tổng tài sản đang
                quản lý
              </Text>
            </Space>
          </Card>
        </Col>

        <Col
          xs={24}
          xl={8}
        >
          <Card>
            <Space
              direction="vertical"
              style={{
                width: "100%",
              }}
            >
              <Text
                strong
                style={{
                  fontSize: 16,
                }}
              >
                <WarningOutlined />{" "}
                Tỷ lệ nợ xấu
              </Text>

              <Progress
                percent={Number(
                  badDebtRate
                )}
                status={
                  Number(
                    badDebtRate
                  ) > 10
                    ? "exception"
                    : "normal"
                }
              />

              <Text type="secondary">
                {badDebt} /{" "}
                {customers.length}{" "}
                khách hàng
              </Text>
            </Space>
          </Card>
        </Col>
      </Row>

      {/* TRANSACTIONS */}

      <Card
        title="Giao dịch gần đây"
        style={{
          marginTop: 18,
        }}
      >
        <Table
          rowKey="id"
          columns={
            transactionColumns
          }
          dataSource={
            transactions
          }
          pagination={{
            pageSize: 7,
          }}
          scroll={{
            x: 900,
          }}
        />
      </Card>
    </div>
  );
}