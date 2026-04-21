const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle, PageBreak,
  ShadingType
} = require("docx");
const fs = require("fs");

const BORDER = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const cellBorders = { top: BORDER, bottom: BORDER, left: BORDER, right: BORDER };

function h1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 200 },
    shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
    run: { color: "FFFFFF", bold: true, size: 32 }
  });
}

function h2(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 }
  });
}

function body(text) {
  return new Paragraph({ text, spacing: { after: 80 } });
}

function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

function flowTable(rows) {
  // rows: array of { step, action, description, actor }
  const header = new TableRow({
    tableHeader: true,
    children: ["Step", "Process / Action", "Description", "Actor / Role"].map(
      (t, i) =>
        new TableCell({
          borders: cellBorders,
          shading: { type: ShadingType.SOLID, color: "1E3A5F", fill: "1E3A5F" },
          width: { size: [8, 36, 36, 20][i], type: WidthType.PERCENTAGE },
          children: [
            new Paragraph({
              children: [new TextRun({ text: t, bold: true, color: "FFFFFF", size: 20 })]
            })
          ]
        })
    )
  });

  const dataRows = rows.map((r, idx) =>
    new TableRow({
      children: [r.step ?? String(idx + 1), r.action, r.description, r.actor].map(
        (val, ci) =>
          new TableCell({
            borders: cellBorders,
            shading:
              idx % 2 === 0
                ? { type: ShadingType.SOLID, color: "F0F4F8", fill: "F0F4F8" }
                : undefined,
            width: { size: [8, 36, 36, 20][ci], type: WidthType.PERCENTAGE },
            children: [new Paragraph({ children: [new TextRun({ text: val ?? "", size: 18 })] })]
          })
      )
    })
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [header, ...dataRows]
  });
}

// ─── MODULE DATA ──────────────────────────────────────────────────────────────

