/**
 * Farmers Marketplace - Single-file React frontend (preview-ready)
 * - Default export: FarmersMarketplaceApp
 * - Tailwind CSS styling assumed (you can also adapt classes to normal CSS)
 *
 * Features included (frontend-only, with mocked API layer):
 * - Login and Signup (localStorage mock auth)
 * - Farmer dashboard: browse products, ask specialist (chat stub), upload crop image for plant doctor, add to cart, checkout mock
 * - Merchant dashboard: add/edit products, mark promotions, view orders (mock)
 * - Simple role-based view switching (farmer / merchant)
 * - Mocked API layer (api.* functions) that uses localStorage to persist products, users, orders
 *
 * How to use:
 * - Create a Vite/CRA React project and add Tailwind (optional). Drop this file into src/ and import in index.js.
 * - This is designed to be a clear starting point to connect to real APIs later.
 */

import React, { useEffect, useState } from "react";

/* ----------------------------- Mock API Layer ---------------------------- */
const API = {
  // simple localStorage-backed data stores
  _init() {
    if (!localStorage.getItem("fm_products")) {
      const sampleProducts = [
        { id: "p1", name: "Urea 46%", type: "fertilizer", price: 450, qty: 100, merchantId: "m1", promoted: false },
        { id: "p2", name: "Glyphosate 41%", type: "herbicide", price: 1200, qty: 50, merchantId: "m2", promoted: true },
        { id: "p3", name: "Imidacloprid 17.8%", type: "pesticide", price: 800, qty: 80, merchantId: "m1", promoted: false }
      ];
      localStorage.setItem("fm_products", JSON.stringify(sampleProducts));
    }
    if (!localStorage.getItem("fm_users")) {
      const users = [
        { id: "u1", name: "Farmer Ramu", role: "farmer", email: "farmer@example.com", password: "pass123" },
        { id: "m1", name: "Merchant John", role: "merchant", email: "merchant@example.com", password: "pass123" }
      ];
      localStorage.setItem("fm_users", JSON.stringify(users));
    }
    if (!localStorage.getItem("fm_orders")) localStorage.setItem("fm_orders", JSON.stringify([]));
  },

  async signup({ name, email, password, role }) {
    this._init();
    const users = JSON.parse(localStorage.getItem("fm_users"));
    if (users.find((u) => u.email === email)) throw new Error("Email already registered");
    const id = `u_${Date.now()}`;
    const user = { id, name, role, email, password };
    users.push(user);
    localStorage.setItem("fm_users", JSON.stringify(users));
    return { ...user, password: undefined };
  },

  async login({ email, password }) {
    this._init();
    const users = JSON.parse(localStorage.getItem("fm_users"));
    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) throw new Error("Invalid credentials");
    return { ...user, password: undefined };
  },

  async getProducts({ filter } = {}) {
    this._init();
    let products = JSON.parse(localStorage.getItem("fm_products"));
    if (filter) {
      if (filter.type) products = products.filter((p) => p.type === filter.type);
      if (filter.search) products = products.filter((p) => p.name.toLowerCase().includes(filter.search.toLowerCase()));
    }
    // promoted first
    products = products.sort((a, b) => (b.promoted === true) - (a.promoted === true));
    return products;
  },

  async addProduct(product) {
    this._init();
    const products = JSON.parse(localStorage.getItem("fm_products"));
    product.id = `p_${Date.now()}`;
    products.push(product);
    localStorage.setItem("fm_products", JSON.stringify(products));
    return product;
  },

  async updateProduct(updated) {
    this._init();
    const products = JSON.parse(localStorage.getItem("fm_products"));
    const idx = products.findIndex((p) => p.id === updated.id);
    if (idx === -1) throw new Error("Product not found");
    products[idx] = { ...products[idx], ...updated };
    localStorage.setItem("fm_products", JSON.stringify(products));
    return products[idx];
  },

  async placeOrder(order) {
    this._init();
    const orders = JSON.parse(localStorage.getItem("fm_orders"));
    order.id = `o_${Date.now()}`;
    order.date = new Date().toISOString();
    orders.push(order);
    localStorage.setItem("fm_orders", JSON.stringify(orders));
    return order;
  },

  async getOrdersForMerchant(merchantId) {
    this._init();
    const orders = JSON.parse(localStorage.getItem("fm_orders"));
    return orders.filter((o) => o.items.some((i) => i.merchantId === merchantId));
  }
};

