# 🏗️ BuildOS — FULL UI + FRONTEND GENERATION PROMPT (ENTERPRISE-GRADE)

## 🧠 PRODUCT OVERVIEW

Build a **modern, enterprise-grade construction ERP suite** called **BuildOS**.

This is NOT a single app.

It is a **multi-application suite**, similar to:

* Google Workspace
* Odoo
* Zoho

Each module is a **separate app inside a unified ecosystem**.

---

# 🏢 MULTI-TENANT STRUCTURE (CRITICAL)

* Users must first **register a company**
* The first user becomes the **Company Admin (Owner)**
* All other users belong under this company
* All data is **company-scoped**

---

# 🔐 AUTHENTICATION FLOW

## Signup

* User registers:

  * Company Name
  * Email
  * Password
* Email verification via:

  * OTP OR magic link

## Login

* Email + Password
* Optional email verification step

---

# 👥 USER & ROLE SYSTEM

## Roles

* Admin (Company Owner)
* Construction Manager
* Accountant
* Store Manager
* HR Manager
* Employee

## Rules

* Admin can:

  * Add users
  * Assign roles
  * Control permissions
* Users:

  * Can belong to multiple projects
  * Only see apps they have access to

---

# 🧭 ENTRY EXPERIENCE (VERY IMPORTANT)

## Smart Landing Logic

### Admin:

→ Sees **App Launcher Dashboard**

### Other Users:

→ Land directly in their **primary app**

---

# 🧱 APP LAUNCHER DASHBOARD

## Layout

* NO sidebar
* Clean grid layout
* Top navigation bar

## Top Navigation

* Global search
* Notifications
* Profile dropdown

## Main Content

* App cards:

  * BuildOS Construction
  * BuildOS Finance
  * BuildOS Procurement
  * BuildOS HR
  * BuildOS ESS

Each card:

* Icon
* Name
* Color-coded
* Click → opens app

---

# 🔁 GLOBAL NAVIGATION SYSTEM

## Inside Each App

### Top Bar (Global)

* App switcher dropdown
* Search
* Profile Completion Bar
* Notifications
* User profile

### Sidebar (App-specific)

* Navigation for that app only

---

# 🎨 DESIGN SYSTEM

## General Style

* Modern SaaS
* Clean but data-rich
* Professional (not playful)

## UI Stack

* React
* Tailwind CSS
* ShadCN UI components

## Visual Identity

* Each app has a **distinct color theme**
* Layout structure is different for each application
* Modals are consistent across apps

## UI Elements

* Tables (primary)
* Cards (secondary)
* Modals
* Drawers
* Tabs
* Filters + search everywhere

---

# 🧱 CORE SYSTEM OBJECT

Everything revolves around:

👉 **PROJECT**

* All:

  * Expenses
  * Materials
  * Workforce
  * Requests
    → must be linked to a project

---

# 🏗️ APPLICATIONS (APPS IN SUITE)

---

## 1. 🏗️ BuildOS Construction App

### Purpose

Project control + approvals

### Pages

* Projects List
* Project Details
* Approvals Dashboard

### Key Features

* Create project
* Assign workers
* Approve requests
* Track progress

---

## 2. 💰 BuildOS Finance App

### Pages

* Expenses
* Transactions
* Budget Tracking

### Features

* Approve expenses
* Track costs
* View project financials

---

## 3. 📦 BuildOS Procurement App

### Pages

* Inventory Dashboard
* Material Requests
* Purchase Requests
* Suppliers

### Features

* Stock tracking
* Issue materials
* Trigger procurement

---

## 4. 👷 BuildOS HR App

### Pages

* Employee List
* Attendance
* Payroll (basic)

### Features

* Add employees
* Assign to projects
* Track attendance

---

## 5. 👤 BuildOS ESS App (Employee Self-Service)

### Pages

* My Requests
* Submit Request
* My Projects

### Features

* Submit material requests
* Submit expense requests
* Track request status

---

# 🔄 CORE UX FLOWS (MUST IMPLEMENT)

---

## 🧩 MATERIAL REQUEST FLOW

1. Employee submits request (ESS)
2. Construction Manager approves
3. Procurement checks stock:

   * If available → issue
   * If not → create purchase request
4. Finance approves spend
5. Inventory updated
6. Material issued to project

---

## 💰 EXPENSE FLOW

1. Employee submits expense
2. Manager reviews
3. Finance approves
4. Expense recorded
5. Project cost updated

---

## 👷 WORKFORCE FLOW

1. HR adds employee
2. Assign to project
3. Track attendance
4. Send payroll to finance

---

## 📦 INVENTORY FLOW

1. Add stock
2. Track levels
3. Issue materials
4. Auto low-stock alert

---

## 🔁 APPROVAL SYSTEM

Status:

* Pending
* Approved
* Rejected
* Completed

---

# 📊 DATA UX

* Heavy use of tables
* Every table:

  * Search
  * Filters
  * Sorting
* Modal-based creation/editing
* Inline status badges

---

# ⚙️ BEHAVIORAL RULES

* All actions are logged (audit trail ready)
* All data tied to company
* All actions tied to projects where applicable

---

# 🚀 OUTPUT REQUIREMENTS

Generate:

1. Full React app structure
2. Pages for each app
3. Reusable components:

   * Tables
   * Forms
   * Modals
4. Navigation system
5. State handling (basic)
6. Clean, scalable folder structure

---

# 🎯 GOAL

The result should feel like:
👉 A real enterprise SaaS product
👉 Clean, scalable, production-ready UI
👉 Not a prototype — a usable system

---

# ⚠️ IMPORTANT

* Do NOT merge apps into one UI
* Treat each module as a separate app
* Maintain consistent system-wide UX
* Ensure fast navigation between apps

---

# 🧠 FINAL INSTRUCTION

Build this as a **modular ERP suite with excellent UX, scalable architecture, and clean design consistency across applications while allowing visual distinction per app.**
