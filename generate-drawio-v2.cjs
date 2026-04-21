const zlib = require('zlib');
const fs = require('fs');

let _id = 200;
const uid = () => 'c' + (_id++);

function xa(s) {
  return String(s || '')
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function cell(id, value, style, x, y, w, h) {
  return `<mxCell id="${id}" value="${xa(value)}" style="${style}" vertex="1" parent="1"><mxGeometry x="${x}" y="${y}" width="${w}" height="${h}" as="geometry"/></mxCell>`;
}

function edge(id, src, tgt, label) {
  return `<mxCell id="${id}" value="${xa(label||'')}" style="edgeStyle=orthogonalEdgeStyle;html=1;strokeColor=#374151;strokeWidth=2;rounded=1;fontSize=10;fontColor=#374151;" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

function edgeSide(id, src, tgt, label, ex, ey, nx, ny) {
  return `<mxCell id="${id}" value="${xa(label||'')}" style="edgeStyle=orthogonalEdgeStyle;html=1;strokeColor=#374151;strokeWidth=2;rounded=1;fontSize=10;fontColor=#374151;exitX=${ex};exitY=${ey};exitDx=0;exitDy=0;entryX=${nx};entryY=${ny};entryDx=0;entryDy=0;" edge="1" source="${src}" target="${tgt}" parent="1"><mxGeometry relative="1" as="geometry"/></mxCell>`;
}

const START_S   = 'ellipse;whiteSpace=wrap;html=1;fillColor=#1E3A5F;strokeColor=#1E3A5F;fontColor=#ffffff;fontStyle=1;fontSize=13;';
const END_S     = 'ellipse;whiteSpace=wrap;html=1;fillColor=#15803d;strokeColor=#15803d;fontColor=#ffffff;fontStyle=1;fontSize=12;';
const PROC_S    = 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#2563EB;fontColor=#1e3a5f;fontSize=11;';
const DEC_S     = 'rhombus;whiteSpace=wrap;html=1;fillColor=#fef9c3;strokeColor=#ca8a04;fontColor=#713f12;fontSize=10;fontStyle=1;';
const SEC_S     = 'text;html=1;strokeColor=none;fillColor=#1D4ED8;align=center;verticalAlign=middle;whiteSpace=wrap;rounded=1;fontColor=#ffffff;fontStyle=1;fontSize=12;';
const DOC_S     = 'shape=document;whiteSpace=wrap;html=1;fillColor=#f0fdf4;strokeColor=#16a34a;fontColor=#15803d;fontSize=10;';

const CX=400, BW=220, BH=54, DW=190, DH=90, GAP=28;
function bx(x){return x-BW/2;}
function dx(x){return x-DW/2;}

function buildDiagram(mod) {
  const cells=[];
  let y=40;

  const startId=uid();
  cells.push(cell(startId,'START: '+mod.shortTitle,START_S,bx(CX),y,BW,44));
  y+=44+GAP;
  let prev=startId;

  for(const sec of mod.sections){
    const gid=uid();
    cells.push(cell(gid,sec.name,SEC_S,bx(CX)-20,y,BW+40,28));
    cells.push(edge(uid(),prev,gid));
    prev=gid; y+=28+GAP;

    for(const node of sec.nodes){
      if(node.type==='process'){
        const id=uid();
        cells.push(cell(id,node.label,PROC_S,bx(CX),y,BW,BH));
        cells.push(edge(uid(),prev,id));
        prev=id; y+=BH+GAP;
      } else if(node.type==='document'){
        const id=uid();
        cells.push(cell(id,node.label,DOC_S,bx(CX),y,BW,BH));
        cells.push(edge(uid(),prev,id));
        prev=id; y+=BH+GAP;
      } else if(node.type==='decision'){
        const did=uid();
        cells.push(cell(did,node.label,DEC_S,dx(CX),y,DW,DH));
        cells.push(edge(uid(),prev,did));

        // YES — continues down
        const yid=uid();
        const yy=y+DH+GAP;
        cells.push(cell(yid,node.yes.label,PROC_S,bx(CX),yy,BW,BH));
        cells.push(edgeSide(uid(),did,yid,'Yes',0.5,1,0.5,0));

        // NO — branches right
        const nid=uid();
        const nx=CX+DW/2+40;
        cells.push(cell(nid,node.no.label,PROC_S,nx,y+(DH-BH)/2,BW,BH));
        cells.push(edgeSide(uid(),did,nid,'No',1,0.5,0,0.5));

        // Re-join no branch back down to yes outcome
        cells.push(edgeSide(uid(),nid,yid,'',0.5,1,1,0.5));

        prev=yid; y=yy+BH+GAP;
      }
    }
    y+=24;
  }

  const endId=uid();
  cells.push(cell(endId,'END',END_S,bx(CX)+(BW-120)/2,y,120,40));
  cells.push(edge(uid(),prev,endId));

  return `<mxGraphModel dx="1422" dy="762" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" pageHeight="827" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/>${cells.join('')}</root></mxGraphModel>`;
}

function encodeForUrl(xml){
  const c=zlib.deflateRawSync(Buffer.from(xml,'utf-8'),{level:9});
  return encodeURIComponent(c.toString('base64'));
}

// ── MODULE DATA ───────────────────────────────────────────────────────────────

const modules = [
  {
    shortTitle:'1. Admin Module',
    subtitle:'System administration, user management, roles, and platform configuration.',
    sections:[
      { name:'1.1 User Management', nodes:[
        { type:'process',  label:'Super Admin logs in to Admin Panel' },
        { type:'process',  label:'Create New User Account\n(name, email, role)' },
        { type:'decision', label:'Role already exists?', yes:{label:'Assign existing Role to User'}, no:{label:'Create new Role first'} },
        { type:'process',  label:'Set Module Permissions\n(read / write / approve per module)' },
        { type:'process',  label:'Activate Account\nUser receives login credentials' },
        { type:'decision', label:'Revoke access needed?', yes:{label:'Deactivate / Suspend User'}, no:{label:'Account remains active'} },
      ]},
      { name:'1.2 Roles & Permissions', nodes:[
        { type:'process',  label:'Define Role Name\n(HR Manager, Finance Officer, etc.)' },
        { type:'process',  label:'Set read / write / approve rights per module' },
        { type:'process',  label:'Assign Role to one or more Users' },
        { type:'process',  label:'Permission changes auto-apply to all role members' },
      ]},
      { name:'1.3 Company Setup', nodes:[
        { type:'process',  label:'Enter Company Profile\n(name, logo, address, reg. number)' },
        { type:'process',  label:'Add Board of Directors\n(titles, signatures, contacts)' },
        { type:'process',  label:'Set Financial Configuration\n(fiscal year, currency, tax rates)' },
        { type:'process',  label:'Define Units of Measurement' },
        { type:'process',  label:'Configure Project Setup\n(phases, milestones, statuses)' },
      ]},
      { name:'1.4 System Configuration', nodes:[
        { type:'process',  label:'General Settings\n(date format, time zone, language)' },
        { type:'process',  label:'Set Notification Rules & Email (SMTP) config' },
        { type:'process',  label:'Configure Third-party Integrations' },
        { type:'process',  label:'Define Issue Types & Change Categories for ESS' },
      ]},
      { name:'1.5 Reports & Audit', nodes:[
        { type:'process',  label:'Build Custom Report\n(data source, columns, filters, grouping)' },
        { type:'process',  label:'Schedule automated delivery to recipients' },
        { type:'document', label:'System emails report on schedule' },
        { type:'process',  label:'All system actions logged to Audit Log\n(user, timestamp, module, action, record)' },
        { type:'process',  label:'Export Audit Trail for compliance review' },
      ]},
    ]
  },

  {
    shortTitle:'2. HR Module',
    subtitle:'Full employee lifecycle — onboarding, departments, leave, payroll, workforce.',
    sections:[
      { name:'2.1 Employee Management', nodes:[
        { type:'process',  label:'HR creates Employee Record\n(name, role, dept, grade, salary)' },
        { type:'process',  label:'Assign Department & Reporting Line / Manager' },
        { type:'process',  label:'Profile published to employee directory' },
        { type:'process',  label:'ESS account auto-created for employee' },
        { type:'decision', label:'Update employee details?', yes:{label:'HR edits record\n(signature managed by employee in ESS)'}, no:{label:'No changes — profile remains current'} },
      ]},
      { name:'2.2 Departments & Job Roles', nodes:[
        { type:'process',  label:'Create Department\n(name, code, head of department)' },
        { type:'process',  label:'Link employees to department' },
        { type:'process',  label:'Define HR Job Roles register\n(distinct from system access roles)' },
        { type:'process',  label:'Assign job role to each employee' },
      ]},
      { name:'2.3 Leave Management', nodes:[
        { type:'process',  label:'Configure Leave Types\n(Annual, Sick, Maternity, Casual…)' },
        { type:'process',  label:'Set leave entitlement per employee / grade' },
        { type:'process',  label:'Employee submits Leave Request in ESS' },
        { type:'decision', label:'Line Manager approves?', yes:{label:'Forwarded to HR for final approval'}, no:{label:'Rejected — employee notified'} },
        { type:'decision', label:'HR approves?', yes:{label:'Leave approved — balance deducted'}, no:{label:'Rejected — employee notified'} },
      ]},
      { name:'2.4 Attendance', nodes:[
        { type:'process',  label:'Configure Base Calendar\n(holidays, work hours, weekends)' },
        { type:'process',  label:'Mark daily attendance\n(Present / Absent / Half-Day / On Leave)' },
        { type:'process',  label:'Review per-employee attendance logs' },
        { type:'document', label:'Generate attendance report for payroll' },
      ]},
      { name:'2.5 Payroll', nodes:[
        { type:'process',  label:'Configure Salary Structure\n(basic, HMO, pension, tax, bonuses)' },
        { type:'process',  label:'Set Payroll Period & cut-off dates' },
        { type:'process',  label:'Run Payroll — system calculates net pay' },
        { type:'decision', label:'Finance approves payroll?', yes:{label:'Payroll approved for disbursement'}, no:{label:'Returned to HR for corrections'} },
        { type:'document', label:'Payslips published to each employee ESS account' },
      ]},
      { name:'2.6 Workforce, Tasks & Reports', nodes:[
        { type:'process',  label:'Allocate employees to projects / departments' },
        { type:'process',  label:'Create & assign HR team tasks' },
        { type:'process',  label:'Track tasks: Open → In Progress → Completed' },
        { type:'document', label:'Generate HR Reports\n(headcount, payroll, workforce utilisation)' },
        { type:'process',  label:'Schedule automated reports via Report Automation' },
      ]},
    ]
  },

  {
    shortTitle:'3. ESS Module',
    subtitle:'Employee portal — requests, approvals, profile, payslips, tasks.',
    sections:[
      { name:'3.1 My Profile & Signature', nodes:[
        { type:'process',  label:'Employee logs in to ESS portal' },
        { type:'process',  label:'View personal profile\n(basic info managed by HR)' },
        { type:'process',  label:'Upload personal digital signature\n(only the employee can set this)' },
        { type:'process',  label:'View & download Payslip history' },
      ]},
      { name:'3.2 Material Request', nodes:[
        { type:'process',  label:'Select Material or Service request type' },
        { type:'process',  label:'Fill form: item, quantity, urgency, purpose' },
        { type:'process',  label:'Attach supporting documents (optional)' },
        { type:'process',  label:'Submit request' },
        { type:'decision', label:'Manager approves?', yes:{label:'Request forwarded to Procurement\nPurchase Request auto-created'}, no:{label:'Request rejected — employee notified'} },
      ]},
      { name:'3.3 Finance / Expense Request', nodes:[
        { type:'process',  label:'Raise Finance or Expense request\n(amount, category, justification)' },
        { type:'process',  label:'Attach receipt or supporting document' },
        { type:'decision', label:'Manager + Finance approve?', yes:{label:'Payment processed by Finance'}, no:{label:'Request rejected — employee notified'} },
      ]},
      { name:'3.4 Leave Request', nodes:[
        { type:'process',  label:'Select leave type, dates, and reason' },
        { type:'process',  label:'Attach supporting document (e.g. medical cert)' },
        { type:'decision', label:'Manager approves?', yes:{label:'Forwarded to HR for final approval'}, no:{label:'Rejected — employee notified'} },
        { type:'decision', label:'HR approves?', yes:{label:'Leave balance deducted — approved'}, no:{label:'Rejected — employee notified'} },
      ]},
      { name:'3.5 Issue Log', nodes:[
        { type:'process',  label:'Log workplace issue\n(type, description, priority)' },
        { type:'process',  label:'Attach supporting evidence / files' },
        { type:'process',  label:'Issue routed to responsible dept (HR / Admin)' },
        { type:'decision', label:'Issue resolved?', yes:{label:'Issue closed — employee notified'}, no:{label:'Issue escalated or reassigned'} },
      ]},
      { name:'3.6 Change Request', nodes:[
        { type:'process',  label:'Submit change request\n(personal data, role, location…)' },
        { type:'process',  label:'Attach supporting documentation' },
        { type:'decision', label:'HR approves?', yes:{label:'Employee record updated'}, no:{label:'Request rejected — employee notified'} },
      ]},
      { name:'3.7 Appraisal, Tasks & Projects', nodes:[
        { type:'process',  label:'Complete Performance Self-assessment' },
        { type:'process',  label:'Manager adds rating & written feedback' },
        { type:'process',  label:'View My Tasks — update progress' },
        { type:'process',  label:'View My Projects & assigned activities' },
        { type:'process',  label:'Review full Activity History' },
      ]},
    ]
  },

  {
    shortTitle:'4. Procurement Module',
    subtitle:'Purchase request → RFQ → negotiation → PO → GRN → payment.',
    sections:[
      { name:'4.1 Supplier Management', nodes:[
        { type:'process',  label:'Register Supplier\n(name, contact, category, bank details)' },
        { type:'process',  label:'Attach compliance documents\n(CAC cert, tax clearance, insurance)' },
        { type:'decision', label:'Compliance verified?', yes:{label:'Supplier approved & marked verified'}, no:{label:'Return to supplier for documents'} },
      ]},
      { name:'4.2 Purchase Request (PR)', nodes:[
        { type:'decision', label:'Request source?', yes:{label:'From approved ESS Material Request'}, no:{label:'PR raised directly by Procurement'} },
        { type:'process',  label:'Procurement Manager reviews & approves PR' },
        { type:'process',  label:'Generate RFQ & send to selected suppliers' },
      ]},
      { name:'4.3 Quotation & Negotiation', nodes:[
        { type:'process',  label:'Receive supplier quotes against the RFQ' },
        { type:'process',  label:'Expand quote to view line items\n(qty, unit price, total per item)' },
        { type:'process',  label:'Negotiate per line item:\nPropose new unit price — system recalculates total' },
        { type:'process',  label:'Record multiple negotiation rounds per item' },
        { type:'process',  label:'Select winning quote' },
      ]},
      { name:'4.4 Purchase Order (PO)', nodes:[
        { type:'process',  label:'System generates PO from accepted quote' },
        { type:'process',  label:'PO reviewed & approved by Procurement Manager' },
        { type:'document', label:'PO issued to supplier' },
        { type:'process',  label:'Supplier confirms order acknowledgement' },
      ]},
      { name:'4.5 Goods Receipt & Invoice (GRN)', nodes:[
        { type:'process',  label:'Goods delivered — create GRN\n(quantities, condition notes)' },
        { type:'decision', label:'GRN matches PO quantities?', yes:{label:'Raise Purchase Invoice\n(matched to PO + GRN)'}, no:{label:'Flag discrepancy\nContact supplier'} },
        { type:'decision', label:'Finance approves invoice?', yes:{label:'Payment processed'}, no:{label:'Returned for clarification'} },
      ]},
      { name:'4.6 Inventory & Stock', nodes:[
        { type:'process',  label:'Monitor stock levels per material & location' },
        { type:'decision', label:'Stock below reorder level?', yes:{label:'Auto-raise PR to Procurement'}, no:{label:'Continue monitoring'} },
        { type:'process',  label:'Log every stock-in (GRN) and stock-out (issue) movement' },
      ]},
    ]
  },

  {
    shortTitle:'5. Finance Module',
    subtitle:'Accounting, budgets, expenses, payroll posting, claims, and reporting.',
    sections:[
      { name:'5.1 Chart of Accounts', nodes:[
        { type:'process',  label:'Create GL Accounts\n(code, name, type: asset/liability/income/expense)' },
        { type:'process',  label:'Build parent/child account hierarchy' },
        { type:'process',  label:'All transactions auto-post to linked GL accounts' },
      ]},
      { name:'5.2 Journal Entries & Posting', nodes:[
        { type:'process',  label:'Create manual Journal Entry\n(debit, credit, narration)' },
        { type:'decision', label:'Manual or automated posting?', yes:{label:'Post manually — GL updated immediately'}, no:{label:'Posting Engine handles batch entries'} },
        { type:'process',  label:'Set up Scheduled recurring entries\n(depreciation, amortisation)' },
      ]},
      { name:'5.3 Expenses & Income', nodes:[
        { type:'process',  label:'Record Expense\n(category, amount, vendor, GL account)' },
        { type:'decision', label:'Above approval threshold?', yes:{label:'Finance Manager approves expense'}, no:{label:'Expense posted directly'} },
        { type:'process',  label:'Record Income entries against income accounts' },
        { type:'process',  label:'Reconcile entries in the transactions ledger' },
      ]},
      { name:'5.4 Budget Management', nodes:[
        { type:'process',  label:'Create annual / periodic budget\nper department or project' },
        { type:'process',  label:'Allocate budget lines by expense category' },
        { type:'process',  label:'Track actual spend vs. approved budget in real time' },
        { type:'decision', label:'Spend approaching limit?', yes:{label:'Trigger budget alert notification'}, no:{label:'Continue monitoring'} },
      ]},
      { name:'5.5 Claims & Payroll Integration', nodes:[
        { type:'process',  label:'Employee submits expense claim via ESS' },
        { type:'decision', label:'Finance approves claim?', yes:{label:'Claim reimbursed / paid'}, no:{label:'Claim rejected — employee notified'} },
        { type:'process',  label:'HR approved payroll received by Finance' },
        { type:'process',  label:'Payroll journal posted to GL salary accounts' },
        { type:'process',  label:'Net salaries disbursed via bank transfer' },
      ]},
      { name:'5.6 Config & Reports', nodes:[
        { type:'process',  label:'Configure fiscal year, currency, tax codes, thresholds' },
        { type:'process',  label:'Define financial workflows & approval chains' },
        { type:'process',  label:'Manage outgoing payment batches' },
        { type:'document', label:'Generate P&L, Balance Sheet, Cash Flow,\nand custom financial reports' },
      ]},
    ]
  },

  {
    shortTitle:'6. Construction Module',
    subtitle:'End-to-end project management: planning, execution, and reporting.',
    sections:[
      { name:'6.1 Project Creation & Setup', nodes:[
        { type:'process',  label:'Create Project\n(name, type, client, location, contract value)' },
        { type:'process',  label:'Configure phases, milestones, document requirements' },
        { type:'process',  label:'Project listed under Active Projects\nTeam gets access' },
      ]},
      { name:'6.2 Scope & Timeline Planning', nodes:[
        { type:'process',  label:'Define project scope, deliverables, and exclusions' },
        { type:'process',  label:'Build Gantt timeline\n(phases, durations, dependencies)' },
        { type:'process',  label:'Set key milestones with target completion dates' },
      ]},
      { name:'6.3 Resource Planning', nodes:[
        { type:'process',  label:'Plan labour, equipment & material resources' },
        { type:'process',  label:'Assign HR workforce employees to project tasks' },
        { type:'process',  label:'Allocate project budget\naligned with Finance module' },
      ]},
      { name:'6.4 Tasks & Time Tracking', nodes:[
        { type:'process',  label:'Create tasks with assignees, due dates, priority' },
        { type:'process',  label:'Team members see tasks in ESS My Tasks' },
        { type:'process',  label:'Log time spent on each task' },
        { type:'process',  label:'Track completion % per task and per phase' },
      ]},
      { name:'6.5 Approvals & Documents', nodes:[
        { type:'process',  label:'Submit deliverable or change order for sign-off' },
        { type:'decision', label:'Approver approves?', yes:{label:'Deliverable confirmed & recorded'}, no:{label:'Returned for rework'} },
        { type:'process',  label:'Upload & version project documents\n(drawings, specs, contracts)' },
      ]},
      { name:'6.6 Completion & Reporting', nodes:[
        { type:'process',  label:'Mark each milestone complete with formal sign-off' },
        { type:'decision', label:'All milestones complete?', yes:{label:'Move project to Completed Projects'}, no:{label:'Continue active project work'} },
        { type:'document', label:'Generate reports:\nTimeline adherence, resource utilisation, cost vs. budget' },
      ]},
    ]
  },

  {
    shortTitle:'7. Storefront Module',
    subtitle:'Central store — inventory, stock movements, transfers, and returns.',
    sections:[
      { name:'7.1 Incoming Requests & Issuance', nodes:[
        { type:'process',  label:'Receive material request\n(from ESS, Procurement, or auto-reorder)' },
        { type:'decision', label:'Item in stock?', yes:{label:'Issue material to requester\nLog stock movement'}, no:{label:'Auto-raise Purchase Request\nto Procurement'} },
      ]},
      { name:'7.2 Inventory Management', nodes:[
        { type:'process',  label:'Maintain full Materials Register\n(codes, descriptions, units)' },
        { type:'process',  label:'View General Store inventory\nwith on-hand quantities' },
        { type:'process',  label:'Monitor Stock Levels Dashboard\n(current / min / max)' },
        { type:'decision', label:'Stock below reorder level?', yes:{label:'Trigger automatic PR to Procurement'}, no:{label:'Continue monitoring'} },
      ]},
      { name:'7.3 Stock Movement Log', nodes:[
        { type:'process',  label:'Every GRN and issuance event auto-logged\n(date, qty, reference)' },
        { type:'document', label:'View movement reports:\nfilter by date / material / project / location' },
      ]},
      { name:'7.4 Stock Transfers & Project Stores', nodes:[
        { type:'process',  label:'Initiate transfer from general store\nto project site store' },
        { type:'decision', label:'Store manager approves?', yes:{label:'Project store inventory updated'}, no:{label:'Transfer request rejected'} },
        { type:'process',  label:'Project team views materials at their site store' },
      ]},
      { name:'7.5 Material Returns', nodes:[
        { type:'process',  label:'Project team initiates material return\nto main store' },
        { type:'process',  label:'Store officer inspects returned items' },
        { type:'decision', label:'Condition acceptable?', yes:{label:'Restock into general inventory'}, no:{label:'Flag damaged / reject return'} },
        { type:'decision', label:'High-value return — approval required?', yes:{label:'Route through approval workflow'}, no:{label:'Restock directly'} },
      ]},
    ]
  },
];

// ── BUILD FILES ───────────────────────────────────────────────────────────────

const diagrams = modules.map((mod,i)=>{
  const xml = buildDiagram(mod);
  const enc = encodeForUrl(xml);
  return { mod, xml, url:`https://app.diagrams.net/#R${enc}` };
});

// drawio file
const drawio = `<mxfile host="app.diagrams.net" modified="${new Date().toISOString()}" agent="BuildOS" version="21.0.0" type="browser">
${diagrams.map((d,i)=>`  <diagram name="${xa(d.mod.shortTitle)}" id="page${i+1}">\n    ${d.xml}\n  </diagram>`).join('\n')}
</mxfile>`;
fs.writeFileSync('BuildOS-Flowcharts.drawio', drawio, 'utf-8');
console.log('BuildOS-Flowcharts.drawio created');

// html links
const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><title>BuildOS Flowcharts</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f1f5f9;padding:40px 20px}
.wrap{max-width:720px;margin:0 auto}
h1{color:#1E3A5F;font-size:28px;margin-bottom:6px}
.sub{color:#6B7280;font-size:15px;margin-bottom:32px}
.card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 1px 4px rgba(0,0,0,.08);border-left:4px solid #1D4ED8}
.card h2{color:#1E3A5F;font-size:18px;margin-bottom:6px}
.card p{color:#6B7280;font-size:13px;margin-bottom:16px;line-height:1.5}
.btn{display:inline-block;background:#1E3A5F;color:#fff;padding:10px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px}
.btn:hover{background:#1D4ED8}
.foot{margin-top:40px;padding-top:24px;border-top:1px solid #e5e7eb;color:#9CA3AF;font-size:13px;text-align:center}
</style></head>
<body><div class="wrap">
<h1>BuildOS — Process Flowcharts</h1>
<p class="sub">Each link opens a fully editable flowchart in draw.io (shapes, diamonds, arrows). No login required.</p>
${diagrams.map(d=>`<div class="card"><h2>${d.mod.shortTitle}</h2><p>${d.mod.subtitle}</p><a class="btn" href="${d.url}" target="_blank">Open in draw.io &rarr;</a></div>`).join('\n')}
<div class="foot">Or import <strong>BuildOS-Flowcharts.drawio</strong> at <a href="https://app.diagrams.net" target="_blank">app.diagrams.net</a> to see all 7 modules as tabs in one file.</div>
</div></body></html>`;
fs.writeFileSync('BuildOS-Flowchart-Links.html', html, 'utf-8');
console.log('BuildOS-Flowchart-Links.html created');
console.log('Done!');
