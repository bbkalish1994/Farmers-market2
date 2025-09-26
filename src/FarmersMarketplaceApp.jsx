/**

Farmers Marketplace - Single-file React frontend (preview-ready)

Default export: FarmersMarketplaceApp


Tailwind CSS styling assumed (you can also adapt classes to normal CSS)


Features included (frontend-only, with mocked API layer):

Login and Signup (localStorage mock auth)


Farmer dashboard: browse products, ask specialist (chat stub), upload crop image for plant doctor, add to cart, checkout mock


Merchant dashboard: add/edit products, mark promotions, view orders (mock)


Simple role-based view switching (farmer / merchant)


Mocked API layer (api.* functions) that uses localStorage to persist products, users, orders


How to use:

Create a Vite/CRA React project and add Tailwind (optional). Drop this file into src/ and import in index.js.


This is designed to be a clear starting point to connect to real APIs later. */



import React, { useEffect, useState, useRef } from "react";

/* ----------------------------- Mock API Layer ---------------------------- */ const API = { // simple localStorage-backed data stores _init() { if (!localStorage.getItem("fm_products")) { const sampleProducts = [ { id: "p1", name: "Urea 46%", type: "fertilizer", price: 450, qty: 100, merchantId: "m1", promoted: false }, { id: "p2", name: "Glyphosate 41%", type: "herbicide", price: 1200, qty: 50, merchantId: "m2", promoted: true }, { id: "p3", name: "Imidacloprid 17.8%", type: "pesticide", price: 800, qty: 80, merchantId: "m1", promoted: false } ]; localStorage.setItem("fm_products", JSON.stringify(sampleProducts)); } if (!localStorage.getItem("fm_users")) { const users = [ { id: "u1", name: "Farmer Ramu", role: "farmer", email: "farmer@example.com", password: "pass123" }, { id: "m1", name: "Merchant John", role: "merchant", email: "merchant@example.com", password: "pass123" } ]; localStorage.setItem("fm_users", JSON.stringify(users)); } if (!localStorage.getItem("fm_orders")) localStorage.setItem("fm_orders", JSON.stringify([])); },

async signup({ name, email, password, role }) { this._init(); const users = JSON.parse(localStorage.getItem("fm_users")); if (users.find((u) => u.email === email)) throw new Error("Email already registered"); const id = u_${Date.now()}; const user = { id, name, role, email, password }; users.push(user); localStorage.setItem("fm_users", JSON.stringify(users)); return { ...user, password: undefined }; },

async login({ email, password }) { this._init(); const users = JSON.parse(localStorage.getItem("fm_users")); const user = users.find((u) => u.email === email && u.password === password); if (!user) throw new Error("Invalid credentials"); return { ...user, password: undefined }; },

async getProducts({ filter } = {}) { this._init(); let products = JSON.parse(localStorage.getItem("fm_products")); if (filter) { if (filter.type) products = products.filter((p) => p.type === filter.type); if (filter.search) products = products.filter((p) => p.name.toLowerCase().includes(filter.search.toLowerCase())); } // promoted first products = products.sort((a, b) => (b.promoted === true) - (a.promoted === true)); return products; },

async addProduct(product) { this._init(); const products = JSON.parse(localStorage.getItem("fm_products")); product.id = p_${Date.now()}; products.push(product); localStorage.setItem("fm_products", JSON.stringify(products)); return product; },

async updateProduct(updated) { this._init(); const products = JSON.parse(localStorage.getItem("fm_products")); const idx = products.findIndex((p) => p.id === updated.id); if (idx === -1) throw new Error("Product not found"); products[idx] = { ...products[idx], ...updated }; localStorage.setItem("fm_products", JSON.stringify(products)); return products[idx]; },

async placeOrder(order) { this._init(); const orders = JSON.parse(localStorage.getItem("fm_orders")); order.id = o_${Date.now()}; order.date = new Date().toISOString(); orders.push(order); localStorage.setItem("fm_orders", JSON.stringify(orders)); return order; },

async getOrdersForMerchant(merchantId) { this._init(); const orders = JSON.parse(localStorage.getItem("fm_orders")); return orders.filter((o) => o.items.some((i) => i.merchantId === merchantId)); } };

/* ----------------------------- Utility Hooks ----------------------------- */ function useAuth() { const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem("fm_current_user")); } catch { return null; } }); function save(u) { setUser(u); localStorage.setItem("fm_current_user", JSON.stringify(u)); } function logout() { setUser(null); localStorage.removeItem("fm_current_user"); } return { user, save, logout }; }

