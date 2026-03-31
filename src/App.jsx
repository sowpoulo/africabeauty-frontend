// ════════════════════════════════════════════════════════════════════════════
// src/App.jsx — AfricaBeauty Frontend
// Stack : React + Tailwind CSS + Recharts
// ════════════════════════════════════════════════════════════════════════════
import { useState, useEffect, createContext, useContext } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const API = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const AuthCtx = createContext(null);

// ─── HELPERS ────────────────────────────────────────────────────────────────
const fmtDH   = (n) => `${Number(n || 0).toLocaleString("fr-MA")} DH`;
const fmtDate = (d) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtTime = (d) => new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

const api = async (path, opts = {}, token) => {
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...opts.headers },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (!res.ok) throw await res.json();
  return res.json();
};

// ════════════════════════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user,  setUser]  = useState(() => { try { return JSON.parse(localStorage.getItem("ab_user")); } catch { return null; } });
  const [token, setToken] = useState(() => localStorage.getItem("ab_token") || null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "ok") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const login = async (email, password) => {
    try {
      const data = await api("/auth/login", { method: "POST", body: { email, password } });
      localStorage.setItem("ab_token", data.token);
      localStorage.setItem("ab_user", JSON.stringify(data.user));
      setToken(data.token); setUser(data.user);
    } catch (e) { showToast(e.error || "Erreur de connexion", "err"); }
  };

  const logout = () => {
    localStorage.removeItem("ab_token"); localStorage.removeItem("ab_user");
    setToken(null); setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, token, showToast }}>
      <div className="min-h-screen bg-neutral-950 text-white font-sans">
        {toast && (
          <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full text-sm font-bold shadow-xl ${toast.type === "err" ? "bg-red-500 text-white" : "bg-emerald-400 text-neutral-950"}`}>
            {toast.msg}
          </div>
        )}
        {!user ? <LoginPage onLogin={login} /> : user.role === "MANAGER" ? <ManagerApp onLogout={logout} /> : <EmployeeApp onLogout={logout} />}
      </div>
    </AuthCtx.Provider>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// LOGIN
// ════════════════════════════════════════════════════════════════════════════
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [pwd,   setPwd]   = useState("");
  const [show,  setShow]  = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    await onLogin(email, pwd);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "radial-gradient(ellipse at 60% 20%, #1a0a2e 0%, #0a0015 60%)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">✂️</div>
          <h1 className="text-3xl font-bold tracking-tight">AfricaBeauty</h1>
          <p className="text-neutral-400 text-sm mt-1">Salon de coiffure — Espace personnel</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-7 backdrop-blur">
          <div className="mb-4">
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wider">Email</label>
            <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-purple-500 transition"
              value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@salon.ma" autoCapitalize="none" />
          </div>
          <div className="mb-6">
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wider">Mot de passe</label>
            <div className="relative">
              <input className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-purple-500 transition"
                type={show ? "text" : "password"} value={pwd} onChange={e => setPwd(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()} placeholder="••••••••" />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" onClick={() => setShow(s => !s)}>{show ? "🙈" : "👁️"}</button>
            </div>
          </div>
          <button className="w-full py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-purple-600 to-pink-500 hover:opacity-90 transition disabled:opacity-50"
            onClick={submit} disabled={loading}>{loading ? "Connexion…" : "Se connecter"}</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// MANAGER APP
// ════════════════════════════════════════════════════════════════════════════
function ManagerApp({ onLogout }) {
  const [tab, setTab] = useState("dashboard");
  const { user } = useContext(AuthCtx);

  const tabs = [
    { id: "dashboard",    icon: "📊", label: "Dashboard"   },
    { id: "appointments", icon: "📅", label: "Rendez-vous" },
    { id: "employees",    icon: "👥", label: "Équipe"      },
    { id: "services",     icon: "✨", label: "Prestations" },
  ];

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-neutral-950/90 backdrop-blur z-40">
        <div>
          <div className="text-xs text-purple-400 uppercase tracking-widest">Manager</div>
          <div className="font-bold text-lg leading-tight">{user.name}</div>
        </div>
        <button className="text-xs text-neutral-500 border border-white/10 rounded-lg px-3 py-1.5" onClick={onLogout}>Déconnexion</button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto pb-24">
        {tab === "dashboard"    && <ManagerDashboard />}
        {tab === "appointments" && <AppointmentsManager />}
        {tab === "employees"    && <EmployeesManager />}
        {tab === "services"     && <ServicesManager />}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl border-t border-white/10 bg-neutral-950/95 backdrop-blur flex">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 transition ${tab === t.id ? "text-purple-400" : "text-neutral-500"}`}>
            <span className="text-lg">{t.icon}</span>{t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ── MANAGER DASHBOARD ───────────────────────────────────────────────────────
function ManagerDashboard() {
  const { token, showToast } = useContext(AuthCtx);
  const [period, setPeriod] = useState("month");
  const [stats,  setStats]  = useState(null);
  const [chart,  setChart]  = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        api(`/stats/ca?period=${period}`, {}, token),
        api("/stats/ca-chart", {}, token),
      ]);
      setStats(s); setChart(c);
    } catch { showToast("Erreur chargement stats", "err"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, [period]);

  const periodLabel = { day: "Aujourd'hui", week: "Cette semaine", month: "Ce mois" }[period];

  return (
    <div className="p-4 space-y-4">
      {/* Period selector */}
      <div className="flex gap-2">
        {["day","week","month"].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${period === p ? "bg-purple-600 border-purple-500 text-white" : "border-white/10 text-neutral-400"}`}>
            {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
          </button>
        ))}
      </div>

      {loading ? <Spinner /> : <>
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label={`CA — ${periodLabel}`} value={fmtDH(stats?.totalCA)} color="text-purple-400" />
          <KpiCard label="Nombre de RDV" value={stats?.totalCount || 0} color="text-pink-400" />
        </div>

        {/* Chart */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
          <div className="text-xs text-neutral-400 uppercase tracking-wider mb-3">CA 7 derniers jours</div>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.05)" />
              <XAxis dataKey="date" tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "#737373", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v) => [`${v} DH`]} contentStyle={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="ca" fill="url(#barGrad)" radius={[4,4,0,0]} />
              <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By employee */}
        {stats?.byEmployee?.length > 0 && <>
          <div className="text-xs text-neutral-400 uppercase tracking-wider">Classement employées</div>
          {stats.byEmployee.map((e, i) => {
            const max = stats.byEmployee[0].ca || 1;
            return (
              <div key={e.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{["🥇","🥈","🥉"][i] || `#${i+1}`}</span>
                    <span className="font-semibold text-sm">{e.name}</span>
                    <span className="text-xs text-neutral-500">{e.count} RDV</span>
                  </div>
                  <span className="text-purple-400 font-bold text-sm">{fmtDH(e.ca)}</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-purple-600 to-pink-500 transition-all"
                    style={{ width: `${Math.round((e.ca / max) * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </>}
      </>}
    </div>
  );
}

// ── APPOINTMENTS MANAGER ────────────────────────────────────────────────────
function AppointmentsManager() {
  const { token, showToast } = useContext(AuthCtx);
  const [appts,     setAppts]     = useState([]);
  const [employees, setEmployees] = useState([]);
  const [services,  setServices]  = useState([]);
  const [form,      setForm]      = useState(null); // null | "new" | appt obj
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [a, e, s] = await Promise.all([
        api("/appointments", {}, token),
        api("/users", {}, token),
        api("/services", {}, token),
      ]);
      setAppts(a); setEmployees(e.filter(u => u.role === "EMPLOYEE")); setServices(s);
    } catch { showToast("Erreur chargement", "err"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (data.id) {
        await api(`/appointments/${data.id}`, { method: "PATCH", body: data }, token);
        showToast("Rendez-vous modifié ✓");
      } else {
        await api("/appointments", { method: "POST", body: data }, token);
        showToast("Rendez-vous ajouté ✓");
      }
      setForm(null); load();
    } catch { showToast("Erreur sauvegarde", "err"); }
  };

  const del = async (id) => {
    if (!confirm("Supprimer ce rendez-vous ?")) return;
    try { await api(`/appointments/${id}`, { method: "DELETE" }, token); showToast("Supprimé"); load(); }
    catch { showToast("Erreur suppression", "err"); }
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Rendez-vous</h2>
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          onClick={() => setForm("new")}>+ Nouveau</button>
      </div>

      {appts.length === 0 && <Empty text="Aucun rendez-vous" />}

      {appts.map(a => (
        <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{a.clientName}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{a.service?.name} · {a.employee?.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{fmtDate(a.date)} à {fmtTime(a.date)}</div>
            </div>
            <div className="text-right">
              <div className="text-purple-400 font-bold">{fmtDH(a.price)}</div>
              <StatusBadge status={a.status} />
            </div>
          </div>
          {a.rating && <div className="mt-2 text-xs text-yellow-400">{"⭐".repeat(a.rating)} {a.comment && <span className="text-neutral-400 ml-1">"{a.comment}"</span>}</div>}
          <div className="flex gap-2 mt-3">
            <button className="text-xs border border-white/10 rounded-lg px-3 py-1.5 text-neutral-400 hover:text-white transition" onClick={() => setForm(a)}>Modifier</button>
            <button className="text-xs border border-red-500/30 rounded-lg px-3 py-1.5 text-red-400 hover:text-red-300 transition" onClick={() => del(a.id)}>Supprimer</button>
          </div>
        </div>
      ))}

      {form && (
        <Modal title={form === "new" ? "Nouveau RDV" : "Modifier RDV"} onClose={() => setForm(null)}>
          <ApptForm initial={form === "new" ? null : form} employees={employees} services={services} onSave={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
    </div>
  );
}

function ApptForm({ initial, employees, services, onSave, onCancel }) {
  const [f, setF] = useState({
    clientName: initial?.clientName || "",
    serviceId:  initial?.serviceId  || services[0]?.id || "",
    employeeId: initial?.employeeId || employees[0]?.id || "",
    date:       initial?.date ? new Date(initial.date).toISOString().slice(0,16) : "",
    price:      initial?.price || "",
    status:     initial?.status || "CONFIRMED",
    rating:     initial?.rating || "",
    comment:    initial?.comment || "",
    ...(initial ? { id: initial.id } : {}),
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  return (
    <div className="space-y-3">
      <Field label="Client" type="text" value={f.clientName} onChange={v => set("clientName", v)} placeholder="Nom du client" />
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Prestation</label>
        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none"
          value={f.serviceId} onChange={e => set("serviceId", e.target.value)}>
          {services.map(s => <option key={s.id} value={s.id}>{s.name} — {s.price} DH</option>)}
        </select>
      </div>
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Employée</label>
        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none"
          value={f.employeeId} onChange={e => set("employeeId", e.target.value)}>
          {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
        </select>
      </div>
      <Field label="Date & heure" type="datetime-local" value={f.date} onChange={v => set("date", v)} />
      <Field label="Prix (DH)" type="number" value={f.price} onChange={v => set("price", v)} placeholder="0" />
      {initial && (
        <div>
          <label className="block text-xs text-neutral-400 mb-1">Statut</label>
          <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none"
            value={f.status} onChange={e => set("status", e.target.value)}>
            {["CONFIRMED","IN_PROGRESS","COMPLETED","CANCELLED"].map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </select>
        </div>
      )}
      <Field label="Note client (1-5)" type="number" value={f.rating} onChange={v => set("rating", v)} placeholder="optionnel" />
      <Field label="Commentaire client" type="text" value={f.comment} onChange={v => set("comment", v)} placeholder="optionnel" />
      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-bold text-sm" onClick={() => onSave(f)}>Enregistrer</button>
        <button className="flex-1 py-3 border border-white/10 rounded-xl text-sm text-neutral-400" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── EMPLOYEES MANAGER ───────────────────────────────────────────────────────
function EmployeesManager() {
  const { token, showToast } = useContext(AuthCtx);
  const [employees, setEmployees] = useState([]);
  const [form,      setForm]      = useState(null);
  const [loading,   setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try { setEmployees(await api("/users", {}, token)); } catch { showToast("Erreur", "err"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (data.id) { await api(`/users/${data.id}`, { method: "PATCH", body: data }, token); showToast("Modifié ✓"); }
      else { await api("/users", { method: "POST", body: data }, token); showToast("Employée créée ✓"); }
      setForm(null); load();
    } catch { showToast("Erreur sauvegarde", "err"); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Équipe</h2>
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          onClick={() => setForm("new")}>+ Ajouter</button>
      </div>
      {employees.map(e => (
        <div key={e.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center font-bold">{e.name[0]}</div>
            <div>
              <div className="font-semibold text-sm">{e.name}</div>
              <div className="text-xs text-neutral-500">{e.email} · {e.role === "MANAGER" ? "Manager" : "Employée"}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${e.active ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>{e.active ? "Actif" : "Inactif"}</span>
            <button className="text-xs border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-400" onClick={() => setForm(e)}>✏️</button>
          </div>
        </div>
      ))}
      {form && (
        <Modal title={form === "new" ? "Nouvelle employée" : "Modifier"} onClose={() => setForm(null)}>
          <UserForm initial={form === "new" ? null : form} onSave={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
    </div>
  );
}

function UserForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ name: initial?.name || "", email: initial?.email || "", password: "", role: initial?.role || "EMPLOYEE", active: initial?.active !== false, ...(initial ? { id: initial.id } : {}) });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Nom complet" value={f.name} onChange={v => set("name", v)} placeholder="Yasmine Benali" />
      <Field label="Email" type="email" value={f.email} onChange={v => set("email", v)} placeholder="yasmine@salon.ma" />
      {!initial && <Field label="Mot de passe" type="password" value={f.password} onChange={v => set("password", v)} placeholder="••••••••" />}
      <div>
        <label className="block text-xs text-neutral-400 mb-1">Rôle</label>
        <select className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none"
          value={f.role} onChange={e => set("role", e.target.value)}>
          <option value="EMPLOYEE">Employée</option>
          <option value="MANAGER">Manager</option>
        </select>
      </div>
      {initial && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.active} onChange={e => set("active", e.target.checked)} className="accent-purple-500" />
          <span className="text-sm">Compte actif</span>
        </label>
      )}
      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-bold text-sm" onClick={() => onSave(f)}>Enregistrer</button>
        <button className="flex-1 py-3 border border-white/10 rounded-xl text-sm text-neutral-400" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ── SERVICES MANAGER ────────────────────────────────────────────────────────
function ServicesManager() {
  const { token, showToast } = useContext(AuthCtx);
  const [services, setServices] = useState([]);
  const [form,     setForm]     = useState(null);
  const [loading,  setLoading]  = useState(true);

  const load = async () => {
    setLoading(true);
    try { setServices(await api("/services", {}, token)); } catch { showToast("Erreur", "err"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async (data) => {
    try {
      if (data.id) { await api(`/services/${data.id}`, { method: "PATCH", body: data }, token); showToast("Modifié ✓"); }
      else { await api("/services", { method: "POST", body: data }, token); showToast("Prestation créée ✓"); }
      setForm(null); load();
    } catch { showToast("Erreur", "err"); }
  };

  if (loading) return <Spinner />;
  return (
    <div className="p-4 space-y-3">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Prestations</h2>
        <button className="bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-bold px-4 py-2 rounded-xl"
          onClick={() => setForm("new")}>+ Ajouter</button>
      </div>
      {services.map(s => (
        <div key={s.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center">
          <div>
            <div className="font-semibold text-sm">{s.name}</div>
            <div className="text-xs text-neutral-500">{s.duration} min · {fmtDH(s.price)}</div>
          </div>
          <button className="text-xs border border-white/10 rounded-lg px-2.5 py-1.5 text-neutral-400" onClick={() => setForm(s)}>✏️</button>
        </div>
      ))}
      {form && (
        <Modal title={form === "new" ? "Nouvelle prestation" : "Modifier"} onClose={() => setForm(null)}>
          <ServiceForm initial={form === "new" ? null : form} onSave={save} onCancel={() => setForm(null)} />
        </Modal>
      )}
    </div>
  );
}

function ServiceForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState({ name: initial?.name || "", price: initial?.price || "", duration: initial?.duration || "", ...(initial ? { id: initial.id } : {}) });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3">
      <Field label="Nom" value={f.name} onChange={v => set("name", v)} placeholder="ex: Coupe femme" />
      <Field label="Prix (DH)" type="number" value={f.price} onChange={v => set("price", v)} placeholder="0" />
      <Field label="Durée (minutes)" type="number" value={f.duration} onChange={v => set("duration", v)} placeholder="30" />
      <div className="flex gap-2 pt-2">
        <button className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-xl font-bold text-sm" onClick={() => onSave(f)}>Enregistrer</button>
        <button className="flex-1 py-3 border border-white/10 rounded-xl text-sm text-neutral-400" onClick={onCancel}>Annuler</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// EMPLOYEE APP
// ════════════════════════════════════════════════════════════════════════════
function EmployeeApp({ onLogout }) {
  const [tab, setTab] = useState("planning");
  const { user } = useContext(AuthCtx);

  return (
    <div className="flex flex-col min-h-screen max-w-2xl mx-auto">
      <header className="flex items-center justify-between px-4 py-3 border-b border-white/10 sticky top-0 bg-neutral-950/90 backdrop-blur z-40">
        <div>
          <div className="text-xs text-pink-400 uppercase tracking-widest">Employée</div>
          <div className="font-bold text-lg">{user.name}</div>
        </div>
        <button className="text-xs text-neutral-500 border border-white/10 rounded-lg px-3 py-1.5" onClick={onLogout}>Déconnexion</button>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        {tab === "planning" && <EmployeePlanning />}
        {tab === "ca"       && <EmployeeCA />}
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl border-t border-white/10 bg-neutral-950/95 backdrop-blur flex">
        {[["planning","📅","Planning"],["ca","💰","Mon CA"]].map(([id, icon, lbl]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex-1 flex flex-col items-center py-3 text-xs gap-0.5 ${tab === id ? "text-pink-400" : "text-neutral-500"}`}>
            <span className="text-xl">{icon}</span>{lbl}
          </button>
        ))}
      </nav>
    </div>
  );
}

