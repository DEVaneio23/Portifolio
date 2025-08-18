CREATE TABLE categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  icon        text,
  color       text,
  is_archived boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX categories_name_ux ON categories (name);

CREATE TABLE payments (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debtor_name  text NOT NULL,
  amount       numeric(14,2) NOT NULL CHECK (amount >= 0),
  description  text,
  due_date     date NOT NULL,
  status       text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','received','overdue')),
  category_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  received_at  timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX payments_due_status_idx ON payments (due_date, status);

CREATE TABLE transactions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type         text NOT NULL CHECK (type IN ('income','expense')),
  amount       numeric(14,2) NOT NULL CHECK (amount >= 0),
  description  text,
  date         date NOT NULL,
  category_id  uuid REFERENCES categories(id) ON DELETE SET NULL,
  payment_id   uuid REFERENCES payments(id) ON DELETE SET NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX transactions_date_idx ON transactions (date);
CREATE INDEX transactions_category_idx ON transactions (category_id);

CREATE TABLE installments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type                text NOT NULL CHECK (type IN ('income','expense')),
  total_amount        numeric(14,2) NOT NULL CHECK (total_amount >= 0),
  installments_count  int NOT NULL CHECK (installments_count > 0),
  installment_amount  numeric(14,2) NOT NULL CHECK (installment_amount >= 0),
  first_due_date      date NOT NULL,
  status              text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  description         text,
  category_id         uuid REFERENCES categories(id) ON DELETE SET NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX installments_status_idx ON installments (status);

CREATE TABLE installment_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  installment_id  uuid NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
  number          int NOT NULL CHECK (number > 0),
  amount          numeric(14,2) NOT NULL CHECK (amount >= 0),
  due_date        date NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','overdue')),
  paid_at         timestamptz,
  paid_amount     numeric(14,2) CHECK (paid_amount IS NULL OR paid_amount >= 0),
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX installment_items_due_status_idx ON installment_items (due_date, status);
CREATE INDEX installment_items_installment_idx ON installment_items (installment_id);

CREATE TABLE settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key         text NOT NULL,
  value       jsonb NOT NULL DEFAULT '{}'::jsonb,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT settings_key_unique UNIQUE (key)
);

CREATE TABLE backups (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payload     jsonb NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type  text NOT NULL CHECK (report_type IN ('weekly','monthly')),
  year         int NOT NULL CHECK (year BETWEEN 2000 AND 2100),
  month        int CHECK (month BETWEEN 1 AND 12),
  week         int CHECK (week BETWEEN 1 AND 53),
  stats        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reports_period_ck CHECK (
    (report_type = 'monthly' AND month IS NOT NULL AND week IS NULL)
    OR
    (report_type = 'weekly'  AND week  IS NOT NULL AND month IS NULL)
  )
);

CREATE INDEX reports_period_idx ON reports (report_type, year, month, week);