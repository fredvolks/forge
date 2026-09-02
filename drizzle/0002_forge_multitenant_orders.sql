PRAGMA foreign_keys = ON;

ALTER TABLE companies ADD COLUMN logo_r2_key TEXT;
ALTER TABLE companies ADD COLUMN address TEXT;
ALTER TABLE companies ADD COLUMN phone TEXT;
ALTER TABLE companies ADD COLUMN email TEXT;

CREATE TABLE IF NOT EXISTS catalog_categories (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, name TEXT NOT NULL,
  parent_id TEXT, active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(parent_id) REFERENCES catalog_categories(id)
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_category_company_name ON catalog_categories(company_id,name);

CREATE TABLE IF NOT EXISTS catalog_products (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, category_id TEXT NOT NULL,
  name TEXT NOT NULL, source_mode TEXT NOT NULL CHECK(source_mode IN ('inventory','supplier','both')),
  default_supplier_id TEXT, active INTEGER NOT NULL DEFAULT 1, snapshot_json TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(category_id) REFERENCES catalog_categories(id),
  FOREIGN KEY(default_supplier_id) REFERENCES suppliers(id)
);
CREATE INDEX IF NOT EXISTS idx_products_company_active ON catalog_products(company_id,active);

CREATE TABLE IF NOT EXISTS catalog_product_fields (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, product_id TEXT NOT NULL,
  field_key TEXT NOT NULL, label TEXT NOT NULL, field_type TEXT NOT NULL,
  options_json TEXT, required INTEGER NOT NULL DEFAULT 0, employee_editable INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0, active INTEGER NOT NULL DEFAULT 1,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(product_id) REFERENCES catalog_products(id)
);

ALTER TABLE order_items ADD COLUMN company_id TEXT;
ALTER TABLE order_items ADD COLUMN product_id TEXT;
ALTER TABLE order_items ADD COLUMN source_mode TEXT;
ALTER TABLE order_items ADD COLUMN field_values_json TEXT;
ALTER TABLE order_items ADD COLUMN product_snapshot_json TEXT;
ALTER TABLE order_items ADD COLUMN supplier_snapshot_json TEXT;

CREATE TABLE IF NOT EXISTS order_history (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, order_id TEXT NOT NULL,
  actor_id TEXT NOT NULL, from_status TEXT, to_status TEXT NOT NULL,
  detail_json TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_order_history_tenant_order ON order_history(company_id,order_id,created_at);

CREATE TABLE IF NOT EXISTS inventory_items (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, product_id TEXT NOT NULL,
  quantity_on_hand REAL NOT NULL DEFAULT 0, quantity_reserved REAL NOT NULL DEFAULT 0,
  minimum_quantity REAL NOT NULL DEFAULT 0, unit TEXT NOT NULL, updated_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(product_id) REFERENCES catalog_products(id),
  UNIQUE(company_id,product_id,unit)
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, inventory_item_id TEXT NOT NULL,
  order_id TEXT, order_item_id TEXT, movement_type TEXT NOT NULL,
  quantity REAL NOT NULL, unit TEXT NOT NULL, actor_id TEXT NOT NULL, created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(inventory_item_id) REFERENCES inventory_items(id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_tenant ON inventory_movements(company_id,created_at);

CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY, company_id TEXT NOT NULL, order_id TEXT NOT NULL,
  po_number TEXT NOT NULL, supplier_id TEXT, status TEXT NOT NULL,
  sent_at TEXT, sent_by TEXT, email_to TEXT, message_snapshot TEXT, created_at TEXT NOT NULL,
  FOREIGN KEY(company_id) REFERENCES companies(id), FOREIGN KEY(order_id) REFERENCES orders(id),
  FOREIGN KEY(supplier_id) REFERENCES suppliers(id), UNIQUE(company_id,po_number)
);

CREATE INDEX IF NOT EXISTS idx_orders_company_created ON orders(company_id,created_at);
CREATE INDEX IF NOT EXISTS idx_orders_company_status ON orders(company_id,status);
CREATE INDEX IF NOT EXISTS idx_suppliers_company_name ON suppliers(company_id,name);
CREATE INDEX IF NOT EXISTS idx_attachments_company_owner ON attachments(company_id,owner_type,owner_id);
PRAGMA optimize;
