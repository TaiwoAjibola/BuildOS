const PDFDocument = require("pdfkit");
const fs = require("fs");

const doc = new PDFDocument({ size: "A4", margin: 50, bufferPages: true });
doc.pipe(fs.createWriteStream("BuildOS-Process-Flowcharts.pdf"));

// ── Colours ──────────────────────────────────────────────────────────────────
const NAVY   = "#1E3A5F";
const DARK   = "#374151";
const MID    = "#6B7280";
const LIGHT  = "#F0F4F8";
const WHITE  = "#FFFFFF";
const STRIPE = "#E8EEF5";
const ACCENT = "#2563EB";

// ── Helpers ───────────────────────────────────────────────────────────────────
function pageW()   { return doc.page.width  - doc.page.margins.left - doc.page.margins.right; }
function pageH()   { return doc.page.height - doc.page.margins.top  - doc.page.margins.bottom; }
function left()    { return doc.page.margins.left; }
function top()     { return doc.page.margins.top; }
function bottom()  { return doc.page.height - doc.page.margins.bottom; }

function safeY(needed = 40) {
  if (doc.y + needed > bottom() - 10) {
    doc.addPage();
  }
}

// ── Cover Page ────────────────────────────────────────────────────────────────
// Full navy background
doc.rect(0, 0, doc.page.width, doc.page.height).fill(NAVY);

// Decorative band
doc.rect(0, doc.page.height * 0.58, doc.page.width, 6).fill(ACCENT);

// Logo text
doc.font("Helvetica-Bold").fontSize(64).fillColor(WHITE)
   .text("BuildOS", left(), doc.page.height * 0.32, { align: "center", width: pageW() });

doc.font("Helvetica").fontSize(22).fillColor("#93C5FD")
   .text("Application Process Documentation", left(), doc.page.height * 0.48, { align: "center", width: pageW() });

doc.font("Helvetica").fontSize(14).fillColor("#CBD5E1")
   .text("Comprehensive process flowcharts for all modules", left(), doc.page.height * 0.56, { align: "center", width: pageW() });

doc.rect(left() + 80, doc.page.height * 0.63, pageW() - 160, 1).fill("#334155");

const modules_listed = [
  "1. Admin", "2. Human Resources (HR)", "3. Employee Self-Service (ESS)",
  "4. Procurement", "5. Finance", "6. Construction", "7. Storefront"
];
doc.font("Helvetica").fontSize(12).fillColor("#94A3B8");
let listY = doc.page.height * 0.66;
modules_listed.forEach(m => {
  doc.text(m, left(), listY, { align: "center", width: pageW() });
  listY += 22;
});

doc.font("Helvetica").fontSize(10).fillColor("#64748B")
   .text(
     `Generated: ${new Date().toLocaleDateString("en-GB", { year:"numeric", month:"long", day:"numeric" })}`,
     left(), doc.page.height * 0.90, { align: "center", width: pageW() }
   );

// ── Section helpers ───────────────────────────────────────────────────────────

function moduleHeader(title, subtitle) {
  doc.addPage();
  // Full-width navy band
  doc.rect(0, 0, doc.page.width, 110).fill(NAVY);
  doc.font("Helvetica-Bold").fontSize(26).fillColor(WHITE)
     .text(title, left(), 28, { width: pageW() });
  doc.font("Helvetica").fontSize(11).fillColor("#93C5FD")
     .text(subtitle, left(), 66, { width: pageW() });
  doc.y = 130;
}

function sectionTitle(name) {
  safeY(50);
  const y = doc.y;
  doc.rect(left(), y, pageW(), 28).fill(ACCENT);
  doc.rect(left(), y + 27, pageW(), 2).fill("#1D4ED8");
  doc.font("Helvetica-Bold").fontSize(12).fillColor(WHITE)
     .text(name, left() + 10, y + 7, { width: pageW() - 20 });
  doc.y = y + 36;
}