/* ------------------------------- Components ------------------------------ */

function Topbar({ user, onLogout, onSwitchRole }) { return ( <div className="w-full bg-green-700 text-white p-4 flex items-center justify-between"> <div className="flex items-center gap-3"> <div className="text-2xl font-bold">KrishiBazaar</div> <div className="text-sm opacity-90">Farmers Marketplace</div> </div> <div className="flex items-center gap-3"> {user ? ( <> <div className="text-sm">{user.name} • {user.role}</div> <button className="bg-white text-green-700 px-3 py-1 rounded" onClick={onLogout}>Logout</button> </> ) : ( <div className="text-sm opacity-90">Not logged in</div> )} </div> </div> ); }

function LoginSignup({ onLoginSuccess }) { const [mode, setMode] = useState("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState(""); const [role, setRole] = useState("farmer"); const [err, setErr] = useState("");

async function submit(e) { e.preventDefault(); setErr(""); try { if (mode === "login") { const user = await API.login({ email, password }); onLoginSuccess(user); } else { const user = await API.signup({ name, email, password, role }); onLoginSuccess(user); } } catch (e) { setErr(e.message); } }

return ( <div className="max-w-md mx-auto mt-8 bg-white p-6 rounded shadow"> <div className="flex justify-between items-center mb-4"> <h2 className="text-xl font-semibold">{mode === "login" ? "Login" : "Sign up"}</h2> <div className="text-sm text-gray-500">{mode === "login" ? "New here?" : "Already have an account?"} <button className="text-green-600 font-medium" onClick={() => setMode(mode === "login" ? "signup" : "login")}>{mode === "login" ? "Sign up" : "Login"}</button></div> </div>

<form onSubmit={submit} className="space-y-3">
    {mode === "signup" && (
      <div>
        <label className="block text-sm">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className="w-full border p-2 rounded" required />
      </div>
    )}
    <div>
      <label className="block text-sm">Email</label>
      <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border p-2 rounded" required />
    </div>
    <div>
      <label className="block text-sm">Password</label>
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-2 rounded" required />
    </div>
    {mode === "signup" && (
      <div>
        <label className="block text-sm">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full border p-2 rounded">
          <option value="farmer">Farmer (Buy)</option>
          <option value="merchant">Merchant (Sell)</option>
        </select>
      </div>
    )}
    {err && <div className="text-red-600">{err}</div>}
    <div className="flex justify-between items-center">
      <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
    </div>
  </form>
</div>

); }

function ProductCard({ product, onAddToCart }) { return ( <div className="border p-3 rounded shadow-sm bg-white"> <div className="flex justify-between items-start"> <div> <div className="font-semibold">{product.name}</div> <div className="text-xs text-gray-500">{product.type} • Stock: {product.qty}</div> </div> <div className="text-right"> <div className="text-lg font-bold">₹{product.price}</div> <div className="text-xs text-gray-500">/{product.type}</div> </div> </div> <div className="mt-3 flex gap-2"> <button disabled={product.qty <= 0} className="flex-1 bg-green-600 text-white py-1 rounded" onClick={() => onAddToCart(product)}>Add to cart</button> {product.promoted && <div className="text-sm text-yellow-700 px-2 py-1 rounded border">Promoted</div>} </div> </div> ); }

function FarmerDashboard({ user }) { const [products, setProducts] = useState([]); const [filter, setFilter] = useState({ search: "", type: "" }); const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem("fm_cart")) || []); const [specialistOpen, setSpecialistOpen] = useState(false); const [doctorOpen, setDoctorOpen] = useState(false); const [messageLog, setMessageLog] = useState([]);

useEffect(() => { API.getProducts({}).then(setProducts); }, []); useEffect(() => { localStorage.setItem("fm_cart", JSON.stringify(cart)); }, [cart]);

function addToCart(p) { const existing = cart.find((c) => c.id === p.id); if (existing) { setCart(cart.map((c) => c.id === p.id ? { ...c, qty: c.qty + 1 } : c)); } else setCart([...cart, { ...p, qty: 1 }]); }

async function checkout() { if (!user) return alert("Please login"); const order = { buyerId: user.id, items: cart.map(({ id, name, price, qty, merchantId }) => ({ id, name, price, qty, merchantId })) }; const res = await API.placeOrder(order); setCart([]); alert("Order placed: " + res.id); }

