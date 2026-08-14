import { useEffect, useState } from "react";
import { Alert, Avatar, Button, Card, Col, Empty, Row, Skeleton, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { ArrowDownOutlined, ArrowRightOutlined, ArrowUpOutlined, CreditCardOutlined, DollarOutlined, HistoryOutlined, SwapOutlined, WarningOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";

const { Title, Text } = Typography;


const formatMoney = (value, currency = "VND") => {
  const amount = Number(value || 0);

  if (currency === "VND") {
    return `${amount.toLocaleString("vi-VN")} ₫`;
  }

  return `${amount.toLocaleString("en-US")} ${currency}`;
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


export default function Dashboard() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);

  const [loading, setLoading] = useState(true);


  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const response = await api.get(
        "/dashboard/me"
      );

      setData(response.data);

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể tải Dashboard"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchDashboard();
  }, []);


  if (loading) {
    return (
      <Skeleton
        active
        paragraph={{
          rows: 12,
        }}
      />
    );
  }


  const customer = data?.customer;

  const summary =
    data?.financial_summary || {};

  const accounts =
    data?.accounts || [];

  const transactions =
    data?.recent_transactions || [];

  const loans =
    data?.loans || [];


  const transactionColumns = [
    {
      title: "Giao dịch",

      key: "transaction",

      render: (_, record) => (
        <Space>
          <Avatar
            icon={
              transactionTypeIcon[
                record.transaction_type
              ] || <HistoryOutlined />
            }
          />

          <div>
            <Text strong>
              {
                transactionTypeText[
                  record.transaction_type
                ] ||
                record.transaction_type
              }
            </Text>

            <div>
              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                }}
              >
                {
                  record.description ||
                  record.transaction_code
                }
              </Text>
            </div>
          </div>
        </Space>
      ),
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
      title: "Trạng thái",

      dataIndex: "status",

      render: (value) => (
        <Tag
          color={
            value === "success"
              ? "green"
              : value === "pending"
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


  return (
    <div
      style={{
        width: "100%",
      }}
    >

      {/* HEADER */}

      <div
        style={{
          marginBottom: 26,
        }}
      >
        <Text type="secondary">
          NOVA Digital Banking
        </Text>

        <Title
          level={2}
          style={{
            marginTop: 4,
            marginBottom: 4,
          }}
        >
          Xin chào,{" "}
          {
            customer?.full_name ||
            "Quý khách"
          }
        </Title>

        <Text type="secondary">
          Tổng quan tài chính của bạn.
        </Text>
      </div>


      {/* NO KYC */}

      {!data?.profile_complete && (
        <Alert
          type="warning"
          showIcon
          message="Bạn chưa hoàn thiện hồ sơ khách hàng"
          description={
            <Button
              type="primary"
              style={{
                marginTop: 12,
              }}
              onClick={() =>
                navigate("/profile")
              }
            >
              Hoàn thiện hồ sơ
            </Button>
          }
          style={{
            marginBottom: 22,
          }}
        />
      )}


      {/* BALANCE */}

      <Row gutter={[18, 18]}>

        <Col
          xs={24}
          xl={12}
        >
          <Card
            bordered={false}
            style={{
              height: "100%",

              color: "#fff",

              borderRadius: 22,

              background:
                "linear-gradient(135deg,#071a30,#07539d,#1686e8)",
            }}
          >
            <Text
              style={{
                color:
                  "rgba(255,255,255,.72)",
              }}
            >
              Tổng số dư
            </Text>

            <Title
              level={1}
              style={{
                color: "#fff",

                marginTop: 8,

                marginBottom: 10,
              }}
            >
              {formatMoney(
                summary.total_balance
              )}
            </Title>

            <Text
              style={{
                color:
                  "rgba(255,255,255,.72)",
              }}
            >
              Số dư khả dụng:{" "}
              {formatMoney(
                summary.available_balance
              )}
            </Text>
          </Card>
        </Col>


        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card
            style={{
              height: "100%",
            }}
          >
            <Statistic
              title="Dư nợ gốc"

              value={
                Number(
                  summary.total_outstanding_principal ||
                    0
                )
              }

              formatter={(value) =>
                Number(
                  value
                ).toLocaleString(
                  "vi-VN"
                )
              }

              suffix="₫"

              prefix={
                <DollarOutlined />
              }
            />

            <Text type="secondary">
              Khoản vay đã giải ngân
            </Text>
          </Card>
        </Col>


        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card
            style={{
              height: "100%",
            }}
          >
            <Statistic
              title="Dư nợ quá hạn"

              value={
                Number(
                  summary.overdue_outstanding_principal ||
                    0
                )
              }

              formatter={(value) =>
                Number(
                  value
                ).toLocaleString(
                  "vi-VN"
                )
              }

              suffix="₫"

              prefix={
                <WarningOutlined />
              }

              valueStyle={{
                color:
                  Number(
                    summary.overdue_outstanding_principal ||
                      0
                  ) > 0
                    ? "#dc2626"
                    : undefined,
              }}
            />

            <Text type="secondary">
              Phần dư nợ đang quá hạn
            </Text>
          </Card>
        </Col>

      </Row>


      {/* LOAN SUMMARY */}

      <Row
        gutter={[18, 18]}
        style={{
          marginTop: 18,
        }}
      >

        <Col
          xs={24}
          md={8}
        >
          <Card>
            <Statistic
              title="Tổng giá trị đề nghị vay"

              value={
                Number(
                  summary.total_requested_loan_amount ||
                    0
                )
              }

              formatter={(value) =>
                Number(
                  value
                ).toLocaleString(
                  "vi-VN"
                )
              }

              suffix="₫"
            />
          </Card>
        </Col>


        <Col
          xs={24}
          md={8}
        >
          <Card>
            <Statistic
              title="Đang chờ duyệt"

              value={
                Number(
                  summary.pending_loan_amount ||
                    0
                )
              }

              formatter={(value) =>
                Number(
                  value
                ).toLocaleString(
                  "vi-VN"
                )
              }

              suffix="₫"
            />
          </Card>
        </Col>


        <Col
          xs={24}
          md={8}
        >
          <Card>
            <Statistic
              title="Đã duyệt - chưa giải ngân"

              value={
                Number(
                  summary.approved_not_disbursed_amount ||
                    0
                )
              }

              formatter={(value) =>
                Number(
                  value
                ).toLocaleString(
                  "vi-VN"
                )
              }

              suffix="₫"
            />
          </Card>
        </Col>

      </Row>


      {/* QUICK ACTION */}

      <Title
        level={4}
        style={{
          marginTop: 28,
        }}
      >
        Giao dịch nhanh
      </Title>

      <Row gutter={[14, 14]}>

        <Col
          xs={12}
          md={6}
        >
          <Card
            hoverable
            onClick={() =>
              navigate(
                "/transactions?tab=transfer"
              )
            }
            style={{
              textAlign: "center",
            }}
          >
            <SwapOutlined
              style={{
                fontSize: 26,
                color: "#1677ff",
              }}
            />

            <div
              style={{
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Chuyển tiền
            </div>
          </Card>
        </Col>


        <Col
          xs={12}
          md={6}
        >
          <Card
            hoverable
            onClick={() =>
              navigate(
                "/transactions?tab=deposit"
              )
            }
            style={{
              textAlign: "center",
            }}
          >
            <ArrowDownOutlined
              style={{
                fontSize: 26,
                color: "#16a34a",
              }}
            />

            <div
              style={{
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Nạp tiền
            </div>
          </Card>
        </Col>


        <Col
          xs={12}
          md={6}
        >
          <Card
            hoverable
            onClick={() =>
              navigate("/loans")
            }
            style={{
              textAlign: "center",
            }}
          >
            <DollarOutlined
              style={{
                fontSize: 26,
                color: "#7c3aed",
              }}
            />

            <div
              style={{
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Khoản vay
            </div>
          </Card>
        </Col>


        <Col
          xs={12}
          md={6}
        >
          <Card
            hoverable
            onClick={() =>
              navigate("/loans")
            }
            style={{
              textAlign: "center",
            }}
          >
            <CreditCardOutlined
              style={{
                fontSize: 26,
                color: "#ea8a14",
              }}
            />

            <div
              style={{
                marginTop: 8,
                fontWeight: 600,
              }}
            >
              Trả nợ
            </div>
          </Card>
        </Col>

      </Row>


      {/* TRANSACTIONS */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          marginTop: 30,

          marginBottom: 14,
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
          }}
        >
          Giao dịch gần đây
        </Title>

        <Button
          type="link"
          onClick={() =>
            navigate("/transactions")
          }
        >
          Xem tất cả{" "}
          <ArrowRightOutlined />
        </Button>
      </div>


      <Card>
        <Table
          rowKey="id"

          columns={
            transactionColumns
          }

          dataSource={
            transactions
          }

          pagination={false}

          scroll={{
            x: 750,
          }}

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