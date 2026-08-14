-- ============================================================
-- NOVA BANKING SYSTEM AWS
-- MySQL Database Schema
-- ============================================================

DROP DATABASE IF EXISTS `banking-system-aws`;

CREATE DATABASE `banking-system-aws`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `banking-system-aws`;


-- ============================================================
-- 1. USERS
-- Tài khoản đăng nhập hệ thống
-- ============================================================

CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,

    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,

    role ENUM(
        'admin',
        'user'
    ) NOT NULL DEFAULT 'user',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- 2. CUSTOMERS
-- Hồ sơ khách hàng
-- ============================================================

CREATE TABLE customers (
    id INT PRIMARY KEY AUTO_INCREMENT,

    user_id INT UNIQUE,

    customer_code VARCHAR(20) NOT NULL UNIQUE,

    full_name VARCHAR(100) NOT NULL,

    date_of_birth DATE NOT NULL,

    gender ENUM(
        'male',
        'female',
        'other'
    ),

    phone VARCHAR(20) UNIQUE,

    email VARCHAR(100),

    permanent_address VARCHAR(255),

    national_id VARCHAR(20) NOT NULL UNIQUE
        COMMENT 'Số căn cước công dân',

    occupation VARCHAR(100),

    monthly_income DECIMAL(19,2) NOT NULL DEFAULT 0,

    bad_debt BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_customers_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_customer_income
        CHECK (monthly_income >= 0)
) ENGINE=InnoDB;


-- ============================================================
-- 3. BRANCHES
-- Chi nhánh ngân hàng
-- ============================================================

CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,

    branch_code VARCHAR(20) NOT NULL UNIQUE,

    branch_name VARCHAR(100) NOT NULL,

    address VARCHAR(255),

    phone VARCHAR(20),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;


-- ============================================================
-- 4. ACCOUNTS
-- Tài khoản ngân hàng
-- ============================================================

CREATE TABLE accounts (
    id INT PRIMARY KEY AUTO_INCREMENT,

    customer_id INT NOT NULL,

    branch_id INT,

    account_number VARCHAR(20) NOT NULL UNIQUE,

    account_type ENUM(
        'checking',
        'saving'
    ) NOT NULL DEFAULT 'checking',

    currency CHAR(3) NOT NULL DEFAULT 'VND',

    balance DECIMAL(19,2) NOT NULL DEFAULT 0,

    available_balance DECIMAL(19,2) NOT NULL DEFAULT 0,

    transaction_limit DECIMAL(19,2) NOT NULL DEFAULT 0,

    interest_rate DECIMAL(7,4) NOT NULL DEFAULT 0,

    opened_at DATE NOT NULL,

    status ENUM(
        'active',
        'locked',
        'closed'
    ) NOT NULL DEFAULT 'active',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_accounts_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_accounts_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_account_balance
        CHECK (balance >= 0),

    CONSTRAINT chk_available_balance
        CHECK (available_balance >= 0),

    CONSTRAINT chk_transaction_limit
        CHECK (transaction_limit >= 0),

    CONSTRAINT chk_account_interest
        CHECK (interest_rate >= 0)
) ENGINE=InnoDB;


-- ============================================================
-- 5. TRANSACTIONS
-- Giao dịch tài khoản
-- ============================================================

CREATE TABLE transactions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    transaction_code VARCHAR(30) NOT NULL UNIQUE,

    from_account_id INT,

    to_account_id INT,

    amount DECIMAL(19,2) NOT NULL,

    currency CHAR(3) NOT NULL DEFAULT 'VND',

    transaction_type ENUM(
        'deposit',
        'withdraw',
        'transfer',
        'loan_disbursement',
        'loan_repayment'
    ) NOT NULL,

    status ENUM(
        'success',
        'failed',
        'pending'
    ) NOT NULL DEFAULT 'pending',

    description VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_transactions_from_account
        FOREIGN KEY (from_account_id)
        REFERENCES accounts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_transactions_to_account
        FOREIGN KEY (to_account_id)
        REFERENCES accounts(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT chk_transaction_amount
        CHECK (amount > 0)
) ENGINE=InnoDB;


