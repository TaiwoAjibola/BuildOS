# 🏗️ BuildOS — ADMIN SYSTEM FULL PROMPT

## 🧠 CONTEXT

Design and build a **fully-featured Admin / Settings application** for an enterprise construction ERP suite called **BuildOS**.

This Admin app is responsible for:

* Company-wide configuration
* User and role management
* System-level customization
* Report building
* Data governance

This is NOT a simple settings page.
It must feel like a **powerful control center**, similar to:

* Odoo Settings
* Zoho Admin Console
* SAP Configuration Panels

---

# 🏢 CORE PURPOSE

The Admin app is used by the **Company Owner (Admin)** to:

* Configure company information
* Manage users and permissions
* Define system-wide rules
* Customize reports
* Control data structures and behaviors

---

# 🧭 NAVIGATION STRUCTURE (SIDEBAR)

## 1. Organization

### Company Profile

* General Information Form:

  * Company Name
  * Email
  * Phone Number
  * Address
  * State
  * City
  * Company Logo (upload with preview)

---

### Board of Directors

Display as a **fully interactive data table**

#### Table Columns:

* First Name
* Middle Name
* Last Name
* Designation
* Sequence (numeric ordering for document display)

#### Table Capabilities (VERY IMPORTANT):

* Sortable columns (ascending/descending on every header)
* Column-level search (each column filterable independently)
* Global table search
* Filter system:

  * Predefined filters
  * Custom filter builder (admin can create filters)
* Pagination
* Inline edit OR modal edit
* Add new director
* Reorder by sequence (drag-and-drop preferred OR manual input)

---

## 2. User Management

### Users

* All Users Table
* Invite User (email-based)
* Edit User
* Activate / Deactivate User
* Assign Roles

### Roles & Permissions

#### Roles

* Create Role
* Edit Role
* Delete Role

#### Permission Matrix (CRITICAL)

* Grid system:

  * Rows = Features / Modules
  * Columns = Actions (View, Create, Edit, Delete, Approve)
* Toggle-based permissions
* Role-based access control (RBAC)

---

## 3. System Configuration

### General Settings

* Currency (default + selectable)
* Timezone
* Date format
* Number format

### Units of Measurement

* Create custom units (e.g., bags, tons, meters)
* Assign units to materials

---

## 4. Project Configuration

* Project Types
* Project Statuses (customizable)
* Default Workflows

---

## 5. Financial Configuration

* Chart of Accounts (basic structure)
* Tax Settings (basic)
* Payment Methods

---

## 6. Report Configuration (VERY IMPORTANT)

### Report Builder

Provide TWO modes:

#### 1. Visual Builder

* Drag-and-drop fields
* Select:

  * Data source (Projects, Expenses, Materials, etc.)
  * Columns
  * Filters
  * Grouping
* Preview output

#### 2. SQL Mode (Advanced)

* Input raw SQL query
* Validate query
* Preview result table

### Report Features

* Save report templates
* Edit reports
* Export (CSV, PDF)
* Share reports (role-based access)

---

## 7. Notifications & Communication

* Email Templates
* Notification Rules
* Trigger-based alerts (e.g., approval needed)

---

## 8. Audit & Logs

* User Activity Logs
* System Logs

Each log entry:

* User
* Action
* Timestamp
* Affected module

---

## 9. Integrations (UI-ready, backend optional)

* API Keys
* Webhooks

---

# 📊 GLOBAL TABLE STANDARDS (APPLIES TO ALL TABLES)

Every table in the system MUST support:

* Column sorting (asc/desc)
* Column-specific filters
* Global search
* Advanced filter builder:

  * Add multiple conditions
  * Save custom filters
* Pagination
* Export (CSV)
* Clean table UI (not cluttered)

---

# 🎨 UI / UX REQUIREMENTS (VERY IMPORTANT)

## Design Style

* Minimal but powerful
* Clean spacing
* Not visually noisy
* Professional (enterprise-level)

## Visual Identity

* Modern SaaS design
* Strong typography hierarchy
* Subtle shadows, soft borders
* Consistent spacing system

## Interaction Design

* Smooth transitions
* Fast response
* Clear feedback states:

  * Loading
  * Success
  * Error

## Layout

* Left sidebar navigation
* Top bar (search, notifications, profile)
* Content area with:

  * Header
  * Actions
  * Tables / Forms

---

# 🧠 BEHAVIORAL RULES

* All actions should be logged (audit-ready)
* Changes should reflect across the entire system
* Permissions should dynamically affect UI visibility
* Data must be company-scoped

---

# 🚀 OUTPUT REQUIREMENTS

Generate:

1. Full React-based Admin app
2. Sidebar navigation system
3. All pages listed above
4. Reusable components:

   * Advanced tables
   * Forms
   * Modals
   * Filter builders
5. Clean folder structure
6. Scalable architecture

---

# 🎯 FINAL GOAL

The Admin system should feel like:

👉 A **powerful control center**
👉 A **serious enterprise tool**
👉 Clean, fast, and highly configurable

NOT:

* A basic settings page
* A cluttered dashboard

---

# 🧠 FINAL INSTRUCTION

Build a **complete, highly detailed Admin system for BuildOS** that supports deep configuration, flexible data handling, and enterprise-grade control, while maintaining a clean and modern user experience.