function sendToSpecialist(text) { // mock answer const req = { from: user.name, text, time: new Date().toISOString() }; setMessageLog((m) => [...m, { ...req, by: "me" }]); setTimeout(() => { setMessageLog((m) => [...m, { from: "Specialist", text: Suggested: Use a balanced NPK and check soil pH. (mocked advice) , time: new Date().toISOString(), by: "them" }]); }, 900); }

async function uploadImage(file) { // convert to base64 for demo — in real app POST to backend or cloud storage const reader = new FileReader(); reader.onload = () => { const base64 = reader.result; setDoctorOpen(true); setMessageLog((m) => [...m, { from: user.name, text: "Uploaded image for diagnosis", time: new Date().toISOString(), image: base64 }]); setTimeout(() => setMessageLog((m) => [...m, { from: "Plant Doctor", text: "Likely fungal infection — apply recommended fungicide and remove affected leaves.", time: new Date().toISOString() }]), 1200); }; reader.readAsDataURL(file); }

return ( <div className="p-6"> <div className="grid grid-cols-1 md:grid-cols-4 gap-6"> <div className="md:col-span-3"> <div className="flex gap-3 mb-4"> <input placeholder="Search products" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} className="flex-1 border p-2 rounded" /> <select value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })} className="border p-2 rounded"> <option value="">All</option> <option value="fertilizer">Fertilizer</option> <option value="pesticide">Pesticide</option> <option value="herbicide">Herbicide</option> </select> <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => setSpecialistOpen((s) => !s)}>Ask Specialist</button> <label className="bg-white border px-3 py-2 rounded cursor-pointer"> Upload Crop Image <input type="file" accept="image/*" onChange={(e) => uploadImage(e.target.files[0])} className="hidden" /> </label> </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.filter(p => (filter.search ? p.name.toLowerCase().includes(filter.search.toLowerCase()) : true) && (filter.type ? p.type === filter.type : true)).map((p) => (
          <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
        ))}
      </div>
    </div>

    <div>
      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Cart</h3>
        {cart.length === 0 && <div className="text-sm text-gray-500">No items</div>}
        {cart.map((c) => (
          <div key={c.id} className="flex justify-between items-center py-1">
            <div className="text-sm">{c.name} x {c.qty}</div>
            <div className="text-sm">₹{c.price * c.qty}</div>
          </div>
        ))}
        <div className="mt-3">
          <button disabled={cart.length === 0} className="w-full bg-green-600 text-white py-2 rounded" onClick={checkout}>Checkout</button>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mt-4">
        <h3 className="font-semibold mb-2">Plant Doctor & Specialist</h3>
        <div className="text-xs text-gray-500">Use the chat to get quick guidance (mocked).</div>
        {specialistOpen && (
          <div className="mt-3">
            <ChatBox messages={messageLog} onSend={sendToSpecialist} />
          </div>
        )}
      </div>
    </div>
  </div>
</div>

); }

function ChatBox({ messages, onSend }) { const [text, setText] = useState(""); return ( <div> <div className="h-48 overflow-auto border p-2 rounded bg-white"> {messages.map((m, i) => ( <div key={i} className={mb-2 ${m.by === 'me' ? 'text-right' : ''}}> <div className="text-xs text-gray-500">{m.from} • {new Date(m.time).toLocaleTimeString()}</div> {m.image && <img src={m.image} alt="uploaded" className="max-h-32 rounded mt-1" />} <div className="mt-1 inline-block p-2 rounded bg-green-50">{m.text}</div> </div> ))} </div> <div className="flex gap-2 mt-2"> <input value={text} onChange={(e) => setText(e.target.value)} className="flex-1 border p-2 rounded" placeholder="Ask about pests, dosage, soil..." /> <button className="bg-green-600 text-white px-3 py-2 rounded" onClick={() => { onSend(text); setText(""); }}>Send</button> </div> </div> ); }