const modules = [

  // ── ADMIN ──────────────────────────────────────────────────────────────────
  {
    title: "1. Admin Module",
    subtitle: "System administration, user management, and platform configuration.",
    sections: [
      {
        name: "1.1 User Management",
        rows: [
          { step: "1", action: "Create User Account", description: "Admin creates a new user, enters name, email, and assigns a login password.", actor: "Super Admin" },
          { step: "2", action: "Assign Role", description: "Select a predefined role (e.g. HR Manager, Finance Officer, Procurement Officer).", actor: "Super Admin" },
          { step: "3", action: "Set Module Permissions", description: "Define read/write/approve access for each module.", actor: "Super Admin" },
          { step: "4", action: "Activate Account", description: "User receives credentials and can log in.", actor: "System / User" },
          { step: "5", action: "Deactivate / Suspend User", description: "Admin can deactivate a user to revoke access.", actor: "Super Admin" }
        ]
      },
      {
        name: "1.2 Roles & Permissions",
        rows: [
          { step: "1", action: "Define Role", description: "Create named roles such as Admin, HR Manager, Finance Analyst.", actor: "Super Admin" },
          { step: "2", action: "Set Per-module Access", description: "Grant or restrict read, write, and approval rights per module.", actor: "Super Admin" },
          { step: "3", action: "Assign Role to Users", description: "One or more users are associated with the role.", actor: "Super Admin" },
          { step: "4", action: "Role Propagated", description: "Changes to role permissions apply to all users with that role.", actor: "System" }
        ]
      },
      {
        name: "1.3 Company Setup",
        rows: [
          { step: "1", action: "Company Profile", description: "Enter company name, logo, address, registration number, and contact details.", actor: "Super Admin" },
          { step: "2", action: "Board of Directors", description: "Add board members with titles, signatures, and contact info.", actor: "Super Admin" },
          { step: "3", action: "Financial Configuration", description: "Set fiscal year, base currency, tax rates, and accounting codes.", actor: "Super Admin" },
          { step: "4", action: "Units of Measurement", description: "Define measurement units used across procurement and inventory.", actor: "Super Admin" },
          { step: "5", action: "Project Configuration", description: "Set default project statuses, phase types, and milestone categories.", actor: "Super Admin" }
        ]
      },
      {
        name: "1.4 System Configuration",
        rows: [
          { step: "1", action: "General Settings", description: "Configure date formats, time zone, language, and system preferences.", actor: "Super Admin" },
          { step: "2", action: "Notification Rules", description: "Set up triggers for email and in-app notifications per event type.", actor: "Super Admin" },
          { step: "3", action: "Email Configuration", description: "Configure SMTP settings for outgoing system emails.", actor: "Super Admin" },
          { step: "4", action: "Integrations", description: "Connect third-party tools (e.g. ERP, accounting, payroll systems).", actor: "Super Admin" },
          { step: "5", action: "Issue Types & Change Categories", description: "Define categories for ESS issues and change requests.", actor: "Super Admin" }
        ]
      },
      {
        name: "1.5 Reports & Audit",
        rows: [
          { step: "1", action: "Report Builder", description: "Create custom reports by selecting data source, columns, filters, and grouping.", actor: "Super Admin" },
          { step: "2", action: "Schedule Report", description: "Set automated delivery schedule (daily, weekly, monthly).", actor: "Super Admin" },
          { step: "3", action: "Distribute Report", description: "Report sent to configured recipients via email.", actor: "System" },
          { step: "4", action: "Audit Logs", description: "All user actions are logged with timestamp, module, action, and affected record.", actor: "System" },
          { step: "5", action: "Export Audit Trail", description: "Admin exports audit log for compliance review.", actor: "Super Admin" }
        ]
      }
    ]
  },

  // ── HR ─────────────────────────────────────────────────────────────────────
  {
    title: "2. Human Resources (HR) Module",
    subtitle: "End-to-end management of employees, attendance, payroll, and workforce planning.",
    sections: [
      {
        name: "2.1 Employee Management",
        rows: [
          { step: "1", action: "Create Employee Record", description: "HR enters personal details, role, department, employment type, grade, and salary.", actor: "HR Manager" },
          { step: "2", action: "Assign Department", description: "Link employee to a department (created and managed separately).", actor: "HR Manager" },
          { step: "3", action: "Set Reporting Line", description: "Assign a line manager and grade level to the employee.", actor: "HR Manager" },
          { step: "4", action: "Employee Profile Active", description: "Record becomes visible in the employee directory.", actor: "System" },
          { step: "5", action: "Edit Employee Details", description: "HR can update any field; signature is managed solely by the employee in ESS.", actor: "HR Manager" }
        ]
      },
      {
        name: "2.2 Departments",
        rows: [
          { step: "1", action: "Create Department", description: "HR defines a new department with name, code, and head of department.", actor: "HR Manager" },
          { step: "2", action: "Assign Staff", description: "Employees are assigned to the department during onboarding or update.", actor: "HR Manager" },
          { step: "3", action: "Update Department", description: "Modify department details or reassign head.", actor: "HR Manager" }
        ]
      },
      {
        name: "2.3 Leave Management",
        rows: [
          { step: "1", action: "Configure Leave Types", description: "HR defines leave types (Annual, Sick, Maternity, etc.) with accrual rules.", actor: "HR Manager" },
          { step: "2", action: "Set Leave Balances", description: "Assign entitled days per employee or grade level.", actor: "HR Manager" },
          { step: "3", action: "Employee Submits Leave", description: "Employee raises a leave request in ESS.", actor: "Employee" },
          { step: "4", action: "Approval Routing", description: "Request routed to line manager then HR for final approval.", actor: "Manager / HR" },
          { step: "5", action: "Balance Deducted", description: "Upon approval, leave balance is automatically reduced.", actor: "System" }
        ]
      },
      {
        name: "2.4 Attendance",
        rows: [
          { step: "1", action: "Mark Attendance", description: "Daily attendance logged — present, absent, half-day, or on-leave.", actor: "HR / System" },
          { step: "2", action: "View Attendance Logs", description: "HR reviews attendance records per employee and date range.", actor: "HR Manager" },
          { step: "3", action: "Attendance Reports", description: "Generate summary reports for payroll processing.", actor: "HR Manager" }
        ]
      },
      {
        name: "2.5 Payroll",
        rows: [
          { step: "1", action: "Configure Salary Structure", description: "Define earning and deduction components (basic, HMO, pension, tax).", actor: "HR Manager" },
          { step: "2", action: "Set Payroll Period", description: "Define the pay cycle — monthly, bi-weekly.", actor: "HR Manager" },
          { step: "3", action: "Process Payroll", description: "System calculates net pay based on salary structure, attendance, and leave.", actor: "HR Manager" },
          { step: "4", action: "Review & Approve", description: "Payroll reviewed and approved before payment disbursement.", actor: "HR / Finance" },
          { step: "5", action: "Generate Payslips", description: "Payslips published to individual ESS employee accounts.", actor: "System" }
        ]
      },
      {
        name: "2.6 Workforce & Tasks",
        rows: [
          { step: "1", action: "Workforce Allocation", description: "HR assigns employees to projects or departments based on capacity.", actor: "HR Manager" },
          { step: "2", action: "Assign HR Tasks", description: "HR creates and assigns internal tasks to HR team members.", actor: "HR Manager" },
          { step: "3", action: "Track Task Completion", description: "Tasks tracked through open, in-progress, and completed states.", actor: "HR Manager" },
          { step: "4", action: "HR Reports", description: "Generate workforce, payroll, and headcount reports. Schedule via Report Automation.", actor: "HR Manager" }
        ]
      }
    ]
  },

  // ── ESS ────────────────────────────────────────────────────────────────────
  {
    title: "3. Employee Self-Service (ESS) Module",
    subtitle: "Employee portal for submitting requests, tracking approvals, and managing personal information.",
    sections: [
      {
        name: "3.1 My Profile & Signature",
        rows: [
          { step: "1", action: "View Personal Profile", description: "Employee views their own information (basic info managed by HR).", actor: "Employee" },
          { step: "2", action: "Upload Signature", description: "Employee uploads their personal signature image — only they can set or update it.", actor: "Employee" },
          { step: "3", action: "Download Payslip", description: "Employee downloads payslips from the Payslip History section.", actor: "Employee" }
        ]
      },
      {
        name: "3.2 Material Request",
        rows: [
          { step: "1", action: "Select Request Type", description: "Employee selects 'Material Request' and chooses Material or Service.", actor: "Employee" },
          { step: "2", action: "Fill Request Form", description: "Enter material description, quantity, urgency, and purpose.", actor: "Employee" },
          { step: "3", action: "Attach Documents", description: "Optionally attach supporting files (PDF, images, docs).", actor: "Employee" },
          { step: "4", action: "Submit Request", description: "Request submitted and routed for approval.", actor: "Employee" },
          { step: "5", action: "Approval / Rejection", description: "Line manager and/or procurement team approves or rejects.", actor: "Manager / Procurement" },
          { step: "6", action: "Routed to Procurement", description: "Approved requests feed into Procurement as Purchase Requests.", actor: "System" }
        ]
      },
      {
        name: "3.3 Finance / Expense Request",
        rows: [
          { step: "1", action: "Raise Finance Request", description: "Employee submits a finance or expense request with amount and justification.", actor: "Employee" },
          { step: "2", action: "Attach Receipt", description: "Upload receipt or supporting financial document.", actor: "Employee" },
          { step: "3", action: "Approval Routing", description: "Routed to line manager then Finance for approval.", actor: "Manager / Finance" },
          { step: "4", action: "Payment Processed", description: "Finance reimburses or processes payment upon approval.", actor: "Finance" }
        ]
      },
      {
        name: "3.4 Leave Request",
        rows: [
          { step: "1", action: "Submit Leave Request", description: "Select leave type, dates, and reason.", actor: "Employee" },
          { step: "2", action: "Attach Supporting Docs", description: "Optional: attach medical certificate or other documents.", actor: "Employee" },
          { step: "3", action: "Approval Routing", description: "Goes to line manager, then HR for final approval.", actor: "Manager / HR" },
          { step: "4", action: "Balance Updated", description: "Approved leave deducted from balance; employee notified.", actor: "System" }
        ]
      },
      {
        name: "3.5 Issue Log",
        rows: [
          { step: "1", action: "Log an Issue", description: "Employee logs a workplace issue with type, description, and priority.", actor: "Employee" },
          { step: "2", action: "Attach Evidence", description: "Attach relevant files to support the issue.", actor: "Employee" },
          { step: "3", action: "Assigned for Resolution", description: "Issue routed to the responsible department or person.", actor: "HR / Admin" },
          { step: "4", action: "Issue Resolved & Closed", description: "Issue marked resolved; employee notified.", actor: "HR / Admin" }
        ]
      },
      {
        name: "3.6 Change Request",
        rows: [
          { step: "1", action: "Submit Change Request", description: "Employee requests a change (personal data, role, location, etc.).", actor: "Employee" },
          { step: "2", action: "Attach Documents", description: "Supporting documentation attached if required.", actor: "Employee" },
          { step: "3", action: "Review & Approve", description: "HR reviews the request and approves or rejects.", actor: "HR Manager" },
          { step: "4", action: "Record Updated", description: "Approved changes applied to the employee's record.", actor: "HR / System" }
        ]
      },
      {
        name: "3.7 Appraisal & Activity",
        rows: [
          { step: "1", action: "Performance Appraisal", description: "Employee self-assesses; manager provides rating and comments.", actor: "Employee / Manager" },
          { step: "2", action: "View Activity History", description: "Employee reviews all past requests, approvals, and logged activities.", actor: "Employee" },
          { step: "3", action: "My Projects", description: "Employee views projects they are assigned to.", actor: "Employee" },
          { step: "4", action: "My Tasks", description: "Employee views and updates tasks assigned to them.", actor: "Employee" }
        ]
      }
    ]
  },

  // ── PROCUREMENT ────────────────────────────────────────────────────────────
  {
    title: "4. Procurement Module",
    subtitle: "Full procurement cycle from purchase request to supplier payment.",
    sections: [
      {
        name: "4.1 Supplier Management",
        rows: [
          { step: "1", action: "Add Supplier", description: "Register supplier with name, contact, category, and bank details.", actor: "Procurement Officer" },
          { step: "2", action: "Supplier Compliance", description: "Attach compliance documents (CAC, tax cert, insurance).", actor: "Procurement Officer" },
          { step: "3", action: "Approve Supplier", description: "Approved suppliers are flagged as verified for use in orders.", actor: "Procurement Manager" }
        ]
      },
      {
        name: "4.2 Purchase Request (PR)",
        rows: [
          { step: "1", action: "Receive ESS Request or Raise PR", description: "PR originates from an approved ESS material request or raised directly.", actor: "Procurement / ESS" },
          { step: "2", action: "Review & Approve PR", description: "Procurement manager reviews and approves the purchase request.", actor: "Procurement Manager" },
          { step: "3", action: "Generate RFQ", description: "Request for Quotation sent to selected suppliers.", actor: "Procurement Officer" }
        ]
      },
      {
        name: "4.3 Quotation & Negotiation",
        rows: [
          { step: "1", action: "Receive Quotes", description: "Supplier quotes received and recorded against the RFQ.", actor: "Procurement Officer" },
          { step: "2", action: "Negotiate Per Line Item", description: "For each line item on a quote, the team can open a negotiation round — propose a unit price, and the system calculates the new total.", actor: "Procurement Officer" },
          { step: "3", action: "Record Negotiation Rounds", description: "Multiple rounds of negotiation are tracked per item with counter-offers.", actor: "Procurement Officer" },
          { step: "4", action: "Select Winning Quote", description: "Best quote confirmed and converted to a Purchase Order.", actor: "Procurement Manager" }
        ]
      },
      {
        name: "4.4 Purchase Order (PO)",
        rows: [
          { step: "1", action: "Generate PO", description: "System generates a PO from the accepted quote.", actor: "System" },
          { step: "2", action: "Approve & Send PO", description: "PO reviewed and sent to supplier.", actor: "Procurement Manager" },
          { step: "3", action: "Supplier Confirms Order", description: "Supplier acknowledges the PO.", actor: "Supplier" }
        ]
      },
      {
        name: "4.5 Goods Receipt & Invoice",
        rows: [
          { step: "1", action: "Receive Goods (GRN)", description: "Goods received at site; GRN created with quantities and condition.", actor: "Store / Procurement" },
          { step: "2", action: "Match GRN to PO", description: "System compares delivered quantities to PO.", actor: "System" },
          { step: "3", action: "Raise Purchase Invoice", description: "Invoice raised and matched to the PO and GRN.", actor: "Finance / Procurement" },
          { step: "4", action: "Approve Payment", description: "Invoice approved for payment processing.", actor: "Finance" }
        ]
      },
      {
        name: "4.6 Inventory & Stock",
        rows: [
          { step: "1", action: "Stock Levels", description: "View current inventory levels per material and location.", actor: "Procurement / Store" },
          { step: "2", action: "Stock Movement", description: "Track every stock in/out event with dates and references.", actor: "Store Officer" },
          { step: "3", action: "Material Requests", description: "Internal material requests tracked through procurement workflow.", actor: "Procurement Officer" }
        ]
      }
    ]
  },

  // ── FINANCE ────────────────────────────────────────────────────────────────
  {
    title: "5. Finance Module",
    subtitle: "Financial management including accounting, budgeting, expenses, payroll, and reporting.",
    sections: [
      {
        name: "5.1 Chart of Accounts",
        rows: [
          { step: "1", action: "Create Account", description: "Define GL accounts with code, name, type (asset, liability, income, expense).", actor: "Finance Manager" },
          { step: "2", action: "Structure Account Tree", description: "Organize accounts into parent/child hierarchy.", actor: "Finance Manager" },
          { step: "3", action: "Link to Transactions", description: "Accounts used in all journal entries, expenses, and income posting.", actor: "System" }
        ]
      },
      {
        name: "5.2 Journal Entries",
        rows: [
          { step: "1", action: "Create Journal Entry", description: "Record manual debit and credit entries with narration.", actor: "Finance Officer" },
          { step: "2", action: "Post Entry", description: "Posted entries update the general ledger.", actor: "Finance Officer" },
          { step: "3", action: "Post via Posting Engine", description: "Automated posting engine processes batch or scheduled entries.", actor: "System" },
          { step: "4", action: "Scheduled Posting", description: "Set up recurring entries (e.g. monthly depreciation).", actor: "Finance Officer" }
        ]
      },
      {
        name: "5.3 Expenses & Income",
        rows: [
          { step: "1", action: "Record Expense", description: "Enter expense with category, amount, date, and GL account.", actor: "Finance Officer" },
          { step: "2", action: "Approve Expense", description: "Expenses above threshold require Finance Manager approval.", actor: "Finance Manager" },
          { step: "3", action: "Record Income", description: "Log income entries against income GL accounts.", actor: "Finance Officer" },
          { step: "4", action: "Reconcile Transactions", description: "Match entries in the transaction ledger.", actor: "Finance Officer" }
        ]
      },
      {
        name: "5.4 Budget Management",
        rows: [
          { step: "1", action: "Create Budget", description: "Set annual or periodic budget per department or project.", actor: "Finance Manager" },
          { step: "2", action: "Allocate Budget Lines", description: "Break budget into line items by category.", actor: "Finance Manager" },
          { step: "3", action: "Track Budget vs Actual", description: "Compare actual spend against budget in real time.", actor: "Finance Manager" },
          { step: "4", action: "Budget Alerts", description: "Trigger notifications when spend approaches or exceeds budget.", actor: "System" }
        ]
      },
      {
        name: "5.5 Claims Management",
        rows: [
          { step: "1", action: "Submit Claim", description: "Employee submits a reimbursement or expense claim.", actor: "Employee / ESS" },
          { step: "2", action: "Claim Review", description: "Finance reviews claim and supporting receipts.", actor: "Finance Officer" },
          { step: "3", action: "Approve & Reimburse", description: "Approved claims processed for payment.", actor: "Finance Manager" }
        ]
      },
      {
        name: "5.6 Payroll Integration",
        rows: [
          { step: "1", action: "Receive Payroll Data", description: "HR passes approved payroll to Finance for posting.", actor: "System / HR" },
          { step: "2", action: "Review Payroll Journal", description: "Finance reviews payroll amounts before posting.", actor: "Finance Officer" },
          { step: "3", action: "Post Payroll to GL", description: "Payroll entries posted to the appropriate accounts.", actor: "Finance Officer" },
          { step: "4", action: "Payment Disbursement", description: "Salaries processed through bank transfer or payment system.", actor: "Finance Manager" }
        ]
      },
      {
        name: "5.7 Finance Configuration & Reports",
        rows: [
          { step: "1", action: "Configure Finance Settings", description: "Set fiscal year, currency, tax codes, and approval thresholds.", actor: "Finance Manager" },
          { step: "2", action: "Process Mapping", description: "Define financial process workflows and approval chains.", actor: "Finance Manager" },
          { step: "3", action: "Generate Reports", description: "Produce P&L, Balance Sheet, Cash Flow, and custom reports.", actor: "Finance Manager" }
        ]
      }
    ]
  },

  // ── CONSTRUCTION ───────────────────────────────────────────────────────────
  {
    title: "6. Construction Module",
    subtitle: "End-to-end construction project management from creation to completion.",
    sections: [
      {
        name: "6.1 Project Creation & Setup",
        rows: [
          { step: "1", action: "Create Project", description: "Define project name, type, client, location, start date, and contract value.", actor: "Project Manager" },
          { step: "2", action: "Configure Project", description: "Set phases, milestone categories, and project settings.", actor: "Project Manager" },
          { step: "3", action: "Project Published to Active List", description: "Project appears under Active Projects for team access.", actor: "System" }
        ]
      },
      {
        name: "6.2 Scope & Timeline",
        rows: [
          { step: "1", action: "Define Scope", description: "Document project scope, deliverables, and exclusions.", actor: "Project Manager" },
          { step: "2", action: "Timeline Planning", description: "Create Gantt-style timeline with phases, durations, and dependencies.", actor: "Project Manager" },
          { step: "3", action: "Set Milestones", description: "Define key milestone events with target dates.", actor: "Project Manager" }
        ]
      },
      {
        name: "6.3 Resource Planning",
        rows: [
          { step: "1", action: "Plan Resources", description: "Assign labour, equipment, and material resources to the project.", actor: "Project Manager" },
          { step: "2", action: "Assign Team Members", description: "Link employees from HR workforce to project tasks.", actor: "Project Manager" },
          { step: "3", action: "Allocate Budget to Resources", description: "Set resource budgets aligned to the Finance module.", actor: "Project Manager / Finance" }
        ]
      },
      {
        name: "6.4 Tasks & Time Tracking",
        rows: [
          { step: "1", action: "Create Tasks", description: "Break down work into tasks with assignees, due dates, and priorities.", actor: "Project Manager" },
          { step: "2", action: "Assign Tasks", description: "Team members receive task assignments visible in their ESS My Tasks.", actor: "System" },
          { step: "3", action: "Log Time", description: "Team members log hours spent on tasks.", actor: "Team Member" },
          { step: "4", action: "Track Progress", description: "Project manager reviews completion % per task.", actor: "Project Manager" }
        ]
      },
      {
        name: "6.5 Approvals & Documents",
        rows: [
          { step: "1", action: "Submit for Approval", description: "Project deliverables or change orders submitted for sign-off.", actor: "Project Manager" },
          { step: "2", action: "Review & Approve", description: "Designated approver reviews and approves or rejects.", actor: "Director / PM" },
          { step: "3", action: "Document Management", description: "Upload and manage project documents (drawings, specs, contracts).", actor: "Project Manager" }
        ]
      },
      {
        name: "6.6 Project Completion & Reports",
        rows: [
          { step: "1", action: "Mark Milestones Complete", description: "Confirm milestone completion with date and sign-off.", actor: "Project Manager" },
          { step: "2", action: "Move to Completed", description: "Project moved from Active to Completed Projects list.", actor: "Project Manager" },
          { step: "3", action: "Generate Project Reports", description: "Reports on timeline adherence, resource utilisation, and cost.", actor: "Project Manager" }
        ]
      }
    ]
  },

  // ── STOREFRONT ─────────────────────────────────────────────────────────────
  {
    title: "7. Storefront (Inventory & Store) Module",
    subtitle: "Central material store managing inventory, stock levels, movements, and transfers.",
    sections: [
      {
        name: "7.1 Incoming Requests & Issuance",
        rows: [
          { step: "1", action: "Receive Material Request", description: "Incoming requests from ESS, Procurement, or auto-replenishment trigger.", actor: "Store Officer" },
          { step: "2", action: "Check Stock Level", description: "System checks available quantity against the requested material.", actor: "System" },
          { step: "3", action: "In Stock: Issue Material", description: "Material issued to the requester; stock movement logged.", actor: "Store Officer" },
          { step: "4", action: "Out of Stock: Raise PR", description: "If unavailable, a Purchase Request is automatically raised to Procurement.", actor: "System" }
        ]
      },
      {
        name: "7.2 Stock & Inventory Management",
        rows: [
          { step: "1", action: "All Materials Register", description: "Full catalogue of all materials with descriptions and codes.", actor: "Store Officer" },
          { step: "2", action: "General Store", description: "Browse and manage general store inventory with current quantities.", actor: "Store Officer" },
          { step: "3", action: "Stock Levels", description: "Dashboard showing current, minimum, and maximum stock levels per item.", actor: "Store Officer" },
          { step: "4", action: "Set Reorder Level", description: "Configure minimum quantity triggers for automatic procurement.", actor: "Store Manager" }
        ]
      },
      {
        name: "7.3 Stock Movement",
        rows: [
          { step: "1", action: "Log Movement", description: "Every stock-in (GRN) and stock-out (issue) event is recorded.", actor: "System / Store Officer" },
          { step: "2", action: "Movement Report", description: "View stock movement history filtered by date, material, or project.", actor: "Store Manager" }
        ]
      },
      {
        name: "7.4 Stock Transfer & Project Stores",
        rows: [
          { step: "1", action: "Initiate Transfer", description: "Transfer materials from general store to a specific project store.", actor: "Store Officer" },
          { step: "2", action: "Approve Transfer", description: "Transfer approved by store manager.", actor: "Store Manager" },
          { step: "3", action: "Update Project Store", description: "Receiving project store inventory is updated.", actor: "System" },
          { step: "4", action: "View Project Store", description: "Project team can view materials available at the project site store.", actor: "Project Team" }
        ]
      },
      {
        name: "7.5 Material Returns & Approvals",
        rows: [
          { step: "1", action: "Initiate Return", description: "Unused or surplus materials returned from project site to main store.", actor: "Project Team" },
          { step: "2", action: "Inspect Returned Goods", description: "Store officer inspects condition on return.", actor: "Store Officer" },
          { step: "3", action: "Update Inventory", description: "Returned materials added back to store inventory.", actor: "System" },
          { step: "4", action: "Approval Workflow", description: "Major stock operations routed through approval workflow.", actor: "Store Manager" }
        ]
      }
    ]
  }
];

