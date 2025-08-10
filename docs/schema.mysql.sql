-- 火影忍者组织管理系统 - MySQL 8.0 Schema

CREATE DATABASE IF NOT EXISTS ninja_org
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;
USE ninja_org;

-- ========== users ==========
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  last_login_at DATETIME(3) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========== members ==========
CREATE TABLE IF NOT EXISTS members (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  nickname VARCHAR(100) NOT NULL,
  qq VARCHAR(32) NULL UNIQUE,
  status ENUM('normal','left') NOT NULL DEFAULT 'normal',
  join_at DATETIME(3) NULL,
  leave_at DATETIME(3) NULL,
  role ENUM('trainee','senior','member','leader') NOT NULL DEFAULT 'member',
  remark VARCHAR(500) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_members_nickname ON members (nickname);
CREATE INDEX idx_members_status ON members (status);
CREATE INDEX idx_members_role ON members (role);

-- ========== activity_types ==========
CREATE TABLE IF NOT EXISTS activity_types (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  schedule_weekday TINYINT NULL,
  schedule_time TIME NULL,
  duration_minutes INT NOT NULL DEFAULT 120
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========== activity_sessions ==========
CREATE TABLE IF NOT EXISTS activity_sessions (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  type_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(150) NOT NULL,
  start_at DATETIME(3) NOT NULL,
  end_at DATETIME(3) NOT NULL,
  notes VARCHAR(1000) NULL,
  CONSTRAINT fk_sessions_type
    FOREIGN KEY (type_id) REFERENCES activity_types(id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_sessions_type_start ON activity_sessions (type_id, start_at);

-- ========== participations ==========
CREATE TABLE IF NOT EXISTS participations (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  session_id BIGINT UNSIGNED NOT NULL,
  member_id BIGINT UNSIGNED NOT NULL,
  status ENUM('participated','leave','unknown','unset') NOT NULL,
  score DECIMAL(10,2) UNSIGNED NOT NULL DEFAULT 0,
  note VARCHAR(1000) NULL,
  set_by BIGINT UNSIGNED NULL,
  set_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  CONSTRAINT fk_participations_session
    FOREIGN KEY (session_id) REFERENCES activity_sessions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_participations_member
    FOREIGN KEY (member_id) REFERENCES members(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_participations_user
    FOREIGN KEY (set_by) REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uk_participations_session_member (session_id, member_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE INDEX idx_participations_session ON participations (session_id);
CREATE INDEX idx_participations_member ON participations (member_id);
CREATE INDEX idx_participations_status ON participations (status);

-- ========== audit_logs（可选） ==========
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  entity_type VARCHAR(50) NOT NULL,
  entity_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(20) NOT NULL,
  diff JSON NULL,
  operator_id BIGINT UNSIGNED NULL,
  operated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_audit_entity (entity_type, entity_id),
  CONSTRAINT fk_audit_user
    FOREIGN KEY (operator_id) REFERENCES users(id)
    ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- ========== 初始化示例 ==========
INSERT INTO activity_types (code, name, enabled, schedule_weekday, schedule_time, duration_minutes)
VALUES
  ('fortress', '要塞', 1, 6, '20:00:00', 120),
  ('battlefield', '天地战场', 1, 3, '20:00:00', 120)
ON DUPLICATE KEY UPDATE name=VALUES(name);



INSERT INTO users (username, password_hash)
VALUES ('admin', '$2a$10$0dqzs49yDByNt6vbX2GQY.sOvHiq5Va0VJMFyA8xWiws2FVVyoh0O')
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);