-- ============================================================
-- 6. LOANS
-- Khoản vay
-- ============================================================

CREATE TABLE loans (
    id INT PRIMARY KEY AUTO_INCREMENT,

    loan_code VARCHAR(30) NOT NULL UNIQUE,

    customer_id INT NOT NULL,

    disbursement_account_id INT,

    loan_amount DECIMAL(19,2) NOT NULL,

    interest_rate DECIMAL(7,4) NOT NULL,

    loan_term INT NOT NULL
        COMMENT 'Thời hạn vay theo tháng',

    purpose VARCHAR(255),

    start_date DATE,

    end_date DATE,

    loan_status ENUM(
        'pending',
        'approved',
        'rejected',
        'active',
        'overdue',
        'closed'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_loans_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,

    CONSTRAINT fk_loans_disbursement_account
        FOREIGN KEY (disbursement_account_id)
        REFERENCES accounts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_loan_amount
        CHECK (loan_amount > 0),

    CONSTRAINT chk_loan_interest
        CHECK (interest_rate >= 0),

    CONSTRAINT chk_loan_term
        CHECK (loan_term > 0)
) ENGINE=InnoDB;


-- ============================================================
-- 7. LOAN PAYMENTS
-- Lịch sử trả nợ khoản vay
-- ============================================================

CREATE TABLE loan_payments (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    loan_id INT NOT NULL,

    payment_account_id INT,

    due_date DATE NOT NULL,

    payment_date DATE,

    amount_due DECIMAL(19,2) NOT NULL,

    amount_paid DECIMAL(19,2) NOT NULL DEFAULT 0
        COMMENT 'Trong phiên bản hiện tại dùng như phần gốc đã trả',

    days_late INT NOT NULL DEFAULT 0,

    payment_status ENUM(
        'pending',
        'paid',
        'late',
        'overdue'
    ) NOT NULL DEFAULT 'pending',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_loan_payments_loan
        FOREIGN KEY (loan_id)
        REFERENCES loans(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT fk_loan_payments_account
        FOREIGN KEY (payment_account_id)
        REFERENCES accounts(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE,

    CONSTRAINT chk_amount_due
        CHECK (amount_due > 0),

    CONSTRAINT chk_amount_paid
        CHECK (amount_paid >= 0),

    CONSTRAINT chk_days_late
        CHECK (days_late >= 0)
) ENGINE=InnoDB;


-- ============================================================
-- 8. CREDIT PROFILES
-- Hồ sơ tín dụng
-- ============================================================

CREATE TABLE credit_profiles (
    id INT PRIMARY KEY AUTO_INCREMENT,

    customer_id INT NOT NULL UNIQUE,

    credit_score INT,

    debt_ratio DECIMAL(7,4),

    total_debt DECIMAL(19,2) NOT NULL DEFAULT 0,

    credit_history_length INT
        COMMENT 'Số tháng lịch sử tín dụng',

    previous_default BOOLEAN NOT NULL DEFAULT FALSE,

    late_payment_count INT NOT NULL DEFAULT 0,

    total_loans INT NOT NULL DEFAULT 0,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_credit_profiles_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_credit_score
        CHECK (
            credit_score IS NULL
            OR credit_score BETWEEN 0 AND 1000
        ),

    CONSTRAINT chk_debt_ratio
        CHECK (
            debt_ratio IS NULL
            OR debt_ratio >= 0
        ),

    CONSTRAINT chk_total_debt
        CHECK (total_debt >= 0),

    CONSTRAINT chk_credit_history
        CHECK (
            credit_history_length IS NULL
            OR credit_history_length >= 0
        ),

    CONSTRAINT chk_late_payment
        CHECK (late_payment_count >= 0),

    CONSTRAINT chk_total_loans
        CHECK (total_loans >= 0)
) ENGINE=InnoDB;


-- ============================================================
-- 9. PREDICTIONS
-- Kết quả Machine Learning
-- ============================================================

CREATE TABLE predictions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    customer_id INT NOT NULL,

    model_name VARCHAR(50) NOT NULL,

    model_version VARCHAR(30),

    risk_probability DECIMAL(6,5),

    risk_level ENUM(
        'LOW',
        'MEDIUM',
        'HIGH'
    ),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_predictions_customer
        FOREIGN KEY (customer_id)
        REFERENCES customers(id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,

    CONSTRAINT chk_risk_probability
        CHECK (
            risk_probability IS NULL
            OR risk_probability BETWEEN 0 AND 1
        )
) ENGINE=InnoDB;


-- ============================================================
-- 10. AUDIT LOGS
-- Nhật ký hoạt động
-- ============================================================

CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,

    user_id INT,

    action VARCHAR(100) NOT NULL,

    resource VARCHAR(100),

    resource_id VARCHAR(50),

    ip_address VARCHAR(45),

    description TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_audit_logs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB;


-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_users_role
    ON users(role);


CREATE INDEX idx_customers_phone
    ON customers(phone);

CREATE INDEX idx_customers_national_id
    ON customers(national_id);

CREATE INDEX idx_customers_bad_debt
    ON customers(bad_debt);


CREATE INDEX idx_accounts_customer
    ON accounts(customer_id);

CREATE INDEX idx_accounts_branch
    ON accounts(branch_id);

CREATE INDEX idx_accounts_status
    ON accounts(status);

CREATE INDEX idx_accounts_currency
    ON accounts(currency);


CREATE INDEX idx_transactions_from_account
    ON transactions(from_account_id);

CREATE INDEX idx_transactions_to_account
    ON transactions(to_account_id);

CREATE INDEX idx_transactions_created_at
    ON transactions(created_at);

CREATE INDEX idx_transactions_type
    ON transactions(transaction_type);

CREATE INDEX idx_transactions_status
    ON transactions(status);


CREATE INDEX idx_loans_customer
    ON loans(customer_id);

CREATE INDEX idx_loans_disbursement_account
    ON loans(disbursement_account_id);

CREATE INDEX idx_loans_status
    ON loans(loan_status);

CREATE INDEX idx_loans_created_at
    ON loans(created_at);


CREATE INDEX idx_loan_payments_loan
    ON loan_payments(loan_id);

CREATE INDEX idx_loan_payments_account
    ON loan_payments(payment_account_id);

CREATE INDEX idx_loan_payments_status
    ON loan_payments(payment_status);

CREATE INDEX idx_loan_payments_created_at
    ON loan_payments(created_at);


CREATE INDEX idx_credit_profiles_score
    ON credit_profiles(credit_score);


CREATE INDEX idx_predictions_customer
    ON predictions(customer_id);

CREATE INDEX idx_predictions_risk_level
    ON predictions(risk_level);

CREATE INDEX idx_predictions_created_at
    ON predictions(created_at);


CREATE INDEX idx_audit_logs_user
    ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_action
    ON audit_logs(action);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs(created_at);


-- ============================================================
-- DEFAULT BRANCH
-- ============================================================

INSERT INTO branches (
    branch_code,
    branch_name,
    address,
    phone
)
VALUES (
    'HN001',
    'NOVA Bank - Chi nhánh Hà Nội',
    'Hà Nội',
    '0240000000'
);


-- ============================================================
-- CHECK DATABASE
-- ============================================================

SHOW TABLES;

DESCRIBE users;
DESCRIBE customers;
DESCRIBE branches;
DESCRIBE accounts;
DESCRIBE transactions;
DESCRIBE loans;
DESCRIBE loan_payments;
DESCRIBE credit_profiles;
DESCRIBE predictions;
DESCRIBE audit_logs;