/* ----------------------------- Utility Hooks ----------------------------- */
function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("fm_current_user"));
    } catch {
      return null;
    }
  });
  function save(u) {
    setUser(u);
    localStorage.setItem("fm_current_user", JSON.stringify(u));
  }
  function logout() {
    setUser(null);
    localStorage.removeItem("fm_current_user");
  }
  return { user, save, logout };
}

/* ------------------------------- Components ------------------------------ */

function Topbar({ user, onLogout }) {
  return (
    <div style={{ width: "100%", background: "#15803d", color: "white", padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>KrishiBazaar</div>
        <div style={{ fontSize: 12, opacity: 0.9 }}>Farmers Marketplace</div>
      </div>
      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        {user ? (
          <>
            <div style={{ fontSize: 12 }}>{user.name} • {user.role}</div>
            <button style={{ background: "white", color: "#15803d", padding: "6px 10px", borderRadius: 6 }} onClick={onLogout}>Logout</button>
          </>
        ) : (
          <div style={{ fontSize: 12, opacity: 0.9 }}>Not logged in</div>
        )}
      </div>
    </div>
  );
}

function LoginSignup({ onLoginSuccess }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("farmer");
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") {
        const user = await API.login({ email, password });
        onLoginSuccess(user);
      } else {
        const user = await API.signup({ name, email, password, role });
        onLoginSuccess(user);
      }
    } catch (e) {
      setErr(e.message);
    }
  }

  return (
    <div style={{ maxWidth: 520, margin: "24px auto", background: "white", padding: 18, borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.06)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>{mode === "login" ? "Login" : "Sign up"}</h2>
        <div style={{ fontSize: 12, color: "#6b7280" }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button style={{ color: "#16a34a", background: "transparent", border: "none", cursor: "pointer" }} onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Login"}</button>
        </div>
      </div>

      <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
        {mode === "signup" && (
          <div>
            <label style={{ display: "block", fontSize: 13 }}>Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: "100%", border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }} required />
          </div>
        )}
        <div>
          <label style={{ display: "block", fontSize: 13 }}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }} required />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 13 }}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }} required />
        </div>
        {mode === "signup" && (
          <div>
            <label style={{ display: "block", fontSize: 13 }}>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }}>
              <option value="farmer">Farmer (Buy)</option>
              <option value="merchant">Merchant (Sell)</option>
            </select>
          </div>
        )}
        {err && <div style={{ color: "#dc2626" }}>{err}</div>}
        <div style={{ display: "flex", justifyContent: "flex-start" }}>
          <button style={{ background: "#16a34a", color: "white", padding: "8px 14px", borderRadius: 6, border: "none" }} type="submit">{mode === "login" ? "Login" : "Create account"}</button>
        </div>
      </form>
    </div>
  );
}

function ProductCard({ product, onAddToCart }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, background: "white" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <div>
          <div style={{ fontWeight: 600 }}>{product.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{product.type} • Stock: {product.qty}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>₹{product.price}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{product.type}</div>
        </div>
      </div>
      <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
        <button disabled={product.qty <= 0} style={{ flex: 1, background: "#16a34a", color: "white", padding: 8, borderRadius: 6, border: "none" }} onClick={() => onAddToCart(product)}>Add to cart</button>
        {product.promoted && <div style={{ fontSize: 12, color: "#92400e", padding: "6px 8px", borderRadius: 6, border: "1px dashed #f59e0b" }}>Promoted</div>}
      </div>
    </div>
  );
}