// ─── BUILD DOCUMENT ───────────────────────────────────────────────────────────

const children = [];

// Cover page
children.push(
  new Paragraph({
    children: [new TextRun({ text: "BuildOS", bold: true, size: 72, color: "1E3A5F" })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 2000 }
  }),
  new Paragraph({
    children: [new TextRun({ text: "Application Process Flowcharts", size: 48, color: "374151" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 }
  }),
  new Paragraph({
    children: [new TextRun({ text: "All Modules — Comprehensive Process Documentation", size: 28, color: "6B7280" })],
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 }
  }),
  new Paragraph({
    children: [new TextRun({ text: `Generated: ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}`, size: 24, color: "9CA3AF" })],
    alignment: AlignmentType.CENTER
  }),
  pageBreak()
);

// Table of contents placeholder
children.push(
  new Paragraph({ text: "Contents", heading: HeadingLevel.HEADING_1, spacing: { before: 200, after: 160 } }),
  ...modules.map((m, i) =>
    new Paragraph({ text: m.title, spacing: { before: 60, after: 60 } })
  ),
  pageBreak()
);

// Sections
for (const mod of modules) {
  children.push(h1(mod.title), body(mod.subtitle));
  for (const sec of mod.sections) {
    children.push(h2(sec.name), flowTable(sec.rows), new Paragraph({ spacing: { after: 160 } }));
  }
  children.push(pageBreak());
}

const doc = new Document({
  creator: "BuildOS",
  title: "BuildOS Application Process Flowcharts",
  description: "Comprehensive process documentation for all BuildOS modules",
  styles: {
    default: {
      document: { run: { font: "Calibri", size: 22 } },
      heading1: { run: { bold: true, size: 36, color: "1E3A5F", font: "Calibri" }, paragraph: { spacing: { before: 360, after: 160 } } },
      heading2: { run: { bold: true, size: 26, color: "374151", font: "Calibri" }, paragraph: { spacing: { before: 240, after: 120 } } }
    }
  },
  sections: [{ children }]
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("BuildOS-Process-Flowcharts.docx", buf);
  console.log("BuildOS-Process-Flowcharts.docx created successfully!");
});