// Draw the 4-column process table
function processTable(rows) {
  const cols = [
    { label: "Step",             pct: 0.06 },
    { label: "Process / Action", pct: 0.28 },
    { label: "Description",      pct: 0.46 },
    { label: "Actor / Role",     pct: 0.20 },
  ];
  const totalW = pageW();
  const colWidths = cols.map(c => totalW * c.pct);
  const rowH = 14;          // minimum row height
  const pad = 5;
  const fontSize = 9;

  // Helper: measure text height in a column
  function cellH(text, w) {
    return doc.heightOfString(text, { width: w - pad * 2, fontSize }) + pad * 2;
  }

  // Draw header
  function drawHeader(x, y) {
    let cx = x;
    const hH = 22;
    doc.rect(x, y, totalW, hH).fill(NAVY);
    cols.forEach((col, i) => {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(WHITE)
         .text(col.label, cx + pad, y + 6, { width: colWidths[i] - pad * 2, lineBreak: false });
      cx += colWidths[i];
    });
    return y + hH;
  }

  let y = doc.y;
  let headerY = drawHeader(left(), y);
  y = headerY;

  rows.forEach((row, idx) => {
    const cells = [row.step ?? String(idx + 1), row.action, row.description, row.actor];
    // Measure tallest cell
    doc.font("Helvetica").fontSize(fontSize);
    const heights = cells.map((t, i) => cellH(t, colWidths[i]));
    const rH = Math.max(...heights, rowH);

    // Page break check
    if (y + rH > bottom() - 10) {
      doc.addPage();
      y = top();
      headerY = drawHeader(left(), y);
      y = headerY;
    }

    // Row background
    const bg = idx % 2 === 0 ? LIGHT : WHITE;
    doc.rect(left(), y, totalW, rH).fill(bg);

    // Cell borders (right edges)
    let cx = left();
    colWidths.forEach((cw, ci) => {
      if (ci < colWidths.length - 1) {
        doc.moveTo(cx + cw, y).lineTo(cx + cw, y + rH).stroke("#D1D5DB");
      }
      cx += cw;
    });
    // Bottom border
    doc.moveTo(left(), y + rH).lineTo(left() + totalW, y + rH).stroke("#D1D5DB");
    // Left and right outer borders
    doc.moveTo(left(), y).lineTo(left(), y + rH).stroke("#D1D5DB");
    doc.moveTo(left() + totalW, y).lineTo(left() + totalW, y + rH).stroke("#D1D5DB");

    // Cell text
    cx = left();
    cells.forEach((text, ci) => {
      const isStep = ci === 0;
      doc.font(isStep ? "Helvetica-Bold" : "Helvetica")
         .fontSize(fontSize)
         .fillColor(isStep ? ACCENT : DARK)
         .text(text, cx + pad, y + pad, { width: colWidths[ci] - pad * 2 });
      cx += colWidths[ci];
    });

    y += rH;
  });

  doc.y = y + 16;
}

// ── MODULE DATA ───────────────────────────────────────────────────────────────

