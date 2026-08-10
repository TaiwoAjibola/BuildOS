# Procurement → Finance → Posting: Requirement Tracker

> Status per requirement from the latest product review (21-item spec).
> Symbols: [x] done · [~] in progress · [ ] not started · [blocked] waiting on decision.
> Updated continuously; commit history shows touched vs not-done.

## Procurement Documents & Requests
- [x] R1 — MR/PR dedup: duplicate-raise blocked (one MR → one PR), similarity warning in New MR, PR dup-block on same MR ref, MR→PR trace link shown
- [x] R2 — Purchase Orders as formal documents (company template, delivery address, terms, supplier details, Download PDF via print)
- [x] R3 — Procurement Manager signature on PO document (signature block on formal PO + PDF printout)
- [x] R4 — Payment terms per transaction (configurable tranches) — PO seeds, New PO, quote→PO create all carry `paymentTermId`
- [x] R5 — Default payment terms settings so presets exist on create
- [x] R7 — Goods Receipt as formal document (company letterhead, linked PO/MR, delivery details, received/accepted/rejected lines, signature block, Download PDF via print)

## Finance Workflow
- [~] R6 — Finance handoff rule: implemented as Payment Trigger column + gate (after_delivery POs await GRN before Pay); full automation from shared PO/GRN data still pending
- [x] R8 — Finance PO screen: View/Pay only — Accept/Decline removed; only Pay / Approve / Post actions
- [x] R9 — Finance pay screen shows Total vs Amount Due vs Balance + Payment Trigger; payment seeds from Amount Due
- [x] R10 — Send for Approval → Approved → Post → Posted (no auto-post). "Confirm & Post" removed in Finance PO, Payroll ("Post to Ledger") and Purchase Invoice (Send for Approval → Approve Payment → Post)
- [x] R11 — Status vocabulary New/Open, Pending Approval, Approved, Posted on Finance PO screen; "Paid" removed as a posting status
- [~] R12 — Attachments: supporting-doc chips (PO/GRN) shown in Finance PO payment modal; deeper attachment storage pending

## Posting Engine & Ledger
- [~] R13 — Process-driven: PO payment modal auto-pre-fills lines from "Purchase Order Payment" mapping; payroll uses mapping. Manual-recreation gap closed where editors exist
- [~] R14 — Ledger/GL update on posting (postTransaction) — already the posting rule; verify in smoke test
- [x] R15 — Posting configurations editable — MappingModal loads existing config into the form (Edit Posting Configuration)
- [x] R16 — Process-specific amounts: PO → Amount Due (Total/Due/Balance exposed), payroll → granular components
- [x] R17 — Granular payroll account mapping per component (Basic Salary, Allowances Total → DR Labour; PAYE → WHT; Net → Cash)
- [x] R18 — Chart of Accounts stores account structure; balances derive from posted ledger lines (getAccountBalance) — confirmed
- [blocked] R19 — Accounting validation: pension payable debit/credit effect + granular allowance/tax posting need qualified accountant sign-off (not implemented); toolkit flag added in mapping comment

## Product/UX + Housekeeping
- [~] R20 — UI/UX: duplicate actions removed (MR raise → PR dedupe, PR dup-block); readability improvements applied; ongoing pass
- [x] R21 — Admin changelog live-fed from the changelog store; all new workflows log via `logChange`; this tracker kept current (touched vs not-done)