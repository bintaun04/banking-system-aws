import { useEffect, useState } from "react";
import { Alert, Button, Card, Col, Descriptions, Drawer, Empty, Form, Input, InputNumber, Modal, Row, Select, Space, Statistic, Table, Tag, Typography, message } from "antd";
import { DollarOutlined, EyeOutlined, PayCircleOutlined, PlusOutlined, ReloadOutlined, WarningOutlined } from "@ant-design/icons";
import api from "../api/axios";

const { Title, Text } = Typography;


const formatMoney = (value) => {
  return `${Number(value || 0).toLocaleString("vi-VN")} ₫`;
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
    color: "volcano",
  },

  closed: {
    text: "Đã tất toán",
    color: "default",
  },
};


export default function Loans() {
  const [customer, setCustomer] = useState(null);

  const [accounts, setAccounts] = useState([]);

  const [loans, setLoans] = useState([]);

  const [summary, setSummary] = useState({});

  const [loading, setLoading] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);

  const [repayOpen, setRepayOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);

  const [selectedLoan, setSelectedLoan] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [createForm] = Form.useForm();

  const [repayForm] = Form.useForm();


  // ============================================================
  // FETCH
  // ============================================================

  const fetchData = async () => {
    setLoading(true);

    try {
      const [
        customerResponse,
        accountsResponse,
        loansResponse,
      ] = await Promise.all([
        api.get("/customers/me"),

        api.get("/accounts/"),

        api.get("/loans/my/overview"),
      ]);


      setCustomer(
        customerResponse.data
      );


      setAccounts(
        accountsResponse.data || []
      );


      setLoans(
        loansResponse.data.loans ||
          []
      );


      setSummary(
        loansResponse.data.summary ||
          {}
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
  // ACCOUNT OPTIONS
  // ============================================================

  const accountOptions = accounts
    .filter(
      (account) =>
        account.status === "active" &&
        account.currency === "VND"
    )
    .map((account) => ({
      value: account.id,

      label:
        `${account.account_number} - ` +
        `${formatMoney(account.available_balance)}`,
    }));


  // ============================================================
  // CREATE LOAN
  // ============================================================

  const createLoan = async (
    values
  ) => {
    if (!customer) {
      message.error(
        "Không tìm thấy hồ sơ khách hàng"
      );

      return;
    }


    setSubmitting(true);


    try {
      await api.post(
        "/loans/",
        {
          customer_id:
            customer.id,

          disbursement_account_id:
            values.disbursement_account_id,

          loan_amount:
            Number(
              values.loan_amount
            ),

          interest_rate:
            Number(
              values.interest_rate
            ),

          loan_term:
            Number(
              values.loan_term
            ),

          purpose:
            values.purpose ||
            null,
        }
      );


      message.success(
        "Đã gửi yêu cầu vay"
      );


      setCreateOpen(false);

      createForm.resetFields();

      await fetchData();

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
  // REPAY
  // ============================================================

  const openRepay = (loan) => {
    setSelectedLoan(loan);

    repayForm.resetFields();

    setRepayOpen(true);
  };


  const repayLoan = async (
    values
  ) => {
    if (!selectedLoan) {
      return;
    }


    setSubmitting(true);


    try {
      const response = await api.post(
        `/loans/${selectedLoan.id}/repay`,
        {
          account_id:
            values.account_id,

          amount:
            Number(values.amount),
        }
      );


      message.success(
        `Trả nợ thành công. Dư nợ còn ${formatMoney(
          response.data.outstanding_principal
        )}`
      );


      setRepayOpen(false);

      repayForm.resetFields();

      await fetchData();

    } catch (error) {
      message.error(
        error.response?.data?.detail ||
          "Không thể trả nợ"
      );
    } finally {
      setSubmitting(false);
    }
  };


  // ============================================================
  // TABLE
  // ============================================================

  const columns = [
    {
      title: "Mã khoản vay",

      dataIndex: "loan_code",

      width: 190,

      render: (value) => (
        <Text strong>
          {value}
        </Text>
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
      title: "Đã trả",

      dataIndex:
        "paid_principal",

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
      title: "Dư nợ",

      dataIndex:
        "outstanding_principal",

      align: "right",

      render: (value, record) => (
        <Text
          strong
          style={{
            color:
              record.loan_status ===
              "overdue"
                ? "#dc2626"
                : undefined,
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

      align: "center",

      render: (value) =>
        `${value}%/năm`,
    },


    {
      title: "Kỳ hạn",

      dataIndex: "loan_term",

      align: "center",

      render: (value) =>
        `${value} tháng`,
    },


    {
      title: "Trạng thái",

      dataIndex:
        "loan_status",

      align: "center",

      render: (value) => {
        const info =
          statusInfo[value] || {};

        return (
          <Tag color={info.color}>
            {
              info.text ||
              value
            }
          </Tag>
        );
      },
    },


    {
      title: "Thao tác",

      key: "action",

      fixed: "right",

      width: 190,

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

              setDetailOpen(
                true
              );
            }}
          />


          {[
            "active",
            "overdue",
          ].includes(
            record.loan_status
          ) &&
            Number(
              record.outstanding_principal ||
                0
            ) > 0 && (
              <Button
                type="primary"

                size="small"

                icon={
                  <PayCircleOutlined />
                }

                onClick={() =>
                  openRepay(
                    record
                  )
                }
              >
                Trả nợ
              </Button>
            )}
        </Space>
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

      {/* HEADER */}

      <div
        style={{
          display: "flex",

          justifyContent:
            "space-between",

          alignItems:
            "flex-start",

          gap: 16,

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
            Khoản vay
          </Title>

          <Text type="secondary">
            Quản lý khoản vay và
            thanh toán dư nợ.
          </Text>
        </div>


        <Space>
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


          <Button
            type="primary"

            icon={
              <PlusOutlined />
            }

            onClick={() =>
              setCreateOpen(
                true
              )
            }

            disabled={
              accountOptions.length ===
              0
            }
          >
            Đăng ký vay
          </Button>
        </Space>
      </div>


      {/* ======================================================
          LOAN ONLY
      ====================================================== */}

      <Row gutter={[16, 16]}>

        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Tổng dư nợ"

              value={
                Number(
                  summary.outstanding_principal ||
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
          </Card>
        </Col>


        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Đang chờ duyệt"

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
            />
          </Card>
        </Col>


        <Col
          xs={24}
          md={12}
          xl={6}
        >
          <Card>
            <Statistic
              title="Đã duyệt"

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
              Chưa giải ngân
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
              title="Quá hạn"

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

              prefix={
                <WarningOutlined />
              }

              valueStyle={{
                color:
                  Number(
                    summary.overdue_outstanding ||
                      0
                  ) > 0
                    ? "#dc2626"
                    : undefined,
              }}
            />
          </Card>
        </Col>

      </Row>


      {/* LOAN TABLE */}

      <Card
        style={{
          marginTop: 18,
        }}
      >
        <Table
          rowKey="id"

          loading={loading}

          columns={columns}

          dataSource={loans}

          scroll={{
            x: 1100,
          }}

          locale={{
            emptyText: (
              <Empty description="Chưa có khoản vay" />
            ),
          }}
        />
      </Card>


      {/* ======================================================
          CREATE LOAN
      ====================================================== */}

      <Modal
        title="Đăng ký khoản vay"

        open={createOpen}

        footer={null}

        onCancel={() =>
          setCreateOpen(false)
        }
      >
        <Form
          form={createForm}

          layout="vertical"

          onFinish={
            createLoan
          }
        >

          <Form.Item
            name="disbursement_account_id"

            label="Tài khoản nhận tiền"

            rules={[
              {
                required: true,

                message:
                  "Chọn tài khoản nhận tiền",
              },
            ]}
          >
            <Select
              options={
                accountOptions
              }

              placeholder="Chọn tài khoản"
            />
          </Form.Item>


          <Form.Item
            name="loan_amount"

            label="Số tiền vay"

            rules={[
              {
                required: true,

                message:
                  "Nhập số tiền vay",
              },
            ]}
          >
            <InputNumber
              min={1000000}

              step={1000000}

              style={{
                width: "100%",
              }}

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
                  ? value.replace(
                      /,/g,
                      ""
                    )
                  : ""
              }
            />
          </Form.Item>


          <Form.Item
            name="loan_term"

            label="Kỳ hạn"

            rules={[
              {
                required: true,
              },
            ]}
          >
            <Select
              options={[
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
                  value: 60,
                  label: "60 tháng",
                },
              ]}
            />
          </Form.Item>


          <Form.Item
            name="interest_rate"

            label="Lãi suất"

            initialValue={10}
          >
            <InputNumber
              min={0}

              style={{
                width: "100%",
              }}

              addonAfter="%/năm"
            />
          </Form.Item>


          <Form.Item
            name="purpose"

            label="Mục đích vay"
          >
            <Input.TextArea
              rows={3}
            />
          </Form.Item>


          <Button
            type="primary"

            htmlType="submit"

            block

            loading={
              submitting
            }
          >
            Gửi yêu cầu vay
          </Button>
        </Form>
      </Modal>


      {/* ======================================================
          REPAY
      ====================================================== */}

      <Modal
        title="Thanh toán khoản vay"

        open={repayOpen}

        footer={null}

        onCancel={() =>
          setRepayOpen(false)
        }
      >
        {selectedLoan && (
          <>
            <Alert
              type={
                selectedLoan.loan_status ===
                "overdue"
                  ? "warning"
                  : "info"
              }

              showIcon

              message={
                `Dư nợ hiện tại: ${formatMoney(
                  selectedLoan.outstanding_principal
                )}`
              }

              style={{
                marginBottom: 20,
              }}
            />


            <Form
              form={repayForm}

              layout="vertical"

              onFinish={
                repayLoan
              }
            >

              <Form.Item
                name="account_id"

                label="Tài khoản thanh toán"

                rules={[
                  {
                    required: true,

                    message:
                      "Chọn tài khoản thanh toán",
                  },
                ]}
              >
                <Select
                  options={
                    accountOptions
                  }

                  placeholder="Chọn tài khoản"
                />
              </Form.Item>


              <Form.Item
                name="amount"

                label="Số tiền trả"

                rules={[
                  {
                    required: true,

                    message:
                      "Nhập số tiền trả",
                  },
                ]}
              >
                <InputNumber
                  min={1}

                  max={
                    Number(
                      selectedLoan.outstanding_principal
                    )
                  }

                  style={{
                    width: "100%",
                  }}

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
                      ? value.replace(
                          /,/g,
                          ""
                        )
                      : ""
                  }
                />
              </Form.Item>


              <Button
                type="primary"

                htmlType="submit"

                block

                loading={
                  submitting
                }
              >
                Xác nhận trả nợ
              </Button>
            </Form>
          </>
        )}
      </Modal>


      {/* DETAIL */}

      <Drawer
        title="Chi tiết khoản vay"

        width={620}

        open={detailOpen}

        onClose={() =>
          setDetailOpen(false)
        }
      >
        {selectedLoan && (
          <Descriptions
            bordered
            column={1}
          >

            <Descriptions.Item label="Mã khoản vay">
              {
                selectedLoan.loan_code
              }
            </Descriptions.Item>


            <Descriptions.Item label="Tài khoản nhận giải ngân">
              {
                selectedLoan.disbursement_account_number ||
                "-"
              }
            </Descriptions.Item>


            <Descriptions.Item label="Số tiền vay">
              {formatMoney(
                selectedLoan.loan_amount
              )}
            </Descriptions.Item>


            <Descriptions.Item label="Đã trả">
              <Text
                style={{
                  color: "#16a34a",
                }}
              >
                {formatMoney(
                  selectedLoan.paid_principal
                )}
              </Text>
            </Descriptions.Item>


            <Descriptions.Item label="Dư nợ">
              <Text strong>
                {formatMoney(
                  selectedLoan.outstanding_principal
                )}
              </Text>
            </Descriptions.Item>


            <Descriptions.Item label="Lãi suất">
              {
                selectedLoan.interest_rate
              }
              %/năm
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


            <Descriptions.Item label="Trạng thái">
              <Tag
                color={
                  statusInfo[
                    selectedLoan.loan_status
                  ]?.color
                }
              >
                {
                  statusInfo[
                    selectedLoan.loan_status
                  ]?.text
                }
              </Tag>
            </Descriptions.Item>

          </Descriptions>
        )}
      </Drawer>

    </div>
  );
}