import { Link } from "react-router";
import {
  Building2, DollarSign, ShoppingCart, Users, UserCircle,
  Settings, Store, LayoutGrid, ArrowRight, CheckCircle2, ShieldCheck,
  Layers, Globe2, HardHat,
  ClipboardCheck, Wallet, Workflow, Sparkles, Menu, X,
} from "lucide-react";
import { useState, useEffect } from "react";
// ─── Data ─────────────────────────────────────────────────────────────────────

interface ModuleDef {
  id: string; name: string; tagline: string; href: string;
  icon: React.ElementType;
  accent: string; dim: string;
  metric: { value: string; label: string };
}

const MODULES: ModuleDef[] = [
  {
    id: "construction", name: "Projects", tagline: "Site execution · Timeline · Approvals",
    href: "/apps/construction", icon: Building2,
    accent: "#1d4ed8", dim: "#dbeafe",
    metric: { value: "₦12.8B", label: "live project budget" },
  },
  {
    id: "finance", name: "Finance", tagline: "Budgets · Expenses · Payroll",
    href: "/apps/finance", icon: DollarSign,
    accent: "#047857", dim: "#d1fae5",
    metric: { value: "₦340M", label: "headroom across budgets" },
  },
  {
    id: "procurement", name: "Procurement", tagline: "RFQ · PO · Vendor Management",
    href: "/apps/procurement", icon: ShoppingCart,
    accent: "#6d28d9", dim: "#ede9fe",
    metric: { value: "47", label: "active suppliers" },
  },
  {
    id: "storefront", name: "Storefront", tagline: "Inventory · Materials · Stores",
    href: "/apps/storefront", icon: Store,
    accent: "#0f766e", dim: "#ccfbf1",
    metric: { value: "247", label: "SKUs tracked live" },
  },
  {
    id: "hr", name: "HR", tagline: "People · Payroll · Leave",
    href: "/apps/hr", icon: Users,
    accent: "#b45309", dim: "#fef3c7",
    metric: { value: "156", label: "employees on platform" },
  },
  {
    id: "ess", name: "ESS", tagline: "Self-Service · Pay Slips · Requests",
    href: "/apps/ess", icon: UserCircle,
    accent: "#4338ca", dim: "#e0e7ff",
    metric: { value: "100%", label: "pay slip coverage" },
  },
  {
    id: "admin", name: "Admin", tagline: "Users · Roles · System Settings",
    href: "/apps/admin", icon: Settings,
    accent: "#334155", dim: "#e2e8f0",
    metric: { value: "100%", label: "system health" },
  },
];

const ROLES = [
  { icon: HardHat, name: "Construction Manager", role: "Run projects", point: "Track schedules, budgets and site approvals from one dashboard." },
  { icon: Wallet, name: "Accountant / Finance", role: "Close the books", point: "Post to a double-entry ledger that refuses to save an unbalanced entry." },
  { icon: ClipboardCheck, name: "Store Manager", role: "Control inventory", point: "Reorder levels, reusable assets and per-type stock accumulate automatically." },
  { icon: ShoppingCart, name: "Procurement Officer", role: "Source & deliver", point: "RFQs, formal POs with signatories, payment terms and GRNs in one flow." },
  { icon: Users, name: "HR Manager", role: "Manage people", point: "Grades, allowances and a payroll run that posts cleanly to Finance." },
  { icon: UserCircle, name: "Every Employee", role: "Self-serve", point: "Pay slips, leave and expense claims — no trips to the office." },
];

const TRUST = [
  "Only posted, approved transactions ever touch account balances.",
  "Drafts can never post. Every journal entry is balance-checked before save.",
  "Payment-term tranches must total exactly 100% before they can be saved.",
  "One shared source of truth — a PO created in Procurement appears automatically in Finance.",
];

const WORKFLOWS = [
  { step: "01", icon: ClipboardCheck, title: "Request & Approve", text: "Employees raise material, expense or leave requests. Managers approve in context — budgets, stock and policy baked in." },
  { step: "02", icon: ShoppingCart, title: "Procure & Receive", text: "RFQs to formal purchase orders with signatories, payment terms and goods-receipt tracking against ordered quantities." },
  { step: "03", icon: Wallet, title: "Invoice & Post", text: "Finance opens the invoice the moment a PO is sent over — pre-filled with payment term, amount due and SKU lines." },
  { step: "04", icon: Workflow, title: "Trace on the Ledger", text: "Every posting lands on a double-entry general ledger with full journal lines — Debits equal Credits, always." },
];

