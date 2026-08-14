import {
  BankOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
} from "@ant-design/icons";

import {
  Button,
  Card,
  Col,
  Row,
  Space,
  Typography,
} from "antd";

import { useNavigate } from "react-router-dom";


const {
  Title,
  Text,
  Paragraph,
} = Typography;


// ============================================================
// LANDING PAGE
// ============================================================

export default function Landing() {
  const navigate = useNavigate();


  return (
    <div
      style={{
        width: "100%",
        minHeight: "100vh",
        background: "#ffffff",
      }}
    >

      {/* ======================================================
          HEADER
      ====================================================== */}

      <header
        style={{
          width: "100%",
          height: 72,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          padding: "0 48px",

          background: "#ffffff",

          borderBottom:
            "1px solid #edf1f5",

          position: "relative",

          zIndex: 20,
        }}
      >

        {/* ====================================================
            LOGO
        ==================================================== */}

        <div
          style={{
            display: "flex",
            alignItems: "center",

            gap: 12,

            cursor: "pointer",
          }}

          onClick={() => navigate("/")}
        >

          <div
            style={{
              width: 42,
              height: 42,

              display: "flex",
              alignItems: "center",
              justifyContent: "center",

              borderRadius: 10,

              background: "#0b568e",

              color: "#ffffff",

              fontSize: 22,
            }}
          >
            <BankOutlined />
          </div>


          <div>

            <div
              style={{
                fontSize: 23,

                fontWeight: 800,

                color: "#085780",

                lineHeight: 1,
              }}
            >
              NOVA BANK
            </div>


            <div
              style={{
                marginTop: 4,

                fontSize: 10,

                color: "#8b96a4",

                letterSpacing: 1,
              }}
            >
              DIGITAL BANKING
            </div>

          </div>

        </div>


        {/* ====================================================
            MENU
        ==================================================== */}

        <div
          className="landing-desktop-menu"

          style={{
            display: "flex",
            alignItems: "center",

            gap: 30,
          }}
        >

          <a
            href="#about"

            style={{
              color: "#263445",
              fontWeight: 500,
            }}
          >
            Về NOVA
          </a>


          <a
            href="#services"

            style={{
              color: "#263445",
              fontWeight: 500,
            }}
          >
            Sản phẩm & dịch vụ
          </a>


          <a
            href="#personal"

            style={{
              color: "#263445",
              fontWeight: 500,
            }}
          >
            Cá nhân
          </a>


          <a
            href="#business"

            style={{
              color: "#263445",
              fontWeight: 500,
            }}
          >
            Doanh nghiệp
          </a>


          <a
            href="#support"

            style={{
              color: "#263445",
              fontWeight: 500,
            }}
          >
            Hỗ trợ
          </a>


          <Button
            type="text"

            icon={<UserOutlined />}

            onClick={() =>
              navigate("/login")
            }

            style={{
              fontWeight: 600,
            }}
          >
            Đăng nhập
          </Button>

        </div>

      </header>



      {/* ======================================================
          HERO
      ====================================================== */}

      <section
        style={{
          width: "100%",

          height:
            "calc(100vh - 148px)",

          minHeight: 600,

          position: "relative",

          overflow: "hidden",

          backgroundImage:
            "url('/main.jpg')",

          backgroundSize: "cover",

          backgroundPosition:
            "center center",

          backgroundRepeat:
            "no-repeat",
        }}
      >

        {/* ====================================================
            OVERLAY NHẸ ĐỂ CHỮ DỄ ĐỌC
        ==================================================== */}

        <div
          style={{
            position: "absolute",

            inset: 0,

            background:
              "linear-gradient(90deg, rgba(3,30,54,.30) 0%, rgba(3,30,54,.08) 42%, rgba(3,30,54,0) 70%)",
          }}
        />


        {/* ====================================================
            HERO CONTENT
        ==================================================== */}

        <div
          style={{
            position: "absolute",

            left: "6.5%",

            top: "44%",

            transform:
              "translateY(-50%)",

            zIndex: 2,

            maxWidth: 640,
          }}
        >

          <Text
            style={{
              display: "block",

              marginBottom: 12,

              color:
                "rgba(255,255,255,.88)",

              fontSize: 15,

              fontWeight: 600,

              letterSpacing: 1.2,
            }}
          >
            NOVA DIGITAL BANKING
          </Text>


          <Title
            style={{
              margin: 0,

              marginBottom: 18,

              color: "#ffffff",

              fontSize: 48,

              lineHeight: 1.2,

              textShadow:
                "0 3px 12px rgba(0,0,0,.18)",
            }}
          >
            Ngân hàng số
            <br />
            dành cho bạn
          </Title>


          <Paragraph
            style={{
              maxWidth: 560,

              marginBottom: 28,

              color:
                "rgba(255,255,255,.88)",

              fontSize: 17,

              lineHeight: 1.7,

              textShadow:
                "0 2px 6px rgba(0,0,0,.15)",
            }}
          >
            Quản lý tài khoản, chuyển tiền,
            theo dõi giao dịch và khoản vay
            trên nền tảng ngân hàng số
            hiện đại.
          </Paragraph>


          <Space size={14}>

            <Button
              type="primary"

              size="large"

              onClick={() =>
                navigate("/login")
              }

              style={{
                height: 52,

                padding:
                  "0 32px",

                borderRadius: 6,

                background: "#08756f",

                borderColor: "#08756f",

                fontWeight: 600,

                boxShadow:
                  "0 6px 20px rgba(0,0,0,.16)",
              }}
            >
              Truy cập
            </Button>


            <Button
              size="large"

              ghost

              onClick={() =>
                navigate("/register")
              }

              style={{
                height: 52,

                padding:
                  "0 28px",

                borderRadius: 6,

                fontWeight: 600,
              }}
            >
              Mở tài khoản
            </Button>

          </Space>

        </div>

      </section>



      {/* ======================================================
          SERVICE NAVIGATION
      ====================================================== */}

      <section
        id="services"

        style={{
          width: "100%",

          background: "#ffffff",

          borderBottom:
            "1px solid #e9edf2",
        }}
      >

        <Row>

          {[
            {
              title:
                "Trang chủ",

              active: true,
            },

            {
              title:
                "Định chế tài chính",
            },

            {
              title:
                "Doanh nghiệp",
            },

            {
              title:
                "Cá nhân",
            },

            {
              title:
                "Cá nhân cao cấp",
            },

          ].map(
            (
              item,
              index
            ) => (

              <Col
                xs={24}
                sm={12}
                md={8}
                lg={index === 0 ? 4 : 5}

                key={item.title}
              >

                <div
                  style={{
                    minHeight: 72,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    padding:
                      "0 14px",

                    borderRight:
                      "1px solid #edf0f4",

                    background:
                      item.active
                        ? "#f7f9fb"
                        : "#ffffff",

                    color:
                      item.active
                        ? "#08736f"
                        : "#111827",

                    fontSize: 17,

                    fontWeight:
                      item.active
                        ? 700
                        : 500,

                    textAlign: "center",

                    cursor: "pointer",

                    transition:
                      "all .2s ease",
                  }}
                >
                  {item.title}
                </div>

              </Col>

            )
          )}

        </Row>

      </section>



      {/* ======================================================
          ABOUT
      ====================================================== */}

      <section
        id="about"

        style={{
          width: "100%",

          padding:
            "78px 60px",

          background: "#ffffff",
        }}
      >

        <div
          style={{
            width: "100%",

            maxWidth: 1320,

            margin: "0 auto",
          }}
        >

          <div
            style={{
              textAlign: "center",

              marginBottom: 46,
            }}
          >

            <Text
              style={{
                color: "#0b689a",

                fontWeight: 700,

                letterSpacing: 1,
              }}
            >
              NOVA BANK
            </Text>


            <Title
              level={2}

              style={{
                marginTop: 8,

                marginBottom: 10,
              }}
            >
              Ngân hàng số hiện đại
            </Title>


            <Text
              type="secondary"

              style={{
                fontSize: 16,
              }}
            >
              Trải nghiệm các dịch vụ tài chính
              trong một hệ thống duy nhất.
            </Text>

          </div>


          <Row
            gutter={[
              22,
              22,
            ]}
          >

            {/* ACCOUNT */}

            <Col
              xs={24}
              md={12}
              xl={6}
            >

              <Card
                hoverable

                bordered={false}

                style={{
                  height: "100%",

                  borderRadius: 18,

                  boxShadow:
                    "0 7px 26px rgba(21,51,80,.07)",
                }}
              >

                <div
                  style={{
                    width: 54,
                    height: 54,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    marginBottom: 20,

                    borderRadius: 14,

                    background: "#eaf5ff",

                    color: "#1677ff",

                    fontSize: 26,
                  }}
                >
                  <BankOutlined />
                </div>


                <Title level={4}>
                  Quản lý tài khoản
                </Title>


                <Text type="secondary">
                  Quản lý tài khoản thanh toán,
                  tiết kiệm, số dư và thông tin
                  tài chính.
                </Text>

              </Card>

            </Col>


            {/* TRANSACTION */}

            <Col
              xs={24}
              md={12}
              xl={6}
            >

              <Card
                hoverable

                bordered={false}

                style={{
                  height: "100%",

                  borderRadius: 18,

                  boxShadow:
                    "0 7px 26px rgba(21,51,80,.07)",
                }}
              >

                <div
                  style={{
                    width: 54,
                    height: 54,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    marginBottom: 20,

                    borderRadius: 14,

                    background: "#eafaf1",

                    color: "#14945e",

                    fontSize: 26,
                  }}
                >
                  <SafetyCertificateOutlined />
                </div>


                <Title level={4}>
                  Giao dịch an toàn
                </Title>


                <Text type="secondary">
                  Thực hiện chuyển tiền, nạp tiền,
                  rút tiền và tra cứu lịch sử
                  giao dịch.
                </Text>

              </Card>

            </Col>


            {/* CUSTOMER */}

            <Col
              xs={24}
              md={12}
              xl={6}
            >

              <Card
                hoverable

                bordered={false}

                style={{
                  height: "100%",

                  borderRadius: 18,

                  boxShadow:
                    "0 7px 26px rgba(21,51,80,.07)",
                }}
              >

                <div
                  style={{
                    width: 54,
                    height: 54,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    marginBottom: 20,

                    borderRadius: 14,

                    background: "#f3edff",

                    color: "#7c3aed",

                    fontSize: 26,
                  }}
                >
                  <UserOutlined />
                </div>


                <Title level={4}>
                  Khách hàng cá nhân
                </Title>


                <Text type="secondary">
                  Quản lý hồ sơ KYC, thông tin
                  cá nhân và hồ sơ tín dụng.
                </Text>

              </Card>

            </Col>


            {/* LOAN */}

            <Col
              xs={24}
              md={12}
              xl={6}
            >

              <Card
                hoverable

                bordered={false}

                style={{
                  height: "100%",

                  borderRadius: 18,

                  boxShadow:
                    "0 7px 26px rgba(21,51,80,.07)",
                }}
              >

                <div
                  style={{
                    width: 54,
                    height: 54,

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",

                    marginBottom: 20,

                    borderRadius: 14,

                    background: "#fff4e7",

                    color: "#ea8a14",

                    fontSize: 26,
                  }}
                >
                  <EnvironmentOutlined />
                </div>


                <Title level={4}>
                  Khoản vay
                </Title>


                <Text type="secondary">
                  Đăng ký và theo dõi tình trạng
                  khoản vay trực tiếp trên hệ thống.
                </Text>

              </Card>

            </Col>

          </Row>

        </div>

      </section>



      {/* ======================================================
          CTA
      ====================================================== */}

      <section
        id="personal"

        style={{
          padding:
            "68px 40px",

          background: "#f5f8fb",
        }}
      >

        <div
          style={{
            maxWidth: 1180,

            margin: "0 auto",

            padding:
              "46px 50px",

            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",

            gap: 30,

            flexWrap: "wrap",

            borderRadius: 22,

            background: "#083a62",

            color: "#ffffff",
          }}
        >

          <div>

            <Title
              level={2}

              style={{
                marginTop: 0,

                marginBottom: 8,

                color: "#ffffff",
              }}
            >
              Bắt đầu cùng NOVA BANK
            </Title>


            <Text
              style={{
                color:
                  "rgba(255,255,255,.72)",

                fontSize: 16,
              }}
            >
              Đăng ký tài khoản và trải nghiệm
              hệ thống ngân hàng số ngay hôm nay.
            </Text>

          </div>


          <Space>

            <Button
              size="large"

              ghost

              onClick={() =>
                navigate("/login")
              }
            >
              Đăng nhập
            </Button>


            <Button
              size="large"

              type="primary"

              onClick={() =>
                navigate("/register")
              }
            >
              Mở tài khoản
            </Button>

          </Space>

        </div>

      </section>



      {/* ======================================================
          FLOATING CONTACT
      ====================================================== */}

      <div
        style={{
          position: "fixed",

          right: 20,

          bottom: 100,

          zIndex: 100,

          display: "flex",

          flexDirection: "column",

          gap: 10,
        }}
      >

        <Button
          shape="circle"

          size="large"

          icon={<PhoneOutlined />}

          style={{
            color: "#08736f",
          }}
        />


        <Button
          shape="circle"

          size="large"

          icon={
            <EnvironmentOutlined />
          }

          style={{
            color: "#08736f",
          }}
        />

      </div>



      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer
        id="support"

        style={{
          width: "100%",

          padding:
            "28px 50px",

          background: "#06182e",

          color: "#ffffff",
        }}
      >

        <div
          style={{
            width: "100%",

            maxWidth: 1320,

            margin: "0 auto",

            display: "flex",

            justifyContent:
              "space-between",

            alignItems: "center",

            flexWrap: "wrap",

            gap: 20,
          }}
        >

          <div>

            <div
              style={{
                fontWeight: 700,

                marginBottom: 3,
              }}
            >
              NOVA BANK
            </div>


            <Text
              style={{
                color:
                  "rgba(255,255,255,.55)",
              }}
            >
              Banking System AWS
            </Text>

          </div>


          <Space size={24}>

            <span
              style={{
                color:
                  "rgba(255,255,255,.7)",
              }}
            >
              Điều khoản
            </span>


            <span
              style={{
                color:
                  "rgba(255,255,255,.7)",
              }}
            >
              Bảo mật
            </span>


            <span
              style={{
                color:
                  "rgba(255,255,255,.7)",
              }}
            >
              Liên hệ
            </span>

          </Space>


          <Text
            style={{
              color:
                "rgba(255,255,255,.5)",
            }}
          >
            © 2026 NOVA BANK
          </Text>

        </div>

      </footer>

    </div>
  );
}