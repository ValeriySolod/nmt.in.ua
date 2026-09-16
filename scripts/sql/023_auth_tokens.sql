-- One-time tokens for email verify and password reset.
-- Lazy-applied by ensureAuthTokenSchema().

CREATE TABLE IF NOT EXISTS auth_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  purpose ENUM('email_verify', 'password_reset') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_auth_tokens_hash (token_hash),
  KEY idx_auth_tokens_user_purpose (user_id, purpose, created_at),
  CONSTRAINT fk_auth_tokens_user
    FOREIGN KEY (user_id) REFERENCES app_users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
