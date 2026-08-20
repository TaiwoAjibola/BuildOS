# Anchored Summary (session context)

> Currency displayed as ₦ via `toLocaleString()` / existing `fmt()` helpers. All status labels/pills match the store patterns.

## Objective
- Accounting posting logic core committed/pushed (`7570f27`); rounds 2–3 (read-only invoice ref, GL page, payroll workflow, Finance PO page) all shipped.
- Round 4 (pushed as `6360bf7`): payment terms + signatories moved into **Procurement Settings** (shared reactive store); one coherent PO creation flow; deleted Finance Purchase Orders page/route/sidebar + Finance Settings PO-terms card; Posting Engine Linked Process is a list-driven dropdown.
- Landing page now at `/` (was LoginPage) — marketing site: hero, live product preview, 7-module showcase (real launcher colors/metrics), workflow, financial-integrity ledger mock, roles, CTA + footer; links to `/auth/login` and `/auth/signup`. Authored `src/app/pages/LandingPage.tsx` (~430 lines) using the ui-ux-pro-max "Enterprise Gateway" pattern; DM Sans font link added to `index.html`.
- Current round (Storefront redesign, pushed): Material Category settings replaced the "levels" model with a **"Plus Type" + measurable dimensions + unit** model plus **Consumable/Reusable** classification per material; All Materials rebuilt with **Total/Available/Reserved Qty + Unit Cost columns** (₦ via `toLocaleString()`), an **expandable types row** on the material name showing **each type's own stock + unit cost** (parent row accumulates across types via `stockTotals`/`avgUnitCost`), and an **Add-Material picker that searches by Material Type** auto-filling name/category/unit from the chosen type.

## Important Details
- Central posting rule: only posted/approved transactions update account balances; drafts must never post. Application of "Posted" in UI is only shown once the accounting posting actually succeeded (payroll `Post` short-circuits if mapping lines are unbalanced).
- Finance already had a single shared store `src/app/stores/financeStore.tsx` (FinanceProvider context). Since the first round it is hoisted in `AppLayout` (round 2 moved it out of FinanceLayout) so seeds + newly posted transactions persist across module navigation.
- `Account.balance?` was optional and never populated; balances must now derive from posted ledger transactions (leaf accounts only). `getAccountBalance` iterates `lines` with code-prefix matching + descendant aggregation; legacy single-pair txns fall back to `txnLines()` (normalizes into two lines).
- `JournalEntryPage` previously used a local `ACCOUNTS` const and never touched the ledger. Accounts are now `"<code> <name>"` strings (e.g. `"5200 Material Costs"`).
- `PurchaseInvoicePage` "Pay" buttons used to blindly flip Approved/Overdue → Paid with no posting.
- `PaymentManagementPage` status flow: Approved Request → Sent to Finance → Payment Initiated → Payment Completed → Failed; completion previously did not post.
- `PostingEnginePage` and `AccrualsPage` still write single debit/credit TX pairs directly via the store (`setTransactions`); these are normalized to two lines by `txnLines()` so they always remain traceable in the ledger.
- HR work (previous session) finished & pushed: employee form re-categorized (General/Contact/Payment), Grade → Salary Grade, admin sync panel role dropdown + full detail viewer + edit; pushed as `1f89a0f`.

## Work State
### Completed
- Pushed HR form re-categorization + admin sync panel as `1f89a0f` (3 files, 141 insertions, 46 deletions) to `main`.
- Explored full accounting architecture before implementing: financeStore, JournalEntryPage, PurchaseInvoicePage, PaymentManagementPage, PostingEnginePage, AccrualsPage, TransactionsLedgerPage, types.ts, routes.tsx.
- `financeStore.tsx`:
  - Exported `Transaction` interface; added exported `LedgerLine` + `PostingInput`.
  - `Transaction.lines?: LedgerLine[]`; context gains `getPostableAccounts` + `postTransaction`.
  - New accounts: `a21 Input VAT (1130)`, `a22 VAT Payable (2130)`, `a23 WHT Payable (2140)`.
  - `SEED_LEDGER`: LGR-1001…1007 (Material Costs/AP via PO accrual → Invoice accrual; Lab Costs/Payroll; VAT/WHT; Contract Revenue/AR; opening capital injection — kept cash positive in demo).
  - `FinanceProvider` seeds store with SEED_LEDGER; `txnLines()`; `postTransaction` asserts `totalDebiables === totalCredits` and appends approved txn (balances debit-normal accounts; cred-normal accounts are credits — matching the "Accounts ≤ per-type" display).
  - `getAccountBalance` / `getTrialBalance` rewritten around `lines`.