// ─── Landing Page ──────────────────────────────────────────────────────────────

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="landing min-h-screen bg-white text-slate-900 font-[DM_Sans,ui-sans-serif,system-ui] overflow-x-hidden">
      {/* Navbar */}
      <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/90 backdrop-blur-md border-b border-slate-200/70 shadow-sm" : "bg-transparent"}`}>
        <nav className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-base font-extrabold">B</span>
            <span className="text-lg font-bold tracking-tight">BuildOS</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-slate-600">
            <a href="#modules" className="hover:text-slate-900 transition-colors">Modules</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#roles" className="hover:text-slate-900 transition-colors">Who it's for</a>
            <a href="#integrity" className="hover:text-slate-900 transition-colors">Financial integrity</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth/login" className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              Sign in
            </Link>
            <a href="#demo" className="px-4 py-2 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-colors cursor-pointer">
              Request a demo
            </a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer" aria-label="Toggle menu">
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-5 py-4 space-y-1">
            {[["Modules", "#modules"], ["How it works", "#workflow"], ["Who it's for", "#roles"], ["Financial integrity", "#integrity"]].map(([label, href]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="block py-2 text-sm text-slate-700 hover:text-slate-900">{label}</a>
            ))}
            <div className="pt-2 flex items-center gap-3">
              <Link to="/auth/login" className="flex-1 text-center px-4 py-2 text-sm font-semibold border border-slate-200 text-slate-700 rounded-lg">Sign in</Link>
              <a href="#demo" onClick={() => setMenuOpen(false)} className="flex-1 text-center px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg">Request a demo</a>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section id="top" className="relative pt-20 sm:pt-24">
        <div className="absolute -top-24 right-0 w-[520px] h-[520px] rounded-full bg-sky-100 blur-3xl opacity-70 pointer-events-none" />
        <div className="absolute top-40 -left-24 w-[420px] h-[420px] rounded-full bg-cyan-100 blur-3xl opacity-60 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center py-12 sm:py-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              The construction ERP built for Naira-scale build programmes
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              One system.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600">
                Every naira accounted for.
              </span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-lg leading-relaxed">
              BuildOS puts a double-entry ledger, live budgets and store-level inventory behind every project —
              so a posting can only ever be balanced, and you can always explain where the money went.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link to="/auth/login" className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold transition-all">
                Launch BuildOS
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <a href="#modules" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-sm font-semibold transition-colors cursor-pointer">
                Explore the modules
              </a>
            </div>
            <p className="mt-4 text-xs text-slate-400">No download · Deploys in minutes · 7 modules, one workspace</p>
          </div>

          {/* Product preview */}
          <div className="relative">
            <div className="absolute -inset-3 bg-gradient-to-br from-sky-200 via-cyan-100 to-teal-100 rounded-3xl blur-2xl opacity-80 pointer-events-none" />
            <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" /><span className="w-2 h-2 rounded-full bg-amber-400" /><span className="w-2 h-2 rounded-full bg-green-400" />
                </div>
                <span className="text-[11px] text-slate-400 font-medium">buildos.app / launcher</span>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-700">Workspace</span>
                  </div>
                  <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">All 7 modules live</span>
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  {MODULES.map((mod) => (
                    <div key={mod.id} className="rounded-xl border border-slate-100 p-3.5 hover:shadow-md transition-shadow group cursor-default" style={{ background: `linear-gradient(135deg, ${mod.dim} 0%, #ffffff 60%)` }}>
                      <div className="flex items-center justify-between">
                        <mod.icon className="w-4.5 h-4.5" style={{ color: mod.accent }} />
                        <span className="text-[10px] font-semibold" style={{ color: mod.accent }}>{mod.metric.value}</span>
                      </div>
                      <p className="mt-2 text-[13px] font-bold text-slate-800">{mod.name}</p>
                      <p className="text-[10px] text-slate-500">{mod.tagline}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-slate-900 text-white">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[11px] font-medium">Entry balanced</span>
                  <span className="ml-auto text-[10px] text-slate-400 font-mono">DR 2110 AP · CR 1110 Cash ₦850,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Trust band */}
        <div className="max-w-7xl mx-auto px-5 sm:px-8 pb-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { value: "₦17.2B", label: "of live construction portfolio" },
            { value: "7", label: "integrated modules, one data layer" },
            { value: "100%", label: "of entries balanced before post" },
            { value: "0", label: "drafts ever touching the ledger" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-100 bg-white/80 backdrop-blur-sm p-4">
              <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20 sm:py-28 max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div className="max-w-2xl">
            <p className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-2">The platform</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Seven modules. One workspace. Zero double-entry spreadsheets.
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Everything a construction business touches — projects, money, procurement, people, materials —
              lives in one connected product, styled like the modern apps your team already uses.
            </p>
          </div>
          <Link to="/auth/login" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-900 hover:text-sky-700 transition-colors shrink-0">
            See it live
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODULES.map((mod) => (
            <Link key={mod.id} to={mod.href}
              className="group relative rounded-2xl border border-slate-100 bg-white p-6 overflow-hidden transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60 cursor-pointer">
              <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${mod.accent}, transparent)` }} />
              <div className="flex items-start justify-between">
                <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: mod.dim, color: mod.accent }}>
                  <mod.icon className="w-5 h-5" />
                </span>
                <span className="text-right">
                  <span className="block text-xl font-extrabold" style={{ color: mod.accent }}>{mod.metric.value}</span>
                  <span className="block text-[11px] text-slate-500">{mod.metric.label}</span>
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-slate-900">{mod.name}</h3>
              <p className="text-sm text-slate-500 mt-0.5">{mod.tagline}</p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 group-hover:text-slate-900 transition-colors">
                Open module
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </Link>
          ))}

          {/* CTA card */}
          <div className="rounded-2xl bg-slate-900 text-white p-6 relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-sky-500/20 blur-2xl pointer-events-none" />
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium mb-3">
                <LayoutGrid className="w-3.5 h-3.5" /> Your team here
              </span>
              <h3 className="text-lg font-bold">Roles for everyone on the build</h3>
              <p className="text-sm text-slate-300 mt-2 leading-relaxed">From the accountant closing a month-end to the store manager counting stock — one login, one context.</p>
            </div>
            <Link to="/auth/login" className="mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors">
              Sign in to your workspace
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20 sm:py-28 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-2">How it works</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              From a site request to a posted journal entry — without leaving the room.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {WORKFLOWS.map((w) => (
              <div key={w.step} className="relative rounded-2xl border border-slate-100 bg-white p-6">
                <div className="absolute top-6 right-6 text-3xl font-extrabold text-slate-100">{w.step}</div>
                <span className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white mb-4">
                  <w.icon className="w-5 h-5" />
                </span>
                <h3 className="text-base font-bold text-slate-900">{w.title}</h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Financial integrity */}
      <section id="integrity" className="py-20 sm:py-28 max-w-7xl mx-auto px-5 sm:px-8 grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="text-sm font-bold text-sky-600 uppercase tracking-wider mb-2">Financial integrity</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            The ledger that refuses to be out of balance.
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            Accounting is unforgiving, so the product is designed to be just as strict. Every journal entry is
            checked against itself before it can be saved — Debits must equal Credits, drafts can never reach
            the ledger, and payment terms must total 100% before they exist.
          </p>
          <div className="mt-8 space-y-3">
            {TRUST.map((t) => (
              <div key={t} className="flex items-start gap-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-3 bg-gradient-to-br from-emerald-100 via-teal-100 to-cyan-100 rounded-3xl blur-2xl opacity-80 pointer-events-none" />
          <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-2"><Layers className="w-4 h-4 text-slate-400" /> Journal entry · JE-0042</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Balanced ✓</span>
            </div>
            <div className="divide-y divide-slate-50">
              {[
                ["5100 Material Costs", "Debit", "₦850,000"],
                ["2110 Accounts Payable", "Credit", "₦850,000"],
                ["2130 VAT Payable", "Credit", "₦127,500"],
                ["2140 WHT Payable", "Credit", "₦42,500"],
              ].map(([acct, side, amt]) => (
                <div key={acct} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{acct}</p>
                    <p className="text-[10px] text-slate-400">{side}</p>
                  </div>
                  <span className={`text-sm font-bold ${side === "Debit" ? "text-slate-900" : "text-emerald-600"}`}>{amt}</span>
                </div>
              ))}
              <div className="px-5 py-3 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Totals</span>
                <span className="text-xs font-bold text-slate-900">₦1,020,000 = ₦1,020,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="py-20 sm:py-28 bg-slate-900 text-white border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2">Who it's for</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Built for every seat on the build.
            </h2>
            <p className="mt-4 text-slate-400 leading-relaxed">
              Each role sees the workspace their job demands — approvals for the manager, the ledger for the
              accountant, the store for the storekeeper.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ROLES.map((r) => (
              <div key={r.name} className="rounded-2xl border border-slate-700/60 bg-slate-800/50 p-6 transition-colors hover:border-slate-600">
                <span className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center text-sky-300 mb-4">
                  <r.icon className="w-5 h-5" />
                </span>
                <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">{r.role}</p>
                <h3 className="text-lg font-bold mt-0.5">{r.name}</h3>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{r.point}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="demo" className="relative py-24 max-w-5xl mx-auto px-5 sm:px-8 text-center">
        <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-sky-600 via-cyan-600 to-teal-600 opacity-95" />
        <div className="absolute inset-0 -z-10 rounded-3xl opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 30%, #ffffff55 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
        <Globe2 className="w-10 h-10 text-white/90 mx-auto mb-6" />
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Your build programme, accounted for.
        </h2>
        <p className="mt-4 text-sky-50 max-w-xl mx-auto leading-relaxed">
          Sign in and walk the same workflows your CFO, store manager and site teams will use —
          live, with real numbers.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link to="/auth/login" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-slate-100 transition-colors">
            Sign in to BuildOS
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/auth/signup" className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/40 text-white text-sm font-semibold hover:bg-white/10 transition-colors">
            Create an account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-10">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-600 flex items-center justify-center text-white text-sm font-extrabold">B</span>
            <span className="text-sm font-bold">BuildOS</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <a href="#modules" className="hover:text-slate-900 transition-colors cursor-pointer">Modules</a>
            <a href="#workflow" className="hover:text-slate-900 transition-colors cursor-pointer">How it works</a>
            <Link to="/auth/login" className="hover:text-slate-900 transition-colors">Sign in</Link>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} BuildOS · Built for the modern construction company</p>
        </div>
      </footer>
    </div>
  );
}