function FarmerDashboard({ user }) {
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState({ search: "", type: "" });
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("fm_cart")) || []);
  const [specialistOpen, setSpecialistOpen] = useState(false);
  const [messageLog, setMessageLog] = useState([]);

  useEffect(() => { API.getProducts({}).then(setProducts); }, []);
  useEffect(() => { localStorage.setItem("fm_cart", JSON.stringify(cart)); }, [cart]);

  function addToCart(p) {
    const existing = cart.find((c) => c.id === p.id);
    if (existing) {
      setCart(cart.map((c) => c.id === p.id ? { ...c, qty: c.qty + 1 } : c));
    } else setCart([...cart, { ...p, qty: 1 }]);
  }

  async function checkout() {
    if (!user) return alert("Please login");
    const order = { buyerId: user.id, items: cart.map(({ id, name, price, qty, merchantId }) => ({ id, name, price, qty, merchantId })) };
    const res = await API.placeOrder(order);
    setCart([]);
    alert("Order placed: " + res.id);
  }

  function sendToSpecialist(text) {
    if (!text || text.trim() === "") return;
    const req = { from: user ? user.name : "Guest", text, time: new Date().toISOString() };
    setMessageLog((m) => [...m, { ...req, by: "me" }]);
    setTimeout(() => {
      setMessageLog((m) => [...m, { from: "Specialist", text: `Suggested: Use a balanced NPK and check soil pH. (mocked advice)`, time: new Date().toISOString(), by: "them" }]);
    }, 900);
  }

  function uploadImage(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      setMessageLog((m) => [...m, { from: user ? user.name : "Guest", text: "Uploaded image for diagnosis", time: new Date().toISOString(), image: base64 }]);
      setTimeout(() => setMessageLog((m) => [...m, { from: "Plant Doctor", text: "Likely fungal infection — apply recommended fungicide and remove affected leaves.", time: new Date().toISOString() }]), 1200);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input placeholder="Search products" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} style={{ flex: 1, border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }} />
            <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} style={{ border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }}>
              <option value="">All</option>
              <option value="fertilizer">Fertilizer</option>
              <option value="pesticide">Pesticide</option>
              <option value="herbicide">Herbicide</option>
            </select>
            <button style={{ background: "#16a34a", color: "white", padding: "8px 12px", borderRadius: 6, border: "none" }} onClick={() => setSpecialistOpen((s) => !s)}>Ask Specialist</button>
            <label style={{ background: "white", border: "1px solid #e5e7eb", padding: "8px 12px", borderRadius: 6, cursor: "pointer" }}>
              Upload Crop Image
              <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0])} style={{ display: "none" }} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
            {products.filter(p => (filter.search ? p.name.toLowerCase().includes(filter.search.toLowerCase()) : true) && (filter.type ? p.type === filter.type : true)).map((p) => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
            ))}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ background: "white", padding: 12, borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginTop: 0 }}>Cart</h3>
            {cart.length === 0 && <div style={{ fontSize: 13, color: "#6b7280" }}>No items</div>}
            {cart.map((c) => (
              <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                <div style={{ fontSize: 14 }}>{c.name} x {c.qty}</div>
                <div style={{ fontSize: 14 }}>₹{c.price * c.qty}</div>
              </div>
            ))}
            <div style={{ marginTop: 10 }}>
              <button disabled={cart.length === 0} style={{ width: "100%", background: "#16a34a", color: "white", padding: 10, borderRadius: 6, border: "none" }} onClick={checkout}>Checkout</button>
            </div>
          </div>

          <div style={{ background: "white", padding: 12, borderRadius: 8, marginTop: 12, boxShadow: "0 4px 8px rgba(0,0,0,0.04)" }}>
            <h3 style={{ marginTop: 0 }}>Plant Doctor & Specialist</h3>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Use the chat to get quick guidance (mocked).</div>
            {specialistOpen && (
              <div style={{ marginTop: 8 }}>
                <ChatBox messages={messageLog} onSend={sendToSpecialist} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBox({ messages, onSend }) {
  const [text, setText] = useState("");
  return (
    <div>
      <div style={{ height: 192, overflow: "auto", border: "1px solid #e5e7eb", padding: 8, borderRadius: 6, background: "white" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 8, textAlign: m.by === "me" ? "right" : "left" }}>
            <div style={{ fontSize: 11, color: "#6b7280" }}>{m.from} • {new Date(m.time).toLocaleTimeString()}</div>
            {m.image && <img src={m.image} alt="uploaded" style={{ maxHeight: 120, borderRadius: 6, marginTop: 6 }} />}
            <div style={{ display: "inline-block", padding: 8, borderRadius: 6, background: "#ecfdf5", marginTop: 6 }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} style={{ flex: 1, border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }} placeholder="Ask about pests, dosage, soil..." />
        <button style={{ background: "#16a34a", color: "white", padding: "8px 12px", borderRadius: 6, border: "none" }} onClick={() => { onSend(text); setText(""); }}>Send</button>
      </div>
    </div>
  );
}

function MerchantDashboard({ user }) {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: "", type: "fertilizer", price: 0, qty: 0, promoted: false });
  const [orders, setOrders] = useState([]);

  useEffect(() => { API.getProducts().then(setProducts); if (user) API.getOrdersForMerchant(user.id).then(setOrders); }, [user]);

  async function addProduct(e) {
    e.preventDefault();
    const p = { ...form, merchantId: user.id };
    await API.addProduct(p);
    const all = await API.getProducts();
    setProducts(all);
    setForm({ name: "", type: "fertilizer", price: 0, qty: 0, promoted: false });
  }

  async function togglePromote(prod) {
    await API.updateProduct({ id: prod.id, promoted: !prod.promoted });
    setProducts(await API.getProducts());
  }

  return (
    <div style={{ padding: 20, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div style={{ background: "white", padding: 12, borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.04)" }}>
        <h3>Add / Promote Product</h3>
        <form onSubmit={addProduct} style={{ display: "grid", gap: 8 }}>
          <input placeholder="Product name" style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }}>
            <option value="fertilizer">Fertilizer</option>
            <option value="pesticide">Pesticide</option>
            <option value="herbicide">Herbicide</option>
          </select>
          <input type="number" placeholder="Price" style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }} value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} />
          <input type="number" placeholder="Stock qty" style={{ padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }} value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} />
          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" checked={form.promoted} onChange={(e) => setForm({ ...form, promoted: e.target.checked })} /> Promote
          </label>
          <button style={{ background: "#16a34a", color: "white", padding: 8, borderRadius: 6, border: "none" }} type="submit">Add product</button>
        </form>

        <div style={{ marginTop: 12 }}>
          <h4>Your products</h4>
          <div style={{ display: "grid", gap: 8 }}>
            {products.filter(p => p.merchantId === user.id).map(p => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: 8, border: "1px solid #e5e7eb", borderRadius: 6 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>{p.type} • Stock {p.qty}</div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <div>₹{p.price}</div>
                  <button style={{ fontSize: 12, padding: "6px 8px", border: "1px solid #e5e7eb", borderRadius: 6 }} onClick={() => togglePromote(p)}>{p.promoted ? "Unpromote" : "Promote"}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "white", padding: 12, borderRadius: 8, boxShadow: "0 4px 8px rgba(0,0,0,0.04)" }}>
        <h3>Orders for your products</h3>
        {orders.length === 0 && <div style={{ fontSize: 13, color: "#6b7280" }}>No orders yet</div>}
        <div style={{ display: "grid", gap: 8 }}>
          {orders.map(o => (
            <div key={o.id} style={{ border: "1px solid #e5e7eb", padding: 8, borderRadius: 6 }}>
              <div style={{ fontSize: 12, color: "#6b7280" }}>Order {o.id} • {new Date(o.date).toLocaleString()}</div>
              {o.items.filter(i => i.merchantId === user.id).map((it, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
                  <div style={{ fontSize: 14 }}>{it.name} x {it.qty}</div>
                  <div style={{ fontSize: 14 }}>₹{it.price * it.qty}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FarmersMarketplaceApp() {
  API._init();
  const auth = useAuth();
  const [view, setView] = useState("home");

  useEffect(() => {
    if (auth.user) setView(auth.user.role === "merchant" ? "merchant" : "farmer");
  }, [auth.user]);

  function handleLoginSuccess(u) {
    auth.save(u);
    setView(u.role === "merchant" ? "merchant" : "farmer");
  }

  function handleLogout() {
    auth.logout();
    setView("home");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6" }}>
      <Topbar user={auth.user} onLogout={handleLogout} />
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {!auth.user && (
          <div>
            <LoginSignup onLoginSuccess={handleLoginSuccess} />
            <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>Or continue as guest to browse products</div>
          </div>
        )}

        {auth.user && auth.user.role === "farmer" && <FarmerDashboard user={auth.user} />}
        {auth.user && auth.user.role === "merchant" && <MerchantDashboard user={auth.user} />}

        {!auth.user && (
          <div style={{ padding: 24 }}>
            <h2>Browse products (guest)</h2>
            <p style={{ color: "#6b7280" }}>Login to buy or sign up as a merchant to sell.</p>
            <GuestBrowse />
          </div>
        )}

        <div style={{ padding: 24, textAlign: "center", fontSize: 12, color: "#6b7280" }}>This frontend is a mock. Replace API.* functions with real backend endpoints (REST/GraphQL) as needed.</div>
      </div>
    </div>
  );
}

function GuestBrowse() {
  const [products, setProducts] = useState([]);
  useEffect(() => { API.getProducts().then(setProducts); }, []);
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginTop: 12 }}>
      {products.map(p => (
        <div key={p.id} style={{ border: "1px solid #e5e7eb", padding: 12, borderRadius: 8, background: "white" }}>
          <div style={{ fontWeight: 600 }}>{p.name}</div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>{p.type} • ₹{p.price}</div>
        </div>
      ))}
    </div>
  );
}