function EmployeePlanning() {
  const { token, showToast } = useContext(AuthCtx);
  const [view,  setView]  = useState("day");
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const now = new Date();
    let from, to;
    if (view === "day") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      to   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    } else {
      const day = now.getDay() || 7;
      const mon = new Date(now); mon.setDate(now.getDate() - day + 1); mon.setHours(0,0,0,0);
      const sun = new Date(mon); sun.setDate(mon.getDate() + 7);
      from = mon.toISOString(); to = sun.toISOString();
    }
    try { setAppts(await api(`/appointments?from=${from}&to=${to}`, {}, token)); }
    catch { showToast("Erreur", "err"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [view]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex gap-2">
        {[["day","Aujourd'hui"],["week","Cette semaine"]].map(([v,l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${view === v ? "bg-pink-600 border-pink-500 text-white" : "border-white/10 text-neutral-400"}`}>{l}</button>
        ))}
      </div>
      {loading ? <Spinner /> : appts.length === 0 ? <Empty text="Aucun rendez-vous" /> : appts.map(a => (
        <div key={a.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-semibold">{a.clientName}</div>
              <div className="text-xs text-neutral-400 mt-0.5">{a.service?.name}</div>
              <div className="text-xs text-neutral-500 mt-0.5">{fmtDate(a.date)} · {fmtTime(a.date)}</div>
            </div>
            <div className="text-right">
              <div className="text-pink-400 font-bold">{fmtDH(a.price)}</div>
              <StatusBadge status={a.status} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmployeeCA() {
  const { token, showToast } = useContext(AuthCtx);
  const [period, setPeriod] = useState("day");
  const [stats,  setStats]  = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try { setStats(await api(`/stats/ca?period=${period}`, {}, token)); }
    catch { showToast("Erreur", "err"); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [period]);

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        {["day","week","month"].map(p => (
          <button key={p} onClick={() => setPeriod(p)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold border transition ${period === p ? "bg-pink-600 border-pink-500 text-white" : "border-white/10 text-neutral-400"}`}>
            {p === "day" ? "Jour" : p === "week" ? "Semaine" : "Mois"}
          </button>
        ))}
      </div>
      {loading ? <Spinner /> : (
        <div className="space-y-3">
          <KpiCard label={`CA — ${period === "day" ? "Aujourd'hui" : period === "week" ? "Semaine" : "Mois"}`}
            value={fmtDH(stats?.totalCA)} color="text-pink-400" />
          <KpiCard label="Nombre de RDV" value={stats?.totalCount || 0} color="text-purple-400" />
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ════════════════════════════════════════════════════════════════════════════
const KpiCard = ({ label, value, color }) => (
  <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
    <div className="text-xs text-neutral-400 uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-2xl font-bold ${color}`}>{value}</div>
  </div>
);

const Field = ({ label, type = "text", value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs text-neutral-400 mb-1">{label}</label>
    <input className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-purple-500 transition"
      type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/70 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
    <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">{title}</h3>
        <button className="text-neutral-500 text-xl leading-none" onClick={onClose}>×</button>
      </div>
      {children}
    </div>
  </div>
);

const Spinner = () => (
  <div className="flex justify-center py-12">
    <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
  </div>
);

const Empty = ({ text }) => (
  <div className="text-center text-neutral-500 py-10 text-sm">{text}</div>
);

const StatusBadge = ({ status }) => {
  const map = { CONFIRMED: ["Confirmé","bg-blue-500/20 text-blue-400"], IN_PROGRESS: ["En cours","bg-yellow-500/20 text-yellow-400"], COMPLETED: ["Terminé","bg-emerald-500/20 text-emerald-400"], CANCELLED: ["Annulé","bg-red-500/20 text-red-400"] };
  const [label, cls] = map[status] || ["—","bg-white/10 text-white"];
  return <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${cls}`}>{label}</span>;
};

const statusLabel = (s) => ({ CONFIRMED: "Confirmé", IN_PROGRESS: "En cours", COMPLETED: "Terminé", CANCELLED: "Annulé" }[s] || s);
