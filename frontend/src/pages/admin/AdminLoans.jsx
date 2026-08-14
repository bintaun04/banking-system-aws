import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Card, Col, Descriptions, Drawer, Empty, Input, Popconfirm, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { CheckCircleOutlined, CloseCircleOutlined, DollarOutlined, EyeOutlined, ReloadOutlined, SearchOutlined, WarningOutlined } from "@ant-design/icons";
import api from "../../api/axios";

const { Title, Text } = Typography;


const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
};


const statusMap = {
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
    color: "volcano",
  },

  closed: {
    text: "Đã tất toán",
    color: "default",
  },
};


export default function AdminLoans() {
  const [loans, setLoans] = useState([]);

  const [summary, setSummary] = useState({
    total_loans: 0,

    total_requested_amount: 0,

    pending_count: 0,
    pending_amount: 0,

    approved_count: 0,
    approved_not_disbursed_amount: 0,

    active_count: 0,

    outstanding_principal: 0,

    overdue_count: 0,
    overdue_outstanding: 0,

    rejected_count: 0,

    closed_count: 0,
  });

  const [loading, setLoading] = useState(false);

  const [updatingId, setUpdatingId] =
    useState(null);

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedLoan, setSelectedLoan] =
    useState(null);

  const [drawerOpen, setDrawerOpen] =
    useState(false);


  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      const response = await api.get(
        "/loans/admin/overview"
      );

      setSummary(
        response.data.summary || {}
      );

      setLoans(
        response.data.loans || []
      );

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể tải dữ liệu khoản vay"
      );
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, []);


  // ============================================================
  // FILTER
  // ============================================================

  const filteredLoans = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    return loans.filter((loan) => {
      const matchSearch =
        !keyword ||
        loan.loan_code
          ?.toLowerCase()
          .includes(keyword) ||
        loan.customer_name
          ?.toLowerCase()
          .includes(keyword) ||
        loan.customer_code
          ?.toLowerCase()
          .includes(keyword) ||
        loan.national_id
          ?.toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === "all" ||
        loan.loan_status === statusFilter;

      return (
        matchSearch &&
        matchStatus
      );
    });
  }, [
    loans,
    search,
    statusFilter,
  ]);


  // ============================================================
  // UPDATE STATUS
  // ============================================================

  const updateLoanStatus = async (
    loan,
    newStatus
  ) => {
    setUpdatingId(loan.id);

    try {
      await api.put(
        `/loans/${loan.id}`,
        {
          loan_status: newStatus,
        }
      );

      message.success(
        "Cập nhật trạng thái khoản vay thành công"
      );

      setDrawerOpen(false);

      await fetchData();

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể cập nhật khoản vay"
      );
    } finally {
      setUpdatingId(null);
    }
  };


  // ============================================================
  // ACTIONS
  // ============================================================

  const renderActions = (loan) => {
    if (
      loan.loan_status === "pending"
    ) {
      return (
        <Space>
          <Popconfirm
            title="Duyệt khoản vay?"
            description="Khoản vay sẽ được chuyển sang trạng thái đã duyệt nhưng chưa giải ngân."
            okText="Duyệt"
            cancelText="Hủy"
            onConfirm={() =>
              updateLoanStatus(
                loan,
                "approved"
              )
            }
          >
            <Button
              type="primary"
              size="small"
              loading={
                updatingId === loan.id
              }
              icon={
                <CheckCircleOutlined />
              }
            >
              Duyệt
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Từ chối khoản vay?"
            okText="Từ chối"
            cancelText="Hủy"
            okButtonProps={{
              danger: true,
            }}
            onConfirm={() =>
              updateLoanStatus(
                loan,
                "rejected"
              )
            }
          >
            <Button
              danger
              size="small"
              icon={
                <CloseCircleOutlined />
              }
            >
              Từ chối
            </Button>
          </Popconfirm>
        </Space>
      );
    }


    if (
      loan.loan_status === "approved"
    ) {
      return (
        <Popconfirm
          title="Giải ngân khoản vay?"
          description="Sau khi kích hoạt, khoản vay sẽ bắt đầu được tính vào dư nợ."
          okText="Giải ngân"
          cancelText="Hủy"
          onConfirm={() =>
            updateLoanStatus(
              loan,
              "active"
            )
          }
        >
          <Button
            type="primary"
            size="small"
          >
            Giải ngân
          </Button>
        </Popconfirm>
      );
    }


    if (
      loan.loan_status === "active"
    ) {
      return (
        <Popconfirm
          title="Đánh dấu quá hạn?"
          description="Khoản vay sẽ chuyển sang nhóm quá hạn."
          okText="Xác nhận"
          cancelText="Hủy"
          onConfirm={() =>
            updateLoanStatus(
              loan,
              "overdue"
            )
          }
        >
          <Button
            danger
            size="small"
            icon={
              <WarningOutlined />
            }
          >
            Quá hạn
          </Button>
        </Popconfirm>
      );
    }


    if (
      loan.loan_status === "overdue"
    ) {
      return (
        <Popconfirm
          title="Khôi phục trạng thái?"
          description="Chuyển khoản vay về trạng thái đang vay."
          onConfirm={() =>
            updateLoanStatus(
              loan,
              "active"
            )
          }
        >
          <Button size="small">
            Khôi phục
          </Button>
        </Popconfirm>
      );
    }


    return (
      <Text type="secondary">
        -
      </Text>
    );
  };


  // ============================================================
  // TABLE
  // ============================================================

  const columns = [
    {
      title: "Mã khoản vay",

      dataIndex: "loan_code",

      width: 200,

      render: (value) => (
        <Text strong>
          {value}
        </Text>
      ),
    },

    {
      title: "Khách hàng",

      key: "customer",

      width: 220,

      render: (_, record) => (
        <div>
          <Text strong>
            {
              record.customer_name ||
              "-"
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
                record.customer_code ||
                "-"
              }
            </Text>
          </div>
        </div>
      ),
    },

    {
      title: "Số tiền vay",

      dataIndex: "loan_amount",

      width: 160,

      align: "right",

      render: (value) =>
        formatMoney(value),
    },

    {
      title: "Đã trả gốc",

      dataIndex: "paid_principal",

      width: 150,

      align: "right",

      render: (value) => (
        <Text
          style={{
            color: "#16a34a",
          }}
        >
          {formatMoney(value)}
        </Text>
      ),
    },

    {
      title: "Dư nợ gốc",

      dataIndex:
        "outstanding_principal",

      width: 170,

      align: "right",

      render: (value, record) => (
        <Text
          strong
          style={{
            color:
              record.loan_status ===
              "overdue"
                ? "#dc2626"
                : "#172033",
          }}
        >
          {formatMoney(value)}
        </Text>
      ),
    },

    {
      title: "Lãi suất",

      dataIndex:
        "interest_rate",

      width: 110,

      align: "center",

      render: (value) =>
        `${value}%`,
    },

    {
      title: "Kỳ hạn",

      dataIndex: "loan_term",

      width: 110,

      align: "center",

      render: (value) =>
        `${value} tháng`,
    },

    {
      title: "Trạng thái",

      dataIndex:
        "loan_status",

      width: 130,

      align: "center",

      render: (value) => {
        const info =
          statusMap[value] || {
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

    {
      title: "Thao tác",

      key: "actions",

      fixed: "right",

      width: 230,

      render: (_, record) => (
        <Space>
          <Button
            type="text"

            icon={
              <EyeOutlined />
            }

            onClick={() => {
              setSelectedLoan(
                record
              );

              setDrawerOpen(
                true
              );
            }}
          />

          {renderActions(
            record
          )}
        </Space>
      ),
    },
  ];


  return (
    <div
      style={{
        width: "100%",
      }}
    >

      {/* ======================================================
          TITLE
      ====================================================== */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          marginBottom: 24,
        }}
      >
        <div>
          <Title
            level={2}

            style={{
              marginBottom: 4,
            }}
          >
            Quản lý khoản vay
          </Title>

          <Text type="secondary">
            Xét duyệt, giải ngân và
            theo dõi dư nợ tín dụng.
          </Text>
        </div>

        <Button
          icon={
            <ReloadOutlined />
          }

          onClick={
            fetchData
          }
        >
          Làm mới
        </Button>
      </div>


      {/* ======================================================
          IMPORTANT KPI
      ====================================================== */}

      <Row gutter={[16, 16]}>

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Dư nợ gốc đang quản lý"

              value={
                Number(
                  summary.outstanding_principal ||
                    0
                )
              }

              precision={0}

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

              valueStyle={{
                color: "#1677ff",
              }}
            />

            <Text type="secondary">
              Chỉ gồm khoản vay
              active + overdue
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
              title="Giá trị đang chờ duyệt"

              value={
                Number(
                  summary.pending_amount ||
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

              valueStyle={{
                color: "#d97706",
              }}
            />

            <Text type="secondary">
              {
                summary.pending_count ||
                0
              }{" "}
              hồ sơ
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

            <Text type="secondary">
              {
                summary.approved_count ||
                0
              }{" "}
              khoản vay
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
              title="Dư nợ quá hạn"

              value={
                Number(
                  summary.overdue_outstanding ||
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

              valueStyle={{
                color: "#dc2626",
              }}
            />

            <Text type="secondary">
              {
                summary.overdue_count ||
                0
              }{" "}
              khoản quá hạn
            </Text>
          </Card>
        </Col>

      </Row>


      {/* ======================================================
          SECONDARY INFO
      ====================================================== */}

      <Alert
        type="info"

        showIcon

        style={{
          marginTop: 18,
        }}

        message={
          `Tổng giá trị đề nghị vay: ${formatMoney(
            summary.total_requested_amount
          )}`
        }

        description="Chỉ số này là tổng giá trị hồ sơ vay, không phải tổng số dư tiền gửi và cũng không phải dư nợ hiện tại."
      />


      {/* ======================================================
          FILTER
      ====================================================== */}

      <Card
        style={{
          marginTop: 18,
          marginBottom: 18,
        }}
      >
        <Space
          wrap
          size={12}
        >
          <Input
            allowClear

            prefix={
              <SearchOutlined />
            }

            placeholder="Mã vay, khách hàng, mã KH, CCCD..."

            value={search}

            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }

            style={{
              width: 350,
            }}
          />


          <Select
            value={statusFilter}

            onChange={
              setStatusFilter
            }

            style={{
              width: 210,
            }}

            options={[
              {
                value: "all",
                label:
                  "Tất cả trạng thái",
              },

              {
                value: "pending",
                label:
                  "Chờ duyệt",
              },

              {
                value: "approved",
                label:
                  "Đã duyệt",
              },

              {
                value: "active",
                label:
                  "Đang vay",
              },

              {
                value: "overdue",
                label:
                  "Quá hạn",
              },

              {
                value: "rejected",
                label:
                  "Từ chối",
              },

              {
                value: "closed",
                label:
                  "Đã tất toán",
              },
            ]}
          />
        </Space>
      </Card>


      {/* ======================================================
          TABLE
      ====================================================== */}

      <Card>
        <Table
          rowKey="id"

          loading={loading}

          columns={columns}

          dataSource={
            filteredLoans
          }

          scroll={{
            x: 1500,
          }}

          pagination={{
            pageSize: 10,

            showSizeChanger: true,

            showTotal: (
              total
            ) =>
              `${total} khoản vay`,
          }}

          locale={{
            emptyText: (
              <Empty description="Chưa có khoản vay" />
            ),
          }}
        />
      </Card>


      {/* ======================================================
          DETAIL DRAWER
      ====================================================== */}

      <Drawer
        title="Chi tiết khoản vay"

        width={680}

        open={drawerOpen}

        onClose={() =>
          setDrawerOpen(false)
        }
      >
        {selectedLoan && (
          <>
            <Title
              level={4}
              style={{
                marginTop: 0,
              }}
            >
              {
                selectedLoan.loan_code
              }
            </Title>

            <Tag
              color={
                statusMap[
                  selectedLoan.loan_status
                ]?.color
              }
            >
              {
                statusMap[
                  selectedLoan.loan_status
                ]?.text
              }
            </Tag>


            <Descriptions
              bordered
              column={1}

              style={{
                marginTop: 22,
              }}
            >

              <Descriptions.Item label="Khách hàng">
                {
                  selectedLoan.customer_name ||
                  "-"
                }
              </Descriptions.Item>


              <Descriptions.Item label="Mã khách hàng">
                {
                  selectedLoan.customer_code ||
                  "-"
                }
              </Descriptions.Item>


              <Descriptions.Item label="CCCD">
                {
                  selectedLoan.national_id ||
                  "-"
                }
              </Descriptions.Item>


              <Descriptions.Item label="Thu nhập">
                {formatMoney(
                  selectedLoan.monthly_income
                )}
              </Descriptions.Item>


              <Descriptions.Item label="Nợ xấu">
                {
                  selectedLoan.bad_debt
                    ? (
                      <Tag color="red">
                        Có nợ xấu
                      </Tag>
                    )
                    : (
                      <Tag color="green">
                        Bình thường
                      </Tag>
                    )
                }
              </Descriptions.Item>


              <Descriptions.Item label="Số tiền vay ban đầu">
                {formatMoney(
                  selectedLoan.loan_amount
                )}
              </Descriptions.Item>


              <Descriptions.Item label="Gốc đã trả">
                <Text
                  style={{
                    color:
                      "#16a34a",
                  }}
                >
                  {formatMoney(
                    selectedLoan.paid_principal
                  )}
                </Text>
              </Descriptions.Item>


              <Descriptions.Item label="Dư nợ gốc">
                <Text
                  strong
                  style={{
                    color:
                      selectedLoan.loan_status ===
                      "overdue"
                        ? "#dc2626"
                        : "#1677ff",
                  }}
                >
                  {formatMoney(
                    selectedLoan.outstanding_principal
                  )}
                </Text>
              </Descriptions.Item>


              <Descriptions.Item label="Lãi suất">
                {
                  selectedLoan.interest_rate
                }
                % / năm
              </Descriptions.Item>


              <Descriptions.Item label="Kỳ hạn">
                {
                  selectedLoan.loan_term
                }{" "}
                tháng
              </Descriptions.Item>


              <Descriptions.Item label="Ngày giải ngân">
                {
                  selectedLoan.start_date ||
                  "-"
                }
              </Descriptions.Item>


              <Descriptions.Item label="Ngày kết thúc">
                {
                  selectedLoan.end_date ||
                  "-"
                }
              </Descriptions.Item>


              <Descriptions.Item label="Mục đích">
                {
                  selectedLoan.purpose ||
                  "-"
                }
              </Descriptions.Item>

            </Descriptions>


            <div
              style={{
                marginTop: 24,
              }}
            >
              {renderActions(
                selectedLoan
              )}
            </div>
          </>
        )}
      </Drawer>

    </div>
  );
}