- `src/app/components/JournalLinesEditor.tsx`: reusable double-entry table — account `"<code> <name>"` select, Debit/Credit inputs, Description, per-line remove, "+ Add Line"; totals footer with "Entry is balanced" / "⚠ Entry is not balanced — Debits/Credits exceed by ₦X"; `newJournalLine()` factory. Accounts come in as `{ code, name }[]`.
- `JournalEntryPage.tsx`: uses `getPostableAccounts()`; `saveEntry("Posted")` calls `postTransaction` (drafts never post); modal body uses `<JournalLinesEditor>`; view modal derives GL code from account string; removed unused BookOpen import + `expandedId` state; "Save as Draft" and "Post Entry" both require a balanced form (`!form.description || !isBalanced` guard in saveEntry).
- `PurchaseInvoicePage.tsx`: added `PayInvoiceModal` — pre-fills DR 2110 Accounts Payable / CR 1110 Cash & Bank for invoice total (whole DV), editable lines via JournalLinesEditor, Payment Date/Method/Reference; "Confirm & Post Payment" disabled until balanced + every line has an account; `payTarget` state; `confirmPay()` posts via store, marks invoice Paid, logs changelog; Pay → opens modal.
- `PaymentManagementPage.tsx`: `DEBIT_ACCOUNT` map per type (Payroll→5100 Labour Costs; Vendor/Contractor→2110 AP; Expense→5400 Overhead; credit 1110); `advancePayment` posts to ledger once "Payment Completed", generates ledgerRef `LGR-XXXX`; view modal shows "Posted to ledger {ledgerRef}".
- `TransactionsLedgerPage.tsx`: rewrote to pull from `useFinance().transactions` (store) instead of static mocks; added Accrual to typeColors, balanced summary cards (Total Debits / Total Credits / Net Position), detail modal with journal-lines table + balanced indicator + linked records; DR/CR column; export + DataTable preserved.
- `npm run build` PASSED multiple times with all the above (2199 modules, ~4.8s).

### Active
- Round 4 pushed `6360bf7`; Storefront round pushed `eeffcdb`; All-Materials type-level stock follow-up pushed `602f3e8`.
- Landing page authored at `/` (replaces LoginPage as root index; LoginPage still at `/auth/login`) — build passes; not yet committed.
- Smoke-test (Storefront): Settings → Material Categories → Add Category (material name, Consumable/Reusable, Add Type, + Dimension rows with standard/value/unit) & expanded category shows type chips + dims; All Materials → expand material name shows per-type stock + dims + accumulated totals footer; Add Material → picker searches by Material Type fills name/category/unit; Edit → per-type qty editor; Export CSV uses totals.

### Storefront round — Completed (current)
- `src/app/stores/storefrontStore.tsx` (NEW, hoisted in AppLayout inside ProcurementProvider): `MaterialClassification` (`Consumable|Reusable`), `MaterialDimension` (`{standard, value, unit}`), `MaterialType` (`{name, dimensions[], sku?}`), `CategoryMaterial` (`{name, classification, types[]}`), `MaterialCategory` (`{id,name,description,color,materials[]}`); `DIMENSION_STANDARDS` + `DIMENSION_UNITS` + `newDimension()`; `SEED_CATEGORIES` (8 cats; multi-dim types e.g. Plywood 2440×1220×12mm; Granite Tiles w/ finish custom dim); context: `categories`, `setCategories`, `addCategory`, `updateCategory`, `deleteCategory`, `allCategoryMaterials` (flat category→material list for matching).
- `StorefrontSettingsPage.tsx` `MaterialCategoriesPanel` → reads shared store; editor modal rows: Material Name + Classification select (Consumable/Reusable), "Add Type" (was Levels), each type has name + SKU + repeatable **Dimension** rows (standard select → value input → unit select w/ DIMENSION_UNITS, remove per-dim); "Add Material" / "+ Type" / "+ Dimension" patch via helpers `patchMaterial/patchType/patchDim`; category table shows "N materials · N types", expanded detail renders type chips `{value}{unit} {standard}`; summary tiles Total Categories/Materials/Reusable/Total Types; deletes via store `deleteCategory`.
- `AllMaterialsPage.tsx` → `Material` has **no top-level qty fields**; each `type` is a `MaterialStock {name, sku?, totalQty, availableQty, reservedQty, unitCost}`. Table shows **Total/Available/Reserved Qty + Unit Cost ₦** right-aligned (`toLocaleString()`); parent row accumules via `stockTotals(m)` + `avgUnitCost(m)` (qty-weighted). Last cell `₦{unitCost}` also shown parent row. Expandable material-name cell toggles a sub-row table of **each type's own Total/Available/Reserved/Unit Cost** + dimension chips via `resolveTypes(m, allCategoryMaterials)` + `fmtDim`, with an "Accumulated totals" footer per parent. **Add Material modal starts with `<CataloguePicker>`** which iterates categories → materials → **types** (matches type/material/category name); `onPick(type, material, categoryName)` auto-fills name, category, unit (first dim unit) and seeds `types: [{name: type.name, sku, zeros}]`. Edit modal edits per-type qty rows. `CATEGORY_OPTIONS` derived from `categories`+`materials` via useMemo. Export CSV uses accumulated totals incl. Reserved (totalqty incl reserved). Track modal for Reusable with return flow intact.
- `npm run build` PASSES (2205 modules, ~4.8s; only pre-existing chunk-size warning). All storefront pages transform via dev server (HTTP 200). (MOCK material types align w/ SEED catalogue names so `resolveTypes` decorates them; file ~805 lines — do NOT use `write` tool on it, JSON-payload limit blows up; append via bash heredoc.)