const modules = [
  {
    title: "1. Admin Module",
    subtitle: "System administration, user management, roles, and platform configuration.",
    sections: [
      {
        name: "1.1 User Management",
        rows: [
          { step:"1", action:"Create User Account",      description:"Admin creates a new user — enters name, email, and assigns login credentials.",          actor:"Super Admin" },
          { step:"2", action:"Assign Role",               description:"Select a predefined role (e.g. HR Manager, Finance Officer, Procurement Officer).",      actor:"Super Admin" },
          { step:"3", action:"Set Module Permissions",    description:"Define read / write / approve access per module for the user.",                          actor:"Super Admin" },
          { step:"4", action:"Activate Account",          description:"User receives credentials and gains access to assigned modules.",                         actor:"System / User" },
          { step:"5", action:"Deactivate / Suspend User", description:"Admin revokes access by deactivating or suspending the account.",                        actor:"Super Admin" },
        ]
      },
      {
        name: "1.2 Roles & Permissions",
        rows: [
          { step:"1", action:"Define Role",              description:"Create named roles such as Admin, HR Manager, Finance Analyst.",                            actor:"Super Admin" },
          { step:"2", action:"Set Per-module Access",    description:"Grant or restrict read, write, and approval rights per module.",                           actor:"Super Admin" },
          { step:"3", action:"Assign Role to Users",     description:"One or more users associated with the role.",                                               actor:"Super Admin" },
          { step:"4", action:"Role Changes Propagated",  description:"Any update to role permissions applies automatically to all assigned users.",              actor:"System" },
        ]
      },
      {
        name: "1.3 Company Setup",
        rows: [
          { step:"1", action:"Company Profile",          description:"Enter company name, logo, address, registration number, and contact details.",             actor:"Super Admin" },
          { step:"2", action:"Board of Directors",       description:"Add board members with titles, signatures, and contact information.",                      actor:"Super Admin" },
          { step:"3", action:"Financial Configuration",  description:"Set fiscal year, base currency, tax rates, and accounting code structure.",               actor:"Super Admin" },
          { step:"4", action:"Units of Measurement",     description:"Define units used across procurement and inventory (kg, litres, m³, etc.).",              actor:"Super Admin" },
          { step:"5", action:"Project Configuration",    description:"Set default project statuses, phase types, and milestone categories.",                    actor:"Super Admin" },
        ]
      },
      {
        name: "1.4 System Configuration",
        rows: [
          { step:"1", action:"General Settings",         description:"Configure date formats, time zone, language, and system-wide preferences.",               actor:"Super Admin" },
          { step:"2", action:"Notification Rules",       description:"Set up email and in-app notification triggers per event type.",                           actor:"Super Admin" },
          { step:"3", action:"Email Configuration",      description:"Configure SMTP settings for outgoing system emails.",                                      actor:"Super Admin" },
          { step:"4", action:"Integrations",             description:"Connect third-party tools — ERP systems, payroll, accounting software.",                  actor:"Super Admin" },
          { step:"5", action:"Issue Types & Change Categories", description:"Define categories for ESS issues and change request submissions.",                 actor:"Super Admin" },
        ]
      },
      {
        name: "1.5 Reports & Audit Logs",
        rows: [
          { step:"1", action:"Report Builder",           description:"Create custom reports — select data source, columns, filters, and grouping.",              actor:"Super Admin" },
          { step:"2", action:"Schedule Report",          description:"Set automated delivery schedule (daily, weekly, monthly).",                                actor:"Super Admin" },
          { step:"3", action:"Distribute Report",        description:"Scheduled report automatically sent to configured recipients via email.",                  actor:"System" },
          { step:"4", action:"Audit Logs",               description:"All user actions are logged with timestamp, module, action type, and affected record.",   actor:"System" },
          { step:"5", action:"Export Audit Trail",       description:"Admin exports audit log for compliance or investigation.",                                  actor:"Super Admin" },
        ]
      },
    ]
  },

  {
    title: "2. Human Resources (HR) Module",
    subtitle: "Full employee lifecycle management — from onboarding to payroll and workforce planning.",
    sections: [
      {
        name: "2.1 Employee Management",
        rows: [
          { step:"1", action:"Create Employee Record",   description:"HR enters personal details, role, department, employment type, grade level, and salary.", actor:"HR Manager" },
          { step:"2", action:"Assign Department",        description:"Link employee to a department. Departments are managed separately.",                      actor:"HR Manager" },
          { step:"3", action:"Set Reporting Line",       description:"Assign a direct line manager and grade level.",                                            actor:"HR Manager" },
          { step:"4", action:"Profile Goes Live",        description:"Employee record appears in directory; an ESS account is created.",                        actor:"System" },
          { step:"5", action:"Edit Employee Details",    description:"HR can update all fields. The employee's signature is managed only by the employee via ESS.", actor:"HR Manager" },
          { step:"6", action:"View Employee Profile",    description:"Full profile view including employment history, leave balance, and attached documents.",   actor:"HR Manager" },
        ]
      },
      {
        name: "2.2 Departments",
        rows: [
          { step:"1", action:"Create Department",        description:"Define a department with name, code, and head of department.",                             actor:"HR Manager" },
          { step:"2", action:"Assign Employees",         description:"Employees linked to departments during onboarding or via record update.",                 actor:"HR Manager" },
          { step:"3", action:"Update Department",        description:"Modify department name, code, or reassign the department head.",                          actor:"HR Manager" },
        ]
      },
      {
        name: "2.3 Roles (HR Roles)",
        rows: [
          { step:"1", action:"Define Job Roles",         description:"Create job role titles used within the HR system (separate from system access roles).",   actor:"HR Manager" },
          { step:"2", action:"Assign Role to Employees", description:"Each employee assigned a job role from the HR roles register.",                           actor:"HR Manager" },
        ]
      },
      {
        name: "2.4 Leave Management",
        rows: [
          { step:"1", action:"Configure Leave Types",    description:"Define leave types — Annual, Sick, Maternity, etc. — with accrual rules and entitlements.", actor:"HR Manager" },
          { step:"2", action:"Set Leave Balances",       description:"Assign entitled leave days per employee or grade level.",                                 actor:"HR Manager" },
          { step:"3", action:"Employee Submits Leave",   description:"Employee raises leave request in ESS portal.",                                             actor:"Employee" },
          { step:"4", action:"Approval Routing",         description:"Request routed to line manager, then HR for final approval.",                              actor:"Manager / HR" },
          { step:"5", action:"Balance Deducted",         description:"Approved leave automatically deducted from the employee's balance.",                      actor:"System" },
          { step:"6", action:"View Leave Requests",      description:"HR views all pending and historical leave requests with full audit trail.",               actor:"HR Manager" },
        ]
      },
      {
        name: "2.5 Attendance",
        rows: [
          { step:"1", action:"Mark Attendance",          description:"Daily attendance recorded — Present, Absent, Half-Day, On Leave.",                       actor:"HR / System" },
          { step:"2", action:"View Attendance Logs",     description:"HR reviews per-employee attendance records filtered by date range.",                     actor:"HR Manager" },
          { step:"3", action:"Base Calendar",            description:"Configure the working calendar — public holidays, weekends, work hours.",                actor:"HR Manager" },
          { step:"4", action:"Attendance Reports",       description:"Generate attendance summaries for payroll processing and compliance.",                   actor:"HR Manager" },
        ]
      },
      {
        name: "2.6 Payroll",
        rows: [
          { step:"1", action:"Configure Salary Structure", description:"Define earning and deduction components — basic salary, HMO, pension, tax, bonuses.", actor:"HR Manager" },
          { step:"2", action:"Set Payroll Period",        description:"Define the pay cycle — monthly, bi-weekly — and payroll cut-off dates.",              actor:"HR Manager" },
          { step:"3", action:"Process Payroll",           description:"System calculates net pay per employee based on salary structure, attendance, and leave deductions.", actor:"HR Manager" },
          { step:"4", action:"Review & Approve",          description:"Payroll reviewed by Finance before final approval and disbursement.",                   actor:"HR / Finance" },
          { step:"5", action:"Generate & Publish Payslips", description:"Payslips published to each employee's ESS account.",                                actor:"System" },
          { step:"6", action:"Claim Type Setup",          description:"Configure allowable claim types (mileage, accommodation, meals) for employee reimbursements.", actor:"HR Manager" },
        ]
      },
      {
        name: "2.7 Workforce & Tasks",
        rows: [
          { step:"1", action:"Workforce Allocation",     description:"HR assigns employees to projects or departments based on capacity.",                     actor:"HR Manager" },
          { step:"2", action:"Create HR Tasks",          description:"HR creates and assigns internal tasks to HR team members.",                               actor:"HR Manager" },
          { step:"3", action:"Track Tasks",              description:"Tasks tracked through Open → In Progress → Completed states.",                           actor:"HR Team" },
          { step:"4", action:"HR Reports",               description:"Generate headcount, payroll summary, and workforce utilisation reports.",                actor:"HR Manager" },
          { step:"5", action:"Report Automation",        description:"Schedule automated HR reports for recurring delivery via email.",                        actor:"HR Manager" },
        ]
      },
      {
        name: "2.8 HR Approvals",
        rows: [
          { step:"1", action:"Pending Approvals Inbox",  description:"HR manager sees all requests pending their action — leave, change requests, tasks.",    actor:"HR Manager" },
          { step:"2", action:"Review Request",           description:"Open request and review submitted details and attachments.",                              actor:"HR Manager" },
          { step:"3", action:"Approve / Reject",         description:"Approve or reject with comments; employee and originator notified.",                    actor:"HR Manager" },
        ]
      },
    ]
  },

  {
    title: "3. Employee Self-Service (ESS) Module",
    subtitle: "Employee portal for requests, approvals, personal profile, and task management.",
    sections: [
      {
        name: "3.1 My Profile & Signature",
        rows: [
          { step:"1", action:"View Profile",             description:"Employee views their personal information. Basic info is managed by HR.",                actor:"Employee" },
          { step:"2", action:"Upload Signature",         description:"Employee uploads their digital signature — only the employee can set or update this.",  actor:"Employee" },
          { step:"3", action:"View Payslip History",     description:"Employee downloads current and previous payslips.",                                       actor:"Employee" },
        ]
      },
      {
        name: "3.2 Material Request",
        rows: [
          { step:"1", action:"Select Request Type",      description:"Employee selects 'Material Request' and chooses Material or Service sub-type.",          actor:"Employee" },
          { step:"2", action:"Fill Request Form",        description:"Enter material description, quantity, unit, urgency level, and purpose.",                actor:"Employee" },
          { step:"3", action:"Attach Documents",         description:"Optionally attach supporting files — PDFs, images, Word documents.",                    actor:"Employee" },
          { step:"4", action:"Submit Request",           description:"Request submitted and routed through the approval workflow.",                             actor:"Employee" },
          { step:"5", action:"Approval / Rejection",     description:"Line manager and/or procurement team approves or rejects the request.",                  actor:"Manager / Procurement" },
          { step:"6", action:"Routed to Procurement",    description:"Approved requests automatically create a Purchase Request in Procurement.",             actor:"System" },
        ]
      },
      {
        name: "3.3 Finance / Expense Request",
        rows: [
          { step:"1", action:"Raise Finance Request",    description:"Employee submits a finance or expense request with amount, category, and justification.", actor:"Employee" },
          { step:"2", action:"Attach Receipt",           description:"Upload receipt or supporting financial document.",                                        actor:"Employee" },
          { step:"3", action:"Approval Routing",         description:"Routed to line manager then Finance department for approval.",                           actor:"Manager / Finance" },
          { step:"4", action:"Payment Processed",        description:"Finance processes reimbursement or payment upon approval.",                              actor:"Finance" },
        ]
      },
      {
        name: "3.4 Leave Request",
        rows: [
          { step:"1", action:"Submit Leave Request",     description:"Employee selects leave type, start/end dates, and provides a reason.",                   actor:"Employee" },
          { step:"2", action:"Attach Documents",         description:"Optional: attach medical certificate or other supporting documents.",                    actor:"Employee" },
          { step:"3", action:"Approval Routing",         description:"Goes to line manager first, then HR for final approval.",                                actor:"Manager / HR" },
          { step:"4", action:"Balance Updated",          description:"Approved leave deducted from balance; employee receives notification.",                  actor:"System" },
        ]
      },
      {
        name: "3.5 Issue Log",
        rows: [
          { step:"1", action:"Log an Issue",             description:"Employee logs a workplace issue with issue type, description, and priority level.",       actor:"Employee" },
          { step:"2", action:"Attach Evidence",          description:"Attach relevant files, screenshots, or documents to support the issue.",                 actor:"Employee" },
          { step:"3", action:"Routed for Resolution",    description:"Issue assigned to the responsible department (HR, Admin, etc.).",                       actor:"HR / Admin" },
          { step:"4", action:"Issue Resolved & Closed",  description:"Issue marked as resolved; employee notified with resolution details.",                  actor:"HR / Admin" },
        ]
      },
      {
        name: "3.6 Change Request",
        rows: [
          { step:"1", action:"Submit Change Request",    description:"Employee requests a change to personal data, role, work location, etc.",                 actor:"Employee" },
          { step:"2", action:"Attach Documents",         description:"Supporting documentation attached if required.",                                          actor:"Employee" },
          { step:"3", action:"Review & Approve",         description:"HR reviews the request and approves or rejects with comments.",                          actor:"HR Manager" },
          { step:"4", action:"Record Updated",           description:"Approved changes are applied to the employee's HR record.",                              actor:"HR / System" },
        ]
      },
      {
        name: "3.7 Appraisal, Tasks & Projects",
        rows: [
          { step:"1", action:"Performance Appraisal",   description:"Employee completes self-assessment; manager provides rating and written feedback.",      actor:"Employee / Manager" },
          { step:"2", action:"My Tasks",                 description:"Employee views and updates tasks assigned to them across all modules.",                  actor:"Employee" },
          { step:"3", action:"My Projects",              description:"Employee views all projects they are assigned to.",                                       actor:"Employee" },
          { step:"4", action:"Activity History",         description:"Full history of all requests submitted, approvals received, and actions taken.",        actor:"Employee" },
        ]
      },
    ]
  },

  {
    title: "4. Procurement Module",
    subtitle: "Full procurement cycle — from purchase request to supplier payment and inventory management.",
    sections: [
      {
        name: "4.1 Supplier Management",
        rows: [
          { step:"1", action:"Add Supplier",             description:"Register supplier with name, contact details, category, and bank account details.",      actor:"Procurement Officer" },
          { step:"2", action:"Supplier Compliance",      description:"Attach compliance documents — CAC certificate, tax clearance, insurance.",              actor:"Procurement Officer" },
          { step:"3", action:"Approve Supplier",         description:"Approved suppliers flagged as verified and available for use in purchase orders.",        actor:"Procurement Manager" },
        ]
      },
      {
        name: "4.2 Purchase Request (PR)",
        rows: [
          { step:"1", action:"Receive or Raise PR",      description:"PR originates from an approved ESS material request or is raised directly.",            actor:"Procurement / ESS" },
          { step:"2", action:"Review & Approve PR",      description:"Procurement manager reviews and approves the purchase request.",                         actor:"Procurement Manager" },
          { step:"3", action:"Generate RFQ",             description:"Request for Quotation created and sent to selected/invited suppliers.",                  actor:"Procurement Officer" },
        ]
      },
      {
        name: "4.3 Quotation Management",
        rows: [
          { step:"1", action:"Receive Supplier Quotes",  description:"Quotes received from suppliers and recorded against the RFQ line items.",               actor:"Procurement Officer" },
          { step:"2", action:"Expand Line Items",        description:"Each quote displays itemised line items with quantity, unit price, and total.",          actor:"Procurement Officer" },
          { step:"3", action:"Negotiate Per Line Item",  description:"For each line item, open a negotiation — propose a new unit price; system recalculates total.", actor:"Procurement Officer" },
          { step:"4", action:"Track Negotiation Rounds", description:"Multiple rounds of negotiation captured per item with all counter-offers recorded.",    actor:"Procurement Officer" },
          { step:"5", action:"Select Winning Quote",     description:"Best overall quote confirmed; converted to a Purchase Order.",                          actor:"Procurement Manager" },
        ]
      },
      {
        name: "4.4 Purchase Order (PO)",
        rows: [
          { step:"1", action:"Generate PO",              description:"System generates the PO from the accepted and negotiated quote.",                        actor:"System" },
          { step:"2", action:"Approve & Issue PO",       description:"PO reviewed, approved, and issued to the supplier.",                                    actor:"Procurement Manager" },
          { step:"3", action:"Supplier Acknowledgement", description:"Supplier confirms receipt and acceptance of the PO.",                                    actor:"Supplier" },
        ]
      },
      {
        name: "4.5 Goods Receipt & Invoice (GRN)",
        rows: [
          { step:"1", action:"Receive Goods (GRN)",      description:"Goods delivered to site; GRN created with received quantities and condition notes.",    actor:"Store / Procurement" },
          { step:"2", action:"Match GRN to PO",          description:"System compares received quantities to PO quantities and flags discrepancies.",         actor:"System" },
          { step:"3", action:"Raise Purchase Invoice",   description:"Invoice raised and matched against the PO and GRN.",                                    actor:"Finance / Procurement" },
          { step:"4", action:"Approve for Payment",      description:"Invoice approved and passed to Finance for payment disbursement.",                      actor:"Finance" },
        ]
      },
      {
        name: "4.6 Inventory & Stock",
        rows: [
          { step:"1", action:"Monitor Stock Levels",     description:"View current inventory quantities per material, location, and project.",                actor:"Procurement / Store" },
          { step:"2", action:"Stock Movement Log",       description:"Track every stock-in and stock-out event with date, quantity, and reference.",         actor:"Store Officer" },
          { step:"3", action:"Manage Material Requests", description:"Internal requests from departments tracked through the procurement workflow.",          actor:"Procurement Officer" },
        ]
      },
    ]
  },

  {
    title: "5. Finance Module",
    subtitle: "Financial management — accounting, budgets, expenses, payroll posting, and reporting.",
    sections: [
      {
        name: "5.1 Chart of Accounts",
        rows: [
          { step:"1", action:"Create GL Account",        description:"Define accounts with code, name, and type — asset, liability, income, or expense.",     actor:"Finance Manager" },
          { step:"2", action:"Build Account Hierarchy",  description:"Organise accounts in a parent/child tree structure.",                                   actor:"Finance Manager" },
          { step:"3", action:"Link to Transactions",     description:"All journal entries, expenses, and income automatically posted to GL accounts.",       actor:"System" },
        ]
      },
      {
        name: "5.2 Journal Entries & Posting",
        rows: [
          { step:"1", action:"Create Journal Entry",     description:"Record manual debit and credit entries with narration and reference.",                  actor:"Finance Officer" },
          { step:"2", action:"Post Entry",               description:"Posted entries update the general ledger immediately.",                                  actor:"Finance Officer" },
          { step:"3", action:"Posting Engine",           description:"Automated posting engine processes batch entries and applies posting rules.",            actor:"System" },
          { step:"4", action:"Scheduled Posting",        description:"Set up recurring entries — e.g. monthly depreciation, amortisation.",                  actor:"Finance Officer" },
        ]
      },
      {
        name: "5.3 Expenses & Income",
        rows: [
          { step:"1", action:"Record Expense",           description:"Enter expense with category, amount, date, vendor, and GL account.",                    actor:"Finance Officer" },
          { step:"2", action:"Approve Expense",          description:"Expenses above threshold require Finance Manager approval before posting.",             actor:"Finance Manager" },
          { step:"3", action:"Record Income",            description:"Log income entries against income GL accounts with supporting details.",                actor:"Finance Officer" },
          { step:"4", action:"Reconcile Ledger",         description:"Match and reconcile all entries in the transactions ledger.",                           actor:"Finance Officer" },
        ]
      },
      {
        name: "5.4 Budget Management",
        rows: [
          { step:"1", action:"Create Budget",            description:"Set annual or periodic budgets per department or project.",                              actor:"Finance Manager" },
          { step:"2", action:"Allocate Budget Lines",    description:"Break budgets into line items by expense category.",                                    actor:"Finance Manager" },
          { step:"3", action:"Track Budget vs Actual",   description:"Real-time comparison of actual spend vs. approved budget.",                            actor:"Finance Manager" },
          { step:"4", action:"Budget Tracking Alerts",   description:"Automated alerts triggered when spend approaches or exceeds budget limits.",            actor:"System" },
        ]
      },
      {
        name: "5.5 Claims Management",
        rows: [
          { step:"1", action:"Submit Claim",             description:"Employee submits a reimbursement or expense claim via ESS.",                            actor:"Employee" },
          { step:"2", action:"Finance Review",           description:"Finance officer reviews claim details and supporting receipts.",                        actor:"Finance Officer" },
          { step:"3", action:"Approve & Reimburse",      description:"Approved claims processed for bank payment or cash reimbursement.",                    actor:"Finance Manager" },
        ]
      },
      {
        name: "5.6 Payroll Integration",
        rows: [
          { step:"1", action:"Receive Approved Payroll", description:"HR passes approved payroll run data to Finance for journal posting.",                   actor:"System / HR" },
          { step:"2", action:"Review Payroll Journal",   description:"Finance verifies payroll amounts, deductions, and employee count.",                    actor:"Finance Officer" },
          { step:"3", action:"Post to General Ledger",   description:"Payroll entries posted to salary expense and liability accounts.",                     actor:"Finance Officer" },
          { step:"4", action:"Payment Disbursement",     description:"Net salaries disbursed via bank transfer or integrated payment system.",              actor:"Finance Manager" },
        ]
      },
      {
        name: "5.7 Finance Configuration & Reports",
        rows: [
          { step:"1", action:"Finance Configuration",    description:"Set fiscal year, base currency, tax codes, and approval thresholds.",                  actor:"Finance Manager" },
          { step:"2", action:"Process Mapping",          description:"Define financial process workflows and multi-level approval chains.",                  actor:"Finance Manager" },
          { step:"3", action:"Payment Management",       description:"Manage outgoing payment batches and supplier settlements.",                             actor:"Finance Officer" },
          { step:"4", action:"Generate Reports",         description:"Produce P&L, Balance Sheet, Cash Flow, and custom financial reports.",                actor:"Finance Manager" },
        ]
      },
    ]
  },

  {
    title: "6. Construction Module",
    subtitle: "End-to-end construction project management — planning, execution, and reporting.",
    sections: [
      {
        name: "6.1 Project Creation",
        rows: [
          { step:"1", action:"Create Project",           description:"Define project name, type, client, location, start date, and contract value.",          actor:"Project Manager" },
          { step:"2", action:"Configure Project",        description:"Set project phases, milestone categories, and document requirements.",                  actor:"Project Manager" },
          { step:"3", action:"Project Goes Live",        description:"Project listed under Active Projects and accessible to the assigned team.",             actor:"System" },
        ]
      },
      {
        name: "6.2 Scope & Timeline Planning",
        rows: [
          { step:"1", action:"Define Project Scope",     description:"Document deliverables, boundaries, and exclusions for the project.",                   actor:"Project Manager" },
          { step:"2", action:"Build Timeline",           description:"Create a Gantt-style timeline with phases, durations, and task dependencies.",         actor:"Project Manager" },
          { step:"3", action:"Set Milestones",           description:"Define key milestone events with target completion dates.",                             actor:"Project Manager" },
        ]
      },
      {
        name: "6.3 Resource Planning",
        rows: [
          { step:"1", action:"Plan Resources",           description:"Assign labour, equipment, and materials to the project resource plan.",                actor:"Project Manager" },
          { step:"2", action:"Assign Team Members",      description:"Link employees from the HR workforce to the project and its specific tasks.",          actor:"Project Manager" },
          { step:"3", action:"Budget Allocation",        description:"Set resource budgets aligned with approved Finance module budgets.",                   actor:"PM / Finance" },
        ]
      },
      {
        name: "6.4 Tasks & Time Tracking",
        rows: [
          { step:"1", action:"Create Tasks",             description:"Break work down into tasks with assignees, due dates, and priority levels.",           actor:"Project Manager" },
          { step:"2", action:"Assign Tasks",             description:"Assigned team members see tasks in their ESS My Tasks view.",                          actor:"System" },
          { step:"3", action:"Log Time",                 description:"Team members log hours spent on each task.",                                            actor:"Team Member" },
          { step:"4", action:"Track Progress",           description:"Project manager reviews completion percentage per task and per phase.",                actor:"Project Manager" },
        ]
      },
      {
        name: "6.5 Approvals & Document Management",
        rows: [
          { step:"1", action:"Submit for Approval",      description:"Deliverables, change orders, or milestone sign-offs submitted for review.",            actor:"Project Manager" },
          { step:"2", action:"Review & Approve",         description:"Designated approver reviews and approves or rejects with comments.",                   actor:"Director / Senior PM" },
          { step:"3", action:"Document Management",      description:"Upload and version-control project documents — drawings, specs, contracts.",           actor:"Project Manager" },
        ]
      },
      {
        name: "6.6 Completion & Reports",
        rows: [
          { step:"1", action:"Mark Milestones Complete", description:"Confirm milestone completion with date and formal sign-off.",                           actor:"Project Manager" },
          { step:"2", action:"Move to Completed",        description:"Project moved from Active to Completed Projects once all milestones are signed off.",  actor:"Project Manager" },
          { step:"3", action:"Project Reports",          description:"Generate reports on timeline adherence, resource utilisation, and cost vs. budget.",  actor:"Project Manager" },
        ]
      },
    ]
  },

  {
    title: "7. Storefront (Inventory & Store) Module",
    subtitle: "Central material store managing inventory, stock movements, transfers, and returns.",
    sections: [
      {
        name: "7.1 Incoming Requests & Issuance",
        rows: [
          { step:"1", action:"Receive Material Request", description:"Requests arrive from ESS, Procurement, or automatic reorder triggers.",               actor:"Store Officer" },
          { step:"2", action:"Check Stock Level",        description:"System checks available quantity against the requested item.",                         actor:"System" },
          { step:"3", action:"In Stock — Issue Material", description:"Material issued to the requester; stock movement automatically logged.",             actor:"Store Officer" },
          { step:"4", action:"Out of Stock — Raise PR",  description:"If unavailable, a Purchase Request is automatically raised to Procurement.",          actor:"System" },
        ]
      },
      {
        name: "7.2 Inventory Management",
        rows: [
          { step:"1", action:"All Materials Register",   description:"Full catalogue of all materials with descriptions, codes, and unit of measure.",      actor:"Store Officer" },
          { step:"2", action:"General Store",            description:"Browse and manage general store inventory with current on-hand quantities.",           actor:"Store Officer" },
          { step:"3", action:"Stock Levels Dashboard",   description:"View current, minimum, and maximum stock quantities per material.",                   actor:"Store Manager" },
          { step:"4", action:"Set Reorder Level",        description:"Configure minimum stock threshold — triggers automatic procurement when breached.",   actor:"Store Manager" },
        ]
      },
      {
        name: "7.3 Stock Movement",
        rows: [
          { step:"1", action:"Log Every Movement",       description:"Every stock-in (from GRN) and stock-out (issuance) event is recorded with date and reference.", actor:"System" },
          { step:"2", action:"Movement Reports",         description:"View stock movement history filtered by date, material, project, or store location.", actor:"Store Manager" },
        ]
      },
      {
        name: "7.4 Stock Transfer & Project Stores",
        rows: [
          { step:"1", action:"Initiate Transfer",        description:"Transfer materials from general store to a specific project site store.",             actor:"Store Officer" },
          { step:"2", action:"Approve Transfer",         description:"Store manager approves the transfer request before stock is moved.",                   actor:"Store Manager" },
          { step:"3", action:"Update Project Store",     description:"Receiving project store inventory updated automatically upon approval.",              actor:"System" },
          { step:"4", action:"View Project Store",       description:"Project team views materials currently available at their site store.",                actor:"Project Team" },
        ]
      },
      {
        name: "7.5 Material Returns",
        rows: [
          { step:"1", action:"Initiate Return",          description:"Unused or surplus materials returned from project site to the main store.",           actor:"Project Team" },
          { step:"2", action:"Inspect Returned Goods",   description:"Store officer inspects material condition upon return.",                               actor:"Store Officer" },
          { step:"3", action:"Restock Inventory",        description:"Accepted returned materials added back to general store inventory.",                  actor:"System" },
          { step:"4", action:"Approval Workflow",        description:"Large or high-value returns routed through an approval workflow before restocking.",  actor:"Store Manager" },
        ]
      },
      {
        name: "7.6 Storefront Configuration & Reports",
        rows: [
          { step:"1", action:"Configure Store Settings", description:"Set store locations, material categories, and default units of measure.",             actor:"Store Manager" },
          { step:"2", action:"Generate Reports",         description:"Produce inventory valuation, stock movement summary, and consumption reports.",       actor:"Store Manager" },
        ]
      },
    ]
  },
];

// ── RENDER MODULES ────────────────────────────────────────────────────────────

for (const mod of modules) {
  moduleHeader(mod.title, mod.subtitle);
  for (const sec of mod.sections) {
    sectionTitle(sec.name);
    processTable(sec.rows);
  }
}

// ── PAGE NUMBERS ──────────────────────────────────────────────────────────────
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  if (i === 0) continue; // skip cover
  doc.font("Helvetica").fontSize(8).fillColor(MID)
     .text(
       `BuildOS Process Documentation  |  Page ${i + 1} of ${totalPages}`,
       left(), doc.page.height - 36,
       { width: pageW(), align: "center" }
     );
  // Top rule
  doc.moveTo(left(), top() - 15).lineTo(left() + pageW(), top() - 15).stroke("#E5E7EB");
}

doc.end();
doc.on("finish", () => console.log("BuildOS-Process-Flowcharts.pdf created successfully!"));
