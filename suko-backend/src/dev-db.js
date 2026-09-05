// Local development in-memory / JSON-file database adapter
// Activated automatically when DATABASE_URL is not provided.
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "dev-store.json");

// Default Admin user (same as schema.sql)
// Email: admin@indiancorporatewear.com
// Password: Suko@vnpZUO6tE4
const DEFAULT_ADMIN_PASSWORD = "Suko@vnpZUO6tE4";
const DEFAULT_ADMIN_HASH = bcrypt.hashSync(DEFAULT_ADMIN_PASSWORD, 10);

function getInitialData() {
  return {
    users: [
      {
        id: 1,
        name: "SUKO Admin",
        email: "admin@indiancorporatewear.com",
        phone: "",
        password_hash: DEFAULT_ADMIN_HASH,
        role: "admin",
        created_at: new Date().toISOString(),
      },
    ],
    orders: [],
    order_items: [],
  };
}

let store = null;

function loadStore() {
  if (store) return store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      store = JSON.parse(raw);
      // Ensure admin user exists with valid hash
      const hasAdmin = store.users.find((u) => u.email.toLowerCase() === "admin@indiancorporatewear.com");
      if (!hasAdmin) {
        store.users.unshift(getInitialData().users[0]);
        saveStore();
      } else if (!bcrypt.compareSync(DEFAULT_ADMIN_PASSWORD, hasAdmin.password_hash)) {
        hasAdmin.password_hash = DEFAULT_ADMIN_HASH;
        saveStore();
      }
    } else {
      store = getInitialData();
      saveStore();
    }
  } catch (err) {
    console.warn("[DevDB] Error loading file, using memory store:", err.message);
    store = getInitialData();
  }
  return store;
}

function saveStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.warn("[DevDB] Error saving store:", err.message);
  }
}