### Round 4 — Completed (current)
- `src/app/stores/procurementSettingsStore.tsx` (NEW, hoisted in AppLayout inside ProcurementProvider): `paymentTerms` CRUD seeded from `PAYMENT_TERM_PRESETS`, `defaultPaymentTermId` (localStorage `po-default-payment-term`), `signatories` CRUD (seed sig-001..004: Amaka Osei/Procurement Manager, Sola Adeleke/Finance Director, Ngozi Okafor/Accounts Officer, Chukwudi Eze/Store Manager), `SIGNATORY_ROLES`, `signatoriesFor`, re-exports `tranchesLabel` / `isPreDelivery` / `PaymentTermPreset` / `PaymentTranche`.
- `ProcurementSettingsPage.tsx`: tabs `numbering | payment-terms | signatories | approvals | thresholds`; PaymentTermsPanel (DataTable, Default badge, tranche chips, delivery split via `isPreDelivery`, set-default/edit/delete; builder modal with tranche rows that must total exactly 100% to save; changelog-logged) + SignatoriesPanel (DataTable + modal w/ role select). Approvals panel stays a placeholder.
- `PurchaseOrdersPage.tsx`: NewPOModal rewritten as one flow — supplier/items/delivery days, payment-term picker OR inline custom-term builder, signatory chips (pre-selected Procurement Manager), "Generate PO"; custom term saved to store as real `pt-${Date.now()}` term; `PurchaseOrderDocumentModal` renders selected signatories ("Authorised for BUILDOS") in view + PDF, falls back to Procurement Manager.
- `PurchaseOrder` type gained `signatories?: string[]`; seeds PO-0033/PO-0029 (Amaka Osei), PO-0025 (Amaka Osei + Sola Adeleke) updated.
- Finance removals: `FinancePurchaseOrdersPage.tsx` DELETED; `/apps/finance/purchase-orders` route + sidebar `ShoppingCart` removed; `ChangelogPage` "finance|purchaseorder" deep link → `/apps/finance/purchase-invoice`; FinanceSettingsPO-terms card + its `paymentTerms` imports removed. (Finance Budget Audit confirmed never existed — no-op.)
- `PurchaseInvoicePage.tsx` (Finance PO surface): greyed `PO {poRef}` under invoice-no; "Post →" action; modal headers "Post Invoice —" (send) / "Post Payment —" (execute).
- `PostingEnginePage.tsx`: NewCategoryModal Linked Process input → dropdown over `PROCESS_NAMES`; `ChevronDown` icon.
- `npm run build` PASSES (2203 modules, ~3.4s; only pre-existing chunk-size warning).

