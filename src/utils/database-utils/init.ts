export const initSql = `
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    account VARCHAR(20) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance NUMERIC(25, 2) DEFAULT 0.00,
    role VARCHAR(20) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    origin_user_id INTEGER NOT NULL,
    destination_user_id INTEGER NOT NULL,
    amount NUMERIC(25, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' NOT NULL,
    rejected_reason TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_origin_user
        FOREIGN KEY (origin_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT,
    
    CONSTRAINT fk_destination_user
        FOREIGN KEY (destination_user_id)
        REFERENCES users (id)
        ON DELETE RESTRICT
);

INSERT INTO users (email, account, password, balance, role)
VALUES ('admin@admin.com', 'admin.acc', '$2b$10$B9FbTHJvg8mjASJ8R7PEKuLPzG2X9DQ8Pbj7nx1Zy9DYHP0XuWF6S', 1000000.00, 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, account, password, balance, role)
VALUES
  ('juan.perez@example.com', 'juan.perez.acc', '$2b$10$4OVUmH7OPpCDDnviia34heUbYYDCE5pz771YaZzWenzwM7x6R3Qyu', 750000.00, 'user'),
  ('maria.lopez@example.com', 'maria.lopez.acc', '$2b$10$4OVUmH7OPpCDDnviia34heUbYYDCE5pz771YaZzWenzwM7x6R3Qyu', 250000.00, 'user'),
  ('carlos.gonzalez@example.com', 'carlos.gonzalez.acc', '$2b$10$4OVUmH7OPpCDDnviia34heUbYYDCE5pz771YaZzWenzwM7x6R3Qyu', 50000.00, 'user')
ON CONFLICT (email) DO NOTHING;
`;
