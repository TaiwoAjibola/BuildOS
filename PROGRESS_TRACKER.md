# Procurement → Finance → Posting: Requirement Tracker

> Status per requirement from the latest product review (21-item spec).
> Symbols: [x] done · [~] in progress · [ ] not started · [blocked] waiting on decision.
> Updated continuously; commit history shows touched vs not-done.

## Procurement Documents & Requests
- [x] R1 — MR/PR dedup: duplicate-raise blocked (one MR → one PR), similarity warning in New MR, PR dup-block on same MR ref, MR→PR trace link shown
- [x] R2 — Purchase Orders as formal documents (company template, delivery address, terms, supplier details, Download PDF via print)
- [x] R3 — PO signatories on document — signatory block on formal PO + PDF now renders the SELECTED signatories (Procurement Settings → Signatories); defaults to Procurement Manager
- [x] R4 — Payment terms per transaction — now configured in a SHARED reactive store (`procurementSettingsStore`) + CRUD in Procurement Settings → Payment Terms; PO setup can pick an existing term OR build a custom one inline (before/after delivery, %, tranches, timing)
- [x] R5 — Default payment terms moved OUT of Finance Settings into Procurement Settings → Payment Terms (default badge + "set as default"); default term read by PO + quote→PO create
- [x] R7 — Goods Receipt as formal document (company letterhead, linked PO/MR, delivery details, received/accepted/rejected lines, signature block, Download PDF via print)

## Restructure Round (Finance Purchase Orders removed)
- [x] K1 — Procurement Settings gained **Payment Terms** (add/edit/delete/set-default, tranche builder that must total 100%) and **Signatories** (add/edit/delete) tabs
- [x] K2 — PO creation flow: New PO → pick existing OR create custom payment terms inline → select signatories → Generate PO → formal document render + PDF download (one modal, no page-jump)
- [x] K3 — Removed the Finance Purchase Orders page + `/apps/finance/purchase-orders` route + sidebar entry; deleted `FinancePurchaseOrdersPage.tsx` (+ old Process Mapping "purchase orders" changelog link → purchase-invoice)
- [x] K4 — Removed the Default PO Payment Terms card from Finance Settings (belongs to Procurement now)
- [x] K5 — Purchase Invoice stays the Finance PO-of-record surface: invoice keeps a GREYED PO ref under the invoice number; Finance actions speak **Post** (Post → Send for Approval → Pending Approval → Approved → Post to Ledger → Posted)
- [x] K6 — Posting Engine left intact; New Category "Linked Process" is now a DROPDOWN of configured processes (no manual entry)

## Finance Workflow
- [x] R6 — Finance handoff automation from shared PO/GRN data: new `procurementStore` (POs + GRNs) hoisted in AppLayout; Procurement PO page and GRN page write to it; Finance PO screen DERIVES rows from it — `sentToFinance` POs appear automatically, handoff follows the PO's payment term (`isPreDelivery`), `goodsReceived` computed from shared GRN records (gate unlocks when a GRN is recorded)
- [x] R8 — Finance PO screen: View/Pay only — Accept/Decline removed; only Pay / Approve / Post actions. NOTE: superseded by K3 — Finance PO screen removed; Purchase Invoice is the Finance PO-of-record surface (see K5)
- [x] R9 — Finance pay screen shows Total vs Amount Due vs Balance + Payment Trigger; payment seeds from Amount Due
- [x] R10 — Send for Approval → Approved → Post → Posted (no auto-post). "Confirm & Post" removed in Finance PO, Payroll ("Post to Ledger") and Purchase Invoice (Send for Approval → Approve Payment → Post)
- [x] R11 — Status vocabulary New/Open, Pending Approval, Approved, Posted on Finance PO screen; "Paid" removed as a posting status
- [~] R12 — Attachments: Finance payment modal now shows REAL linked GRN refs (from shared store) + PO chip; file attachment storage still pending

## Posting Engine & Ledger
- [x] R13 — Process-driven: PO payment modal + payroll build from process mappings; Posting Engine "Post to Ledger" now builds lines from the Process Account Mapping (falls back to category DR/CR pair only when no mapping exists)
- [~] R14 — Ledger/GL update on posting (postTransaction) — already the posting rule; verify in smoke test
- [x] R15 — Posting configurations editable — MappingModal loads existing config into the form (Edit Posting Configuration)
- [x] R16 — Process-specific amounts: PO → Amount Due (Total/Due/Balance exposed), payroll → granular components
- [x] R17 — Granular payroll account mapping per component (Basic Salary, Allowances Total → DR Labour; PAYE → WHT; Net → Cash)
- [x] R18 — Chart of Accounts stores account structure; balances derive from posted ledger lines (getAccountBalance) — confirmed
- [blocked] R19 — Accounting validation: pension payable debit/credit effect + granular allowance/tax posting need qualified accountant sign-off (not implemented); toolkit flag added in mapping comment

## Product/UX + Housekeeping
- [~] R20 — UI/UX: duplicate actions removed (MR raise → PR dedupe, PR dup-block); readability improvements applied; ongoing pass
- [x] R21 — Admin changelog live-fed from the changelog store; all new workflows log via `logChange`; this tracker kept current (touched vs not-done)