### Round 2 — Completed (current)
- `vercel.json`: added `rewrites: [{ "source": "/(.*)", "destination": "/index.html" }]` — fixes the Purchase Finance / deep-route 404 on full page reload (assets still served first).
- `PurchaseInvoicePage.tsx`: PayInvoiceModal Payment Reference pre-filled with `invoice.invoiceNo`, read-only ("Locked to invoice"); still posts balanced lines via JournalLinesEditor.
- `financeStore.tsx`: exported `ProcessAccountMapping` (`process`, `account "<code> <name>"`, `action: debit|credit`, `amountField`); `SEED_PROCESS_ACCOUNT_MAPPINGS` incl. Payroll Disbursement (DR 5100 "Gross Salary" / CR 2140 "PAYE Tax" / CR 1110 "Net Pay"); context gains `processAccountMappings`, `setProcessAccountMappings`, `buildProcessPosting(process, fields)`.
- `PostingEnginePage.tsx`: added "Process Account Mapping" tab (flat table: Process | Account Code | Account Name | Action DR/CR | Amount From), Add/Edit modal with COA select, delete; keeps existing Process Categories tab and posting flow.
- `PayrollIntegrationPage.tsx`: retitled to Payroll Overview; columns Payroll Code | Month | Year | Total Earnings | Total Deductions | Net Pay | Status | Action; statuses Draft → Sent for Approval → Approved → Pending Posting Approval → Posting Approved → Posted; actions Send for Posting Approval / Approve Posting / Post (confirmation modal shows journal-lines + balance); `Post` calls `buildProcessPosting("Payroll Disbursement", { Gross Salary, PAYE Tax, Net Pay })` then `postTransaction` (type Payroll) and stores `ledgerRef`; audit trail in run detail.
- `GeneralLedgerPage.tsx` (new): consolidated rows per journal line (Date | Reference | Source/Process | Account | Description | Debit | Credit | running Balance), summary balanced cards, export; route `/apps/finance/general-ledger` + sidebar entry; Transactions Ledger left as-is.
- `routes.tsx`: added GeneralLedgerPage route; FinanceLayout sidebar: "Payroll Overview" label + "General Ledger" entry.
- `npm run build` PASSES (vite 6.3.5).

### Blocked
- R19: pension/allowance granular DR/CR posting awaits qualified accountant sign-off — do not invent rules.
- R12 file-attachment storage; R14 manual browser smoke test open.

## Next Move
1. Browser smoke test (Storefront): /apps/storefront/settings → Material Categories → Add Category w/ classification + types + dimensions; All Materials → expand name → per-type stock rows + accumulated totals footer; Add Material → picker searches by **Material Type** fills name/category/unit; Edit → per-type qty editor; Export includes Reserved.
2. Commit + push landing page (presently uncommitted: LandingPage.tsx + routes.tsx index swap + index.html font/title).
3. R19 pension/allowance DR/CR posting blocked; R12/R14 open.

## Relevant Files
- `src/app/stores/storefrontStore.tsx` — NEW: material categories/types/dimensions store (Storefront Provider, hoisted in AppLayout)
- `src/app/pages/storefront/StorefrontSettingsPage.tsx` — MaterialCategoriesPanel: classification + Plus Type + dimension rows; reads shared store
- `src/app/pages/storefront/AllMaterialsPage.tsx` — qty/unit-cost table, expandable types, CataloguePicker Add-Material
- `src/app/layouts/AppLayout.tsx` — StorefrontProvider added
- `src/app/stores/procurementSettingsStore.tsx` — payment terms CRUD + default term + signatories (Procurement Provider, hoisted in AppLayout)
- `src/app/stores/procurementStore.tsx` — PurchaseOrder has `signatories?: string[]`; shared PO/GRN source
- `src/app/pages/procurement/ProcurementSettingsPage.tsx` — tabs + PaymentTermsPanel + SignatoriesPanel
- `src/app/pages/procurement/PurchaseOrdersPage.tsx` — NewPOModal custom-term builder + signatory chips; purchase-order document (view + PDF)
- `src/app/pages/procurement/ReceivedQuotesPage.tsx` — quote→PO uses store terms
- `src/app/pages/procurement/PurchaseInvoicePage.tsx` — Finance PO surface: greyed PO ref + Post vocabulary
- `src/app/stores/financeStore.tsx` — posting engine (postTransaction, getPostableAccounts, txnLines, balance derivation, SEED_LEDGER, processAccountMappings, buildProcessPosting)
- `src/app/components/JournalLinesEditor.tsx` — shared double-entry editor
- `src/app/pages/finance/PayrollIntegrationPage.tsx` — Payroll Overview posting workflow
- `src/app/pages/finance/PostingEnginePage.tsx` — categories + Process Account Mapping tab; Linked Process dropdown
- `src/app/pages/finance/GeneralLedgerPage.tsx` — consolidated GL with running balance
- `vercel.json` — SPA rewrite: reload 404 fix
- `src/app/pages/finance/types.ts` — Account/AccrualLine/TxnType definitions
- `src/app/stores/employeeStore.tsx` — shared HR employee store (prior work, untouched)