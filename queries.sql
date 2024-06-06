-- allow each user to add multiple secrets

CREATE TABLE users(
id SERIAL PRIMARY KEY,
email VARCHAR(100) NOT NULL UNIQUE,
password VARCHAR(100)
);

CREATE TABLE secrets_text (
  id SERIAL PRIMARY KEY,
  secret TEXT,
  user_id INTEGER REFERENCES users(id)
);