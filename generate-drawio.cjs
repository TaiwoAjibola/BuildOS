const zlib = require('zlib');
const fs = require('fs');

let _id = 200;
const uid = () => 'c' + (_id++);

function xa(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function cell(id, value, style, x, y, w, h) {
  return `<mxCell id="${id}" value="${xa(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}

function edge(id, src, tgt, label) {
  const lv = label ? xa(label) : '';
  return `<mxCell id="${id}" value="${lv}" style="edgeStyle=orthogonalEdgeStyle;html=1;strokeColor=#374151;strokeWidth=2;rounded=1;fontSize=10;fontColor=#374151;" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

function edgeSide(id, src, tgt, label, exitX, exitY, entryX, entryY) {
  const lv = label ? xa(label) : '';
  return `<mxCell id="${id}" value="${lv}" style="edgeStyle=orthogonalEdgeStyle;html=1;strokeColor=#374151;strokeWidth=2;rounded=1;fontSize=10;fontColor=#374151;exitX=${exitX};exitY=${exitY};exitDx=0;exitDy=0;entryX=${entryX};entryY=${entryY};entryDx=0;entryDy=0;" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

// Shapes
const START_STYLE   = 'ellipse;whiteSpace=wrap;html=1;fillColor=#1E3A5F;strokeColor=#1E3A5F;fontColor=#ffffff;fontStyle=1;fontSize=13;';
const END_STYLE     = 'ellipse;whiteSpace=wrap;html=1;fillColor=#15803d;strokeColor=#15803d;fontColor=#ffffff;fontStyle=1;fontSize=12;';
const PROCESS_STYLE = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563EB;fontColor=#1e3a5f;fontSize=11;fontStyle=0;';
const DECISION_STYLE= 'rhombus;whiteSpace=wrap;html=1;fillColor=#fef9c3;strokeColor=#ca8a04;fontColor=#713f12;fontSize=10;fontStyle=1;';
const GROUP_STYLE   = 'text;html=1;strokeColor=none;fillColor=#1D4ED8;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=1;fontColor=#ffffff;fontStyle=1;fontSize=12;';
const DOC_STYLE     = 'shape=document;whiteSpace=wrap;html=1;fillColor=#f0fdf4;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;';

const CX = 400; // centre x of main flow column
const BW = 220; // box width
const BH = 54;  // process box height
const DW = 180; // diamond width
const DH = 90;  // diamond height
const GAP = 30; // vertical gap between nodes

function bx(x) { return x - BW/2; }   // left edge for centred box
function dx(x) { return x - DW/2; }   // left edge for centred diamond

function buildDiagram(mod) {
  const cells = [];
  let y = 40;

  // START
  const startId = uid();
  cells.push(cell(startId, 'START: ' + mod.shortTitle, START_STYLE, bx(CX), y, BW, 44));
  y += 44 + GAP;

  let prev = startId;

  for (const sec of mod.sections) {
    // Section label band
    const gid = uid();
    cells.push(cell(gid, sec.name, GROUP_STYLE, bx(CX) - 20, y, BW + 40, 30));
    cells.push(edge(uid(), prev, gid));
    prev = gid;
    y += 30 + GAP;

    for (const node of sec.nodes) {
      if (node.type === 'process') {
        const id = uid();
        cells.push(cell(id, node.label, PROCESS_STYLE, bx(CX), y, BW, BH));
        cells.push(edge(uid(), prev, id));
        prev = id;
        y += BH + GAP;

      } else if (node.type === 'decision') {
        const id = uid();
        cells.push(cell(id, node.label, DECISION_STYLE, dx(CX), y, DW, DH));
        cells.push(edge(uid(), prev, id));

        // YES branch — continues down
        const yesId = uid();
        const yesY = y + DH + GAP;
        cells.push(cell(yesId, node.yes.label, PROCESS_STYLE, bx(CX), yesY, BW, BH));
        cells.push(edge(uid(), id, yesId, 'Yes'));

        // NO branch — to the right
        const noId = uid();
        const noX = CX + DW/2 + 40;
        cells.push(cell(noId, node.no.label, PROCESS_STYLE, noX, y + (DH - BH)/2, BW, BH));
        cells.push(edgeSide(uid(), id, noId, 'No', 1, 0.5, 0, 0.5));

        // After decision, connect no-branch back down to yes-branch
        cells.push(edgeSide(uid(), noId, yesId, '', 0.5, 1, 1, 0.5));

        prev = yesId;
        y = yesY + BH + GAP;

      } else if (node.type === 'document') {
        const id = uid();
        cells.push(cell(id, node.label, DOC_STYLE, bx(CX), y, BW, BH));
        cells.push(edge(uid(), prev, id));
        prev = id;
        y += BH + GAP;
      }
    }
    y += 20;
  }

  // END
  const endId = uid();
  cells.push(cell(endId, 'END', END_STYLE, bx(CX) + (BW-120)/2, y, 120, 40));
  cells.push(edge(uid(), prev, endId));

  return `<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`;
}

function encodeForUrl(xml) {
  const compressed = zlib.deflateRawSync(Buffer.from(xml, 'utf-8'), { level: 9 });
  return encodeURIComponent(compressed.toString('base64'));
}

// ── MODULE DATA ───────────────────────────────────────────────────────────────
// node types: process | decision | document
// decision has .yes and .no with .label

const modules = [
  {
    shortTitle: "1. Admin Module",
    subtitle: "System administration, user management, roles, and platform configuration.",
    sections: [
      {
        name: "1.1 User Management",
        rows: [
          { step:"1", action:"Create User Account",       description:"Admin creates a new user — name, email, and login credentials.",                 actor:"Super Admin" },
          { step:"2", action:"Assign Role",                description:"Select predefined role (HR Manager, Finance Officer, etc.).",                   actor:"Super Admin" },
          { step:"3", action:"Set Module Permissions",     description:"Define read / write / approve access per module.",                              actor:"Super Admin" },
          { step:"4", action:"Activate Account",           description:"User receives credentials and accesses assigned modules.",                      actor:"System" },
          { step:"5", action:"Deactivate / Suspend User",  description:"Admin revokes access by deactivating the account.",                            actor:"Super Admin" },
        ]
      },
      {
        name: "1.2 Roles & Permissions",
        rows: [
          { step:"1", action:"Define Role",               description:"Create named roles: Admin, HR Manager, Finance Analyst, etc.",                  actor:"Super Admin" },
          { step:"2", action:"Set Module Access",          description:"Grant or restrict read, write, approve rights per module.",                    actor:"Super Admin" },
          { step:"3", action:"Assign Role to Users",       description:"One or more users associated with the role.",                                  actor:"Super Admin" },
          { step:"4", action:"Changes Propagated",         description:"Role permission updates apply automatically to all assigned users.",           actor:"System" },
        ]
      },
      {
        name: "1.3 Company Setup",
        rows: [
          { step:"1", action:"Company Profile",            description:"Enter company name, logo, address, and registration details.",                 actor:"Super Admin" },
          { step:"2", action:"Board of Directors",         description:"Add board members with titles and signatures.",                               actor:"Super Admin" },
          { step:"3", action:"Financial Configuration",    description:"Set fiscal year, currency, and tax rates.",                                   actor:"Super Admin" },
          { step:"4", action:"Units of Measurement",       description:"Define units used across procurement and inventory.",                         actor:"Super Admin" },
          { step:"5", action:"Project Configuration",      description:"Set default project statuses, phases, and milestone categories.",             actor:"Super Admin" },
        ]
      },
      {
        name: "1.4 System Configuration",
        rows: [
          { step:"1", action:"General Settings",           description:"Date format, time zone, language, and system preferences.",                   actor:"Super Admin" },
          { step:"2", action:"Notification Rules",         description:"Set triggers for email and in-app notifications per event.",                  actor:"Super Admin" },
          { step:"3", action:"Email Configuration",        description:"Configure SMTP for outgoing system emails.",                                  actor:"Super Admin" },
          { step:"4", action:"Integrations",               description:"Connect third-party tools: ERP, payroll, accounting.",                        actor:"Super Admin" },
          { step:"5", action:"Issue & Change Categories",  description:"Define categories for ESS issues and change requests.",                       actor:"Super Admin" },
        ]
      },
      {
        name: "1.5 Reports & Audit",
        rows: [
          { step:"1", action:"Report Builder",             description:"Create custom reports — data source, columns, filters, grouping.",            actor:"Super Admin" },
          { step:"2", action:"Schedule & Distribute",      description:"Set automated delivery schedule; system emails to recipients.",               actor:"System" },
          { step:"3", action:"Audit Logs",                 description:"All actions logged: user, timestamp, module, action, record.",               actor:"System" },
          { step:"4", action:"Export Audit Trail",         description:"Admin exports audit log for compliance or investigation.",                    actor:"Super Admin" },
        ]
      },
    ]
  },

  {
    shortTitle: "2. HR Module",
    subtitle: "Full employee lifecycle — onboarding, departments, leave, attendance, payroll, workforce.",
    sections: [
      {
        name: "2.1 Employee Management",
        rows: [
          { step:"1", action:"Create Employee Record",     description:"Enter personal details, role, department, grade, salary.",                   actor:"HR Manager" },
          { step:"2", action:"Assign Department",          description:"Link employee to department.",                                               actor:"HR Manager" },
          { step:"3", action:"Set Reporting Line",         description:"Assign line manager and grade level.",                                       actor:"HR Manager" },
          { step:"4", action:"Profile Goes Live",          description:"Record appears in directory; ESS account created.",                          actor:"System" },
          { step:"5", action:"Edit Employee Details",      description:"HR updates all fields. Signature managed only by the employee in ESS.",     actor:"HR Manager" },
        ]
      },
      {
        name: "2.2 Departments",
        rows: [
          { step:"1", action:"Create Department",          description:"Define department with name, code, and head of department.",                 actor:"HR Manager" },
          { step:"2", action:"Assign Employees",           description:"Employees linked to departments during onboarding or via update.",           actor:"HR Manager" },
          { step:"3", action:"Update Department",          description:"Modify name, code, or reassign department head.",                            actor:"HR Manager" },
        ]
      },
      {
        name: "2.3 Leave Management",
        rows: [
          { step:"1", action:"Configure Leave Types",      description:"Define Annual, Sick, Maternity, etc. with accrual rules.",                  actor:"HR Manager" },
          { step:"2", action:"Set Leave Balances",         description:"Assign entitled days per employee or grade level.",                         actor:"HR Manager" },
          { step:"3", action:"Employee Submits Leave",     description:"Employee raises leave request in ESS.",                                     actor:"Employee" },
          { step:"4", action:"Approval Routing",           description:"Routed to line manager, then HR for final approval.",                      actor:"Manager / HR" },
          { step:"5", action:"Balance Deducted",           description:"Approved leave automatically deducted from balance.",                      actor:"System" },
        ]
      },
      {
        name: "2.4 Attendance",
        rows: [
          { step:"1", action:"Mark Attendance",            description:"Daily attendance: Present, Absent, Half-Day, On Leave.",                    actor:"HR / System" },
          { step:"2", action:"Base Calendar",              description:"Configure working calendar, public holidays, work hours.",                  actor:"HR Manager" },
          { step:"3", action:"View Attendance Logs",       description:"Review per-employee records filtered by date range.",                      actor:"HR Manager" },
          { step:"4", action:"Attendance Reports",         description:"Generate summaries for payroll and compliance.",                            actor:"HR Manager" },
        ]
      },
      {
        name: "2.5 Payroll",
        rows: [
          { step:"1", action:"Configure Salary Structure", description:"Define earning and deduction components: basic, HMO, pension, tax.",       actor:"HR Manager" },
          { step:"2", action:"Set Payroll Period",         description:"Define pay cycle — monthly or bi-weekly — and cut-off dates.",             actor:"HR Manager" },
          { step:"3", action:"Process Payroll",            description:"System calculates net pay per employee.",                                  actor:"HR Manager" },
          { step:"4", action:"Review & Approve",           description:"Payroll reviewed by Finance before final approval.",                       actor:"HR / Finance" },
          { step:"5", action:"Publish Payslips",           description:"Payslips published to each employee's ESS account.",                      actor:"System" },
        ]
      },
      {
        name: "2.6 Workforce & Reports",
        rows: [
          { step:"1", action:"Workforce Allocation",       description:"Assign employees to projects or departments based on capacity.",            actor:"HR Manager" },
          { step:"2", action:"Assign HR Tasks",            description:"Create and assign tasks to HR team members.",                              actor:"HR Manager" },
          { step:"3", action:"HR Reports",                 description:"Generate headcount, payroll, and workforce reports.",                      actor:"HR Manager" },
          { step:"4", action:"Report Automation",          description:"Schedule recurring HR reports for automatic email delivery.",              actor:"HR Manager" },
        ]
      },
    ]
  },

  {
    shortTitle: "3. ESS Module",
    subtitle: "Employee portal for requests, approvals, profile, payslips, and task management.",
    sections: [
      {
        name: "3.1 My Profile & Signature",
        rows: [
          { step:"1", action:"View Profile",               description:"Employee views personal info (basic info managed by HR).",                  actor:"Employee" },
          { step:"2", action:"Upload Signature",           description:"Employee uploads digital signature — only they can set or update it.",      actor:"Employee" },
          { step:"3", action:"View Payslip History",       description:"Employee downloads current and previous payslips.",                         actor:"Employee" },
        ]
      },
      {
        name: "3.2 Material Request",
        rows: [
          { step:"1", action:"Select Request Type",        description:"Choose Material or Service sub-type.",                                     actor:"Employee" },
          { step:"2", action:"Fill Request Form",          description:"Enter material, quantity, urgency, and purpose.",                          actor:"Employee" },
          { step:"3", action:"Attach Documents",           description:"Optionally attach supporting PDFs or images.",                             actor:"Employee" },
          { step:"4", action:"Submit Request",             description:"Routed through the approval workflow.",                                    actor:"Employee" },
          { step:"5", action:"Approval / Rejection",       description:"Line manager or procurement approves or rejects.",                        actor:"Manager / Procurement" },
          { step:"6", action:"Routed to Procurement",      description:"Approved requests create a Purchase Request in Procurement.",             actor:"System" },
        ]
      },
      {
        name: "3.3 Finance / Expense Request",
        rows: [
          { step:"1", action:"Raise Finance Request",      description:"Submit with amount, category, and justification.",                        actor:"Employee" },
          { step:"2", action:"Attach Receipt",             description:"Upload receipt or supporting document.",                                   actor:"Employee" },
          { step:"3", action:"Approval Routing",           description:"Goes to line manager then Finance for approval.",                         actor:"Manager / Finance" },
          { step:"4", action:"Payment Processed",          description:"Finance reimburses or pays upon approval.",                               actor:"Finance" },
        ]
      },
      {
        name: "3.4 Leave Request",
        rows: [
          { step:"1", action:"Submit Leave Request",       description:"Select leave type, dates, and provide reason.",                           actor:"Employee" },
          { step:"2", action:"Attach Documents",           description:"Attach medical cert or other supporting docs.",                           actor:"Employee" },
          { step:"3", action:"Approval Routing",           description:"Goes to line manager, then HR for final approval.",                       actor:"Manager / HR" },
          { step:"4", action:"Balance Updated",            description:"Approved leave deducted; employee notified.",                             actor:"System" },
        ]
      },
      {
        name: "3.5 Issue Log",
        rows: [
          { step:"1", action:"Log an Issue",               description:"Describe issue type, description, and priority.",                         actor:"Employee" },
          { step:"2", action:"Attach Evidence",            description:"Attach relevant files or screenshots.",                                   actor:"Employee" },
          { step:"3", action:"Routed for Resolution",      description:"Assigned to responsible department.",                                     actor:"HR / Admin" },
          { step:"4", action:"Issue Resolved",             description:"Marked resolved; employee notified.",                                     actor:"HR / Admin" },
        ]
      },
      {
        name: "3.6 Change Request",
        rows: [
          { step:"1", action:"Submit Change Request",      description:"Request change to personal data, role, or location.",                     actor:"Employee" },
          { step:"2", action:"Attach Documents",           description:"Add supporting documentation if required.",                               actor:"Employee" },
          { step:"3", action:"Review & Approve",           description:"HR approves or rejects with comments.",                                   actor:"HR Manager" },
          { step:"4", action:"Record Updated",             description:"Approved changes applied to HR record.",                                  actor:"HR / System" },
        ]
      },
      {
        name: "3.7 Appraisal & Tasks",
        rows: [
          { step:"1", action:"Performance Appraisal",      description:"Self-assessment; manager provides rating and feedback.",                  actor:"Employee / Manager" },
          { step:"2", action:"My Tasks",                   description:"View and update tasks assigned across all modules.",                      actor:"Employee" },
          { step:"3", action:"My Projects",                description:"View all projects the employee is assigned to.",                          actor:"Employee" },
          { step:"4", action:"Activity History",           description:"Full history of requests, approvals, and actions.",                       actor:"Employee" },
        ]
      },
    ]
  },

  {
    shortTitle: "4. Procurement Module",
    subtitle: "Full cycle from purchase request, RFQ, negotiation, PO to GRN and payment.",
    sections: [
      {
        name: "4.1 Supplier Management",
        rows: [
          { step:"1", action:"Add Supplier",               description:"Register with name, contact, category, and bank details.",                actor:"Procurement Officer" },
          { step:"2", action:"Supplier Compliance",        description:"Attach compliance docs: CAC, tax clearance, insurance.",                 actor:"Procurement Officer" },
          { step:"3", action:"Approve Supplier",           description:"Verified suppliers available for purchase orders.",                       actor:"Procurement Manager" },
        ]
      },
      {
        name: "4.2 Purchase Request (PR)",
        rows: [
          { step:"1", action:"Receive or Raise PR",        description:"From approved ESS request or raised directly.",                          actor:"Procurement / ESS" },
          { step:"2", action:"Review & Approve PR",        description:"Procurement manager approves the purchase request.",                     actor:"Procurement Manager" },
          { step:"3", action:"Generate RFQ",               description:"Request for Quotation sent to selected suppliers.",                      actor:"Procurement Officer" },
        ]
      },
      {
        name: "4.3 Quotation & Negotiation",
        rows: [
          { step:"1", action:"Receive Supplier Quotes",    description:"Quotes recorded against the RFQ line items.",                           actor:"Procurement Officer" },
          { step:"2", action:"Expand Line Items",          description:"Each quote shows itemised quantities, unit prices, and totals.",         actor:"Procurement Officer" },
          { step:"3", action:"Negotiate Per Line Item",    description:"Propose a new unit price per item; system recalculates total.",         actor:"Procurement Officer" },
          { step:"4", action:"Track Negotiation Rounds",   description:"Multiple negotiation rounds captured per item.",                        actor:"Procurement Officer" },
          { step:"5", action:"Select Winning Quote",       description:"Best quote confirmed and converted to a Purchase Order.",              actor:"Procurement Manager" },
        ]
      },
      {
        name: "4.4 Purchase Order (PO)",
        rows: [
          { step:"1", action:"Generate PO",                description:"PO generated from the accepted quote.",                                  actor:"System" },
          { step:"2", action:"Approve & Issue PO",         description:"PO reviewed, approved, and sent to supplier.",                          actor:"Procurement Manager" },
          { step:"3", action:"Supplier Acknowledgement",   description:"Supplier confirms receipt and acceptance.",                             actor:"Supplier" },
        ]
      },
      {
        name: "4.5 Goods Receipt & Invoice",
        rows: [
          { step:"1", action:"Receive Goods (GRN)",        description:"GRN created with received quantities and condition notes.",             actor:"Store / Procurement" },
          { step:"2", action:"Match GRN to PO",            description:"System compares received to ordered quantities.",                       actor:"System" },
          { step:"3", action:"Raise Purchase Invoice",     description:"Invoice matched against PO and GRN.",                                  actor:"Finance / Procurement" },
          { step:"4", action:"Approve for Payment",        description:"Invoice approved; passed to Finance for payment.",                     actor:"Finance" },
        ]
      },
      {
        name: "4.6 Inventory & Stock",
        rows: [
          { step:"1", action:"Monitor Stock Levels",       description:"View inventory per material and location.",                             actor:"Procurement / Store" },
          { step:"2", action:"Stock Movement Log",         description:"Track every stock-in and stock-out with date and reference.",          actor:"Store Officer" },
        ]
      },
    ]
  },

  {
    shortTitle: "5. Finance Module",
    subtitle: "Accounting, budgets, expenses, payroll posting, claims, and reporting.",
    sections: [
      {
        name: "5.1 Chart of Accounts",
        rows: [
          { step:"1", action:"Create GL Account",          description:"Define code, name, and type: asset, liability, income, expense.",       actor:"Finance Manager" },
          { step:"2", action:"Build Account Hierarchy",    description:"Organise accounts in parent/child tree.",                               actor:"Finance Manager" },
          { step:"3", action:"Link to Transactions",       description:"All journal entries and expenses post to GL accounts.",                 actor:"System" },
        ]
      },
      {
        name: "5.2 Journal Entries & Posting",
        rows: [
          { step:"1", action:"Create Journal Entry",       description:"Record manual debit and credit entries with narration.",               actor:"Finance Officer" },
          { step:"2", action:"Post Entry",                 description:"Posted entries update the general ledger immediately.",                actor:"Finance Officer" },
          { step:"3", action:"Posting Engine",             description:"Automated batch posting engine processes rules-based entries.",        actor:"System" },
          { step:"4", action:"Scheduled Posting",          description:"Set up recurring entries, e.g. monthly depreciation.",                actor:"Finance Officer" },
        ]
      },
      {
        name: "5.3 Expenses & Income",
        rows: [
          { step:"1", action:"Record Expense",             description:"Enter category, amount, date, vendor, and GL account.",               actor:"Finance Officer" },
          { step:"2", action:"Approve Expense",            description:"Expenses above threshold require manager approval.",                  actor:"Finance Manager" },
          { step:"3", action:"Record Income",              description:"Log income entries against income GL accounts.",                      actor:"Finance Officer" },
          { step:"4", action:"Reconcile Ledger",           description:"Match and reconcile entries in the transactions ledger.",             actor:"Finance Officer" },
        ]
      },
      {
        name: "5.4 Budget Management",
        rows: [
          { step:"1", action:"Create Budget",              description:"Set annual or periodic budgets per department or project.",            actor:"Finance Manager" },
          { step:"2", action:"Allocate Budget Lines",      description:"Break budget into line items by expense category.",                   actor:"Finance Manager" },
          { step:"3", action:"Track Budget vs Actual",     description:"Real-time comparison of actual spend vs. approved budget.",          actor:"Finance Manager" },
          { step:"4", action:"Budget Alerts",              description:"System alerts when spend approaches or exceeds limits.",              actor:"System" },
        ]
      },
      {
        name: "5.5 Claims Management",
        rows: [
          { step:"1", action:"Submit Claim",               description:"Employee submits reimbursement or expense claim.",                    actor:"Employee" },
          { step:"2", action:"Finance Review",             description:"Finance reviews claim details and receipts.",                        actor:"Finance Officer" },
          { step:"3", action:"Approve & Reimburse",        description:"Approved claims processed for payment.",                            actor:"Finance Manager" },
        ]
      },
      {
        name: "5.6 Payroll Integration",
        rows: [
          { step:"1", action:"Receive Approved Payroll",   description:"HR passes approved payroll to Finance for posting.",                 actor:"System / HR" },
          { step:"2", action:"Review Payroll Journal",     description:"Finance verifies payroll amounts and deductions.",                   actor:"Finance Officer" },
          { step:"3", action:"Post to General Ledger",     description:"Payroll entries posted to salary and liability accounts.",          actor:"Finance Officer" },
          { step:"4", action:"Payment Disbursement",       description:"Net salaries disbursed via bank transfer.",                         actor:"Finance Manager" },
        ]
      },
      {
        name: "5.7 Finance Config & Reports",
        rows: [
          { step:"1", action:"Finance Configuration",      description:"Set fiscal year, currency, tax codes, approval thresholds.",         actor:"Finance Manager" },
          { step:"2", action:"Process Mapping",            description:"Define financial workflows and approval chains.",                    actor:"Finance Manager" },
          { step:"3", action:"Generate Reports",           description:"P&L, Balance Sheet, Cash Flow, and custom reports.",                actor:"Finance Manager" },
        ]
      },
    ]
  },

  {
    shortTitle: "6. Construction Module",
    subtitle: "End-to-end project management: planning, tasks, time tracking, and completion.",
    sections: [
      {
        name: "6.1 Project Creation",
        rows: [
          { step:"1", action:"Create Project",             description:"Define name, type, client, location, start date, contract value.",   actor:"Project Manager" },
          { step:"2", action:"Configure Project",          description:"Set phases, milestone categories, and document requirements.",       actor:"Project Manager" },
          { step:"3", action:"Project Goes Live",          description:"Listed under Active Projects; accessible to assigned team.",         actor:"System" },
        ]
      },
      {
        name: "6.2 Scope & Timeline",
        rows: [
          { step:"1", action:"Define Project Scope",       description:"Document deliverables, boundaries, and exclusions.",                actor:"Project Manager" },
          { step:"2", action:"Build Timeline",             description:"Gantt-style timeline with phases, durations, and dependencies.",    actor:"Project Manager" },
          { step:"3", action:"Set Milestones",             description:"Key milestone events with target completion dates.",                actor:"Project Manager" },
        ]
      },
      {
        name: "6.3 Resource Planning",
        rows: [
          { step:"1", action:"Plan Resources",             description:"Assign labour, equipment, and materials to the project.",           actor:"Project Manager" },
          { step:"2", action:"Assign Team Members",        description:"Link HR workforce employees to project tasks.",                    actor:"Project Manager" },
          { step:"3", action:"Budget Allocation",          description:"Set resource budgets aligned with Finance module.",                actor:"PM / Finance" },
        ]
      },
      {
        name: "6.4 Tasks & Time Tracking",
        rows: [
          { step:"1", action:"Create Tasks",               description:"Break work into tasks with assignees, due dates, priorities.",     actor:"Project Manager" },
          { step:"2", action:"Assign Tasks",               description:"Team members see tasks in ESS My Tasks.",                         actor:"System" },
          { step:"3", action:"Log Time",                   description:"Team members log hours spent on each task.",                      actor:"Team Member" },
          { step:"4", action:"Track Progress",             description:"Review completion % per task and per phase.",                     actor:"Project Manager" },
        ]
      },
      {
        name: "6.5 Approvals & Documents",
        rows: [
          { step:"1", action:"Submit for Approval",        description:"Deliverables, change orders submitted for sign-off.",             actor:"Project Manager" },
          { step:"2", action:"Review & Approve",           description:"Approver reviews and approves or rejects.",                      actor:"Director / Senior PM" },
          { step:"3", action:"Document Management",        description:"Upload and version drawings, specs, contracts.",                  actor:"Project Manager" },
        ]
      },
      {
        name: "6.6 Completion & Reports",
        rows: [
          { step:"1", action:"Mark Milestones Complete",   description:"Formal milestone sign-off with date.",                           actor:"Project Manager" },
          { step:"2", action:"Move to Completed",          description:"Project moved to Completed after all milestones signed off.",    actor:"Project Manager" },
          { step:"3", action:"Project Reports",            description:"Timeline adherence, resource utilisation, cost vs. budget.",    actor:"Project Manager" },
        ]
      },
    ]
  },

  {
    shortTitle: "7. Storefront Module",
    subtitle: "Central store — inventory management, stock movements, transfers, and returns.",
    sections: [
      {
        name: "7.1 Incoming Requests & Issuance",
        rows: [
          { step:"1", action:"Receive Material Request",   description:"Requests from ESS, Procurement, or auto-reorder triggers.",       actor:"Store Officer" },
          { step:"2", action:"Check Stock Level",          description:"System checks available quantity for the requested item.",        actor:"System" },
          { step:"3", action:"In Stock: Issue Material",   description:"Material issued; stock movement automatically logged.",          actor:"Store Officer" },
          { step:"4", action:"Out of Stock: Raise PR",     description:"Auto-raises a Purchase Request to Procurement.",                 actor:"System" },
        ]
      },
      {
        name: "7.2 Inventory Management",
        rows: [
          { step:"1", action:"All Materials Register",     description:"Full catalogue with descriptions, codes, and units.",            actor:"Store Officer" },
          { step:"2", action:"General Store",              description:"Browse and manage general store with on-hand quantities.",        actor:"Store Officer" },
          { step:"3", action:"Stock Levels Dashboard",     description:"Current, minimum, and maximum quantities per material.",         actor:"Store Manager" },
          { step:"4", action:"Set Reorder Level",          description:"Minimum threshold — triggers procurement when breached.",        actor:"Store Manager" },
        ]
      },
      {
        name: "7.3 Stock Movement",
        rows: [
          { step:"1", action:"Log Every Movement",         description:"Every GRN and issuance event recorded with date and reference.", actor:"System" },
          { step:"2", action:"Movement Reports",           description:"History filtered by date, material, project, or location.",     actor:"Store Manager" },
        ]
      },
      {
        name: "7.4 Stock Transfer & Project Stores",
        rows: [
          { step:"1", action:"Initiate Transfer",          description:"Transfer materials from general store to project site store.",   actor:"Store Officer" },
          { step:"2", action:"Approve Transfer",           description:"Store manager approves before stock is moved.",                 actor:"Store Manager" },
          { step:"3", action:"Update Project Store",       description:"Project store inventory updated automatically.",                actor:"System" },
          { step:"4", action:"View Project Store",         description:"Project team views materials at their site store.",             actor:"Project Team" },
        ]
      },
      {
        name: "7.5 Material Returns",
        rows: [
          { step:"1", action:"Initiate Return",            description:"Surplus materials returned from site to main store.",           actor:"Project Team" },
          { step:"2", action:"Inspect Returned Goods",     description:"Store officer checks condition on return.",                    actor:"Store Officer" },
          { step:"3", action:"Restock Inventory",          description:"Accepted returns added back to store inventory.",              actor:"System" },
          { step:"4", action:"Approval Workflow",          description:"Large returns routed through approval before restocking.",     actor:"Store Manager" },
        ]
      },
      {
        name: "7.6 Storage Config & Reports",
        rows: [
          { step:"1", action:"Configure Store Settings",   description:"Set store locations, categories, and default units.",          actor:"Store Manager" },
          { step:"2", action:"Generate Reports",           description:"Inventory valuation, movement summary, consumption reports.",  actor:"Store Manager" },
        ]
      },
    ]
  },
];

// ── BUILD FILES ───────────────────────────────────────────────────────────────

const diagrams = modules.map(mod => {
  const xml = buildDiagram(mod);
  const encoded = encodeForUrl(xml);
  const url = `https://app.diagrams.net/#R${encoded}`;
  return { mod, xml, url };
});

// 1. Multi-page .drawio file
const drawioContent = `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="BuildOS" version="21.0.0" type="browser">
${diagrams.map((d, i) => `  <diagram name="${xa(d.mod.shortTitle)}" id="page${i+1}">\n    ${d.xml}\n  </diagram>`).join('\n')}
</mxfile>`;

fs.writeFileSync('BuildOS-Flowcharts.drawio', drawioContent, 'utf-8');
console.log('✓ BuildOS-Flowcharts.drawio created');

// 2. HTML with clickable draw.io links
const htmlLinks = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>BuildOS Process Flowcharts — draw.io Links</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; background: #f1f5f9; padding: 40px 20px; }
  .container { max-width: 720px; margin: 0 auto; }
  h1 { color: #1E3A5F; font-size: 28px; margin-bottom: 6px; }
  .subtitle { color: #6B7280; font-size: 15px; margin-bottom: 32px; }
  .card { background: white; border-radius: 12px; padding: 24px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.08); border-left: 4px solid #1D4ED8; }
  .card h2 { color: #1E3A5F; font-size: 18px; margin-bottom: 6px; }
  .card p { color: #6B7280; font-size: 13px; margin-bottom: 16px; line-height: 1.5; }
  .btn { display: inline-block; background: #1E3A5F; color: white; padding: 10px 22px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; transition: background 0.2s; }
  .btn:hover { background: #1D4ED8; }
  .footer { margin-top: 40px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #9CA3AF; font-size: 13px; text-align: center; }
  .footer a { color: #1D4ED8; text-decoration: none; }
</style>
</head>
<body>
<div class="container">
  <h1>BuildOS — Process Flowcharts</h1>
  <p class="subtitle">Click any button to open that module's flowchart directly in draw.io. No login required.</p>

${diagrams.map(d => `  <div class="card">
    <h2>${d.mod.shortTitle}</h2>
    <p>${d.mod.subtitle}</p>
    <a class="btn" href="${d.url}" target="_blank" rel="noopener">Open in draw.io &rarr;</a>
  </div>`).join('\n')}

  <div class="footer">
    <p>You can also import <strong>BuildOS-Flowcharts.drawio</strong> into
    <a href="https://app.diagrams.net" target="_blank">app.diagrams.net</a>
    to see all 7 modules as separate tabs in one file.</p>
  </div>
</div>
</body>
</html>`;

fs.writeFileSync('BuildOS-Flowchart-Links.html', htmlLinks, 'utf-8');
console.log('✓ BuildOS-Flowchart-Links.html created');
console.log('\nDone! Open BuildOS-Flowchart-Links.html in your browser to access all diagrams.');