async function executeQuery(text, params = []) {
  const s = loadStore();
  const sql = (text || "").trim();
  const lower = sql.toLowerCase();

  // 1. Health check: SELECT 1
  if (lower === "select 1" || lower.startsWith("select 1")) {
    return { rows: [{ "?column?": 1 }], rowCount: 1 };
  }

  // 2. Transaction control
  if (lower === "begin" || lower === "commit" || lower === "rollback") {
    return { rows: [], rowCount: 0 };
  }

  // 3. User check: SELECT ... FROM users WHERE email ...
  if (lower.includes("from users") && lower.includes("where email")) {
    const email = (params[0] || "").trim().toLowerCase();
    const user = s.users.find((u) => u.email.toLowerCase() === email);
    if (!user) return { rows: [], rowCount: 0 };
    if (lower.includes("select id from")) {
      return { rows: [{ id: user.id }], rowCount: 1 };
    }
    if (lower.includes("select id, name from")) {
      return { rows: [{ id: user.id, name: user.name }], rowCount: 1 };
    }
    // SELECT * FROM users WHERE email ...
    return { rows: [{ ...user }], rowCount: 1 };
  }

  // 4. User profile: SELECT id, name, email, phone, role FROM users WHERE id = $1
  if (lower.includes("from users") && lower.includes("where id = $1")) {
    const id = Number(params[0]);
    const user = s.users.find((u) => u.id === id);
    if (user) {
      return {
        rows: [{ id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role }],
        rowCount: 1,
      };
    }
    return { rows: [], rowCount: 0 };
  }

  // 5. User register: INSERT INTO users ... RETURNING ...
  if (lower.includes("insert into users")) {
    const name = params[0] || "";
    const phone = params[1] || "";
    const email = (params[2] || "").trim().toLowerCase();
    const passwordHash = params[3] || "";
    const role = "customer";

    const nextId = s.users.reduce((max, u) => Math.max(max, u.id || 0), 0) + 1;
    const newUser = {
      id: nextId,
      name,
      phone,
      email,
      password_hash: passwordHash,
      role,
      created_at: new Date().toISOString(),
    };
    s.users.push(newUser);
    saveStore();
    return {
      rows: [{ id: newUser.id, name: newUser.name, phone: newUser.phone, email: newUser.email, role: newUser.role }],
      rowCount: 1,
    };
  }

  // 6. Orders: INSERT INTO orders ... RETURNING *
  if (lower.includes("insert into orders")) {
    const nextId = s.orders.reduce((max, o) => Math.max(max, o.id || 0), 0) + 1;
    const newOrder = {
      id: nextId,
      user_id: params[0] || null,
      status: "payment_pending",
      total: Number(params[1]) || 0,
      payment_method: "upi_qr",
      name: params[2] || "",
      phone: params[3] || "",
      email: params[4] || "",
      line1: params[5] || "",
      city: params[6] || "",
      state: params[7] || "",
      pincode: params[8] || "",
      cancel_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    s.orders.unshift(newOrder);
    saveStore();
    return { rows: [newOrder], rowCount: 1 };
  }

  // 7. Order items: INSERT INTO order_items
  if (lower.includes("insert into order_items")) {
    const nextId = s.order_items.reduce((max, it) => Math.max(max, it.id || 0), 0) + 1;
    const newItem = {
      id: nextId,
      order_id: Number(params[0]),
      product_id: params[1] || "",
      product_name: params[2] || "",
      product_image_url: params[3] || null,
      category_name: params[4] || null,
      size: params[5] || "",
      quantity: Number(params[6]) || 1,
      price_at_purchase: Number(params[7]) || 0,
    };
    s.order_items.push(newItem);
    saveStore();
    return { rows: [newItem], rowCount: 1 };
  }

  // 8. Stats queries (checked before generic SELECT FROM orders)
  if (lower.includes("count(*) from users")) {
    const count = s.users.filter((u) => u.role === "customer").length;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (lower.includes("count(distinct product_id) from order_items")) {
    const count = new Set(s.order_items.map((it) => it.product_id)).size;
    return { rows: [{ count: count.toString() }], rowCount: 1 };
  }
  if (lower.includes("count(*) from orders")) {
    return { rows: [{ count: s.orders.length.toString() }], rowCount: 1 };
  }
  if (lower.includes("sum(total)")) {
    const revenue = s.orders
      .filter((o) => ["paid", "processing", "completed"].includes(o.status))
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    return { rows: [{ revenue }], rowCount: 1 };
  }

  // 9. Orders by ID: SELECT * FROM orders WHERE id = $1
  if (lower.includes("from orders") && lower.includes("where id = $1")) {
    const id = Number(params[0]);
    const order = s.orders.find((o) => o.id === id);
    return { rows: order ? [{ ...order }] : [], rowCount: order ? 1 : 0 };
  }

  // 10. Order items by order_id: SELECT * FROM order_items WHERE order_id = $1
  if (lower.includes("from order_items") && lower.includes("where order_id = $1")) {
    const orderId = Number(params[0]);
    const items = s.order_items.filter((it) => it.order_id === orderId);
    return { rows: [...items], rowCount: items.length };
  }

  // 11. Orders list: SELECT * FROM orders
  if (lower.includes("from orders")) {
    let list = [...s.orders];
    if (lower.includes("where user_id = $1")) {
      const uid = Number(params[0]);
      list = list.filter((o) => o.user_id === uid);
    }
    list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const limitMatch = lower.match(/limit\s+\$(\d+)/);
    if (limitMatch) {
      const idx = parseInt(limitMatch[1], 10) - 1;
      const limit = Number(params[idx]) || 50;
      list = list.slice(0, limit);
    }
    return { rows: list, rowCount: list.length };
  }

  // 12. Update order status: UPDATE orders SET status = ...
  if (lower.includes("update orders set")) {
    const status = params[0];
    const cancelReason = params[1] || null;
    const id = Number(params[2]);
    const order = s.orders.find((o) => o.id === id);
    if (order) {
      order.status = status;
      order.cancel_reason = cancelReason;
      order.updated_at = new Date().toISOString();
      saveStore();
      return { rows: [{ ...order }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  // 13. Update user password: UPDATE users SET password_hash = $1 WHERE email = $2
  if (lower.includes("update users set") && lower.includes("password_hash")) {
    const newHash = params[0];
    const email = (params[1] || "").trim().toLowerCase();
    const user = s.users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      user.password_hash = newHash;
      saveStore();
      return { rows: [{ id: user.id, email: user.email }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  console.warn("[DevDB] Unhandled SQL in mock mode:", sql, params);
  return { rows: [], rowCount: 0 };
}

// Dev Pool interface matching pg.Pool
const devPool = {
  isMock: true,
  query: executeQuery,
  connect: async () => ({
    query: executeQuery,
    release: () => {},
  }),
  on: () => {},
  end: async () => {},
};

module.exports = { devPool };