function MerchantDashboard({ user }) { const [products, setProducts] = useState([]); const [form, setForm] = useState({ name: "", type: "fertilizer", price: 0, qty: 0, promoted: false }); const [orders, setOrders] = useState([]);

useEffect(() => { API.getProducts().then(setProducts); if (user) API.getOrdersForMerchant(user.id).then(setOrders); }, [user]);

async function addProduct(e) { e.preventDefault(); const p = { ...form, merchantId: user.id }; await API.addProduct(p); const all = await API.getProducts(); setProducts(all); setForm({ name: "", type: "fertilizer", price: 0, qty: 0, promoted: false }); }

async function togglePromote(prod) { await API.updateProduct({ id: prod.id, promoted: !prod.promoted }); setProducts(await API.getProducts()); }

return ( <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6"> <div className="bg-white p-4 rounded shadow"> <h3 className="font-semibold mb-3">Add / Promote Product</h3> <form onSubmit={addProduct} className="space-y-3"> <input placeholder="Product name" className="w-full border p-2 rounded" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /> <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full border p-2 rounded"> <option value="fertilizer">Fertilizer</option> <option value="pesticide">Pesticide</option> <option value="herbicide">Herbicide</option> </select> <input type="number" placeholder="Price" className="w-full border p-2 rounded" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /> <input type="number" placeholder="Stock qty" className="w-full border p-2 rounded" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /> <div className="flex items-center gap-2"> <input type="checkbox" checked={form.promoted} onChange={(e) => setForm({ ...form, promoted: e.target.checked })} /> Promote </div> <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">Add product</button> </form>

<div className="mt-4">
      <h4 className="font-semibold">Your products</h4>
      <div className="space-y-2 mt-2">
        {products.filter(p => p.merchantId === user.id).map(p => (
          <div key={p.id} className="flex justify-between items-center border p-2 rounded">
            <div>
              <div className="font-medium">{p.name}</div>
              <div className="text-xs text-gray-500">{p.type} • Stock {p.qty}</div>
            </div>
            <div className="flex gap-2 items-center">
              <div>₹{p.price}</div>
              <button className="text-xs px-2 py-1 border rounded" onClick={() => togglePromote(p)}>{p.promoted ? 'Unpromote' : 'Promote'}</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  <div className="bg-white p-4 rounded shadow">
    <h3 className="font-semibold mb-3">Orders for your products</h3>
    {orders.length === 0 && <div className="text-sm text-gray-500">No orders yet</div>}
    <div className="space-y-2">
      {orders.map(o => (
        <div key={o.id} className="border p-2 rounded">
          <div className="text-xs text-gray-500">Order {o.id} • {new Date(o.date).toLocaleString()}</div>
          {o.items.filter(i => i.merchantId === user.id).map((it, idx) => (
            <div key={idx} className="flex justify-between py-1">
              <div className="text-sm">{it.name} x {it.qty}</div>
              <div className="text-sm">₹{it.price * it.qty}</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  </div>
</div>

); }

export default function FarmersMarketplaceApp() { API._init(); const auth = useAuth(); const [view, setView] = useState("home");

useEffect(() => { if (auth.user) setView(auth.user.role === 'merchant' ? 'merchant' : 'farmer'); }, [auth.user]);

function handleLoginSuccess(u) { auth.save(u); setView(u.role === 'merchant' ? 'merchant' : 'farmer'); }

function handleLogout() { auth.logout(); setView('home'); }

return ( <div className="min-h-screen bg-gray-100"> <Topbar user={auth.user} onLogout={handleLogout} /> <div className="container mx-auto"> {!auth.user && ( <div> <LoginSignup onLoginSuccess={handleLoginSuccess} /> <div className="p-6 text-center text-sm text-gray-600">Or continue as guest to browse products</div> </div> )}

{auth.user && auth.user.role === 'farmer' && <FarmerDashboard user={auth.user} />}
    {auth.user && auth.user.role === 'merchant' && <MerchantDashboard user={auth.user} />}

    {!auth.user && (
      <div className="p-6">
        <h2 className="text-lg font-semibold">Browse products (guest)</h2>
        <p className="text-sm text-gray-600">Login to buy or sign up as a merchant to sell.</p>
        <GuestBrowse />
      </div>
    )}

    <div className="p-6 text-center text-xs text-gray-500">This frontend is a mock. Replace API.* functions with real backend endpoints (REST/GraphQL) as needed.</div>
  </div>
</div>

); }

function GuestBrowse() { const [products, setProducts] = useState([]); useEffect(() => { API.getProducts().then(setProducts); }, []); return ( <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4"> {products.map(p => ( <div key={p.id} className="border p-3 rounded bg-white"> <div className="font-semibold">{p.name}</div> <div className="text-xs text-gray-500">{p.type} • ₹{p.price}</div> </div> ))} </div> ); }

