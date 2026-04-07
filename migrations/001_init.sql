CREATE TABLE IF NOT EXISTS gifts (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (length(trim(name)) > 0),
  price TEXT NOT NULL CHECK (length(trim(price)) > 0),
  link TEXT NOT NULL CHECK (length(trim(link)) > 0),
  reserved_by TEXT,
  CONSTRAINT reserved_name_length CHECK (
    reserved_by IS NULL OR length(trim(reserved_by)) BETWEEN 2 AND 80
  )
);

CREATE INDEX IF NOT EXISTS idx_gifts_reserved_by ON gifts (reserved_by);
