export type ProjectStatus = "Active" | "On Hold" | "Completed" | "Cancelled";
export type RAGStatus = "on-track" | "at-risk" | "delayed";
export type ContractType = "Lump Sum" | "Remeasurable" | "Cost Plus";
export type Weather = "Sunny" | "Cloudy" | "Drizzle" | "Rainy";

export interface Project {
  id: string;
  name: string;
  siteAddress: string;
  client: string;
  projectManager: string;
  mainContractor: string;
  contractType: ContractType;
  plannedStartDate: string;
  plannedEndDate: string;
  description: string;
  blockCount: number;
  clusterId: string;
  status: ProjectStatus;
  ragStatus: RAGStatus;
  budget: number;
  spent: number;
  location: string;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  level: 1 | 2 | 3 | 4;
  name: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  plannedDuration: number;
  actualDuration: number | null;
  percentComplete: number;
  predecessorId: string | null;
  dependencyType: "FS" | "FF" | "SS" | "SF" | null;
  lagDays: number;
  vendorId: string | null;
  ragStatus: RAGStatus;
  ragOverride: boolean;
  notes: string;
  expanded?: boolean;
}

export interface Vendor {
  id: string;
  projectId: string;
  name: string;
  trade: string;
  contractType: "Labor-only" | "Supply & Install" | "Nominated Subcontractor";
  isNominated: boolean;
  contractSum: number;
  assignedWorkPackages: string[];
  blockAssignment: string;
  skilledCount: number;
  unskilledCount: number;
  mandaysEstimate: number;
  status: "Awarded" | "Active" | "Completed" | "Terminated";
  // Rate benchmarking
  skilledDays?: number;
  skilledRate?: number;
  unskilledDays?: number;
  unskilledRate?: number;
  vendorMargin?: number;
}

export interface DailyReport {
  id: string;
  projectId: string;
  reportDate: string;
  weather: Weather;
  submittedBy: string;
  submittedAt: string;
  status: "draft" | "submitted";
  unlockedBy: string | null;
  unlockReason: string | null;
  manpower: DailyManpower[];
  equipment: DailyEquipment[];
  materials: DailyMaterial[];
  scope: DailyScope[];
}

export interface DailyManpower {
  id: string;
  vendorId: string;
  vendorName: string;
  trade: string;
  block: string;
  summaryTaskId: string;
  workPackageId: string;
  skilledCount: number;
  unskilledCount: number;
  mandays: number;
  outputDescription: string;
  outputUnit: string;
  comments: string;
}

export interface DailyEquipment {
  id: string;
  category: string;
  equipmentType: string;
  ownership: "Company-owned" | "Hired" | "Client-supplied";
  makeModel: string;
  tagNumber: string;
  inUse: boolean;
  maintenanceStatus: "Usable" | "Under Repair" | "Unusable";
  maintenanceRequired: boolean;
  activity: string;
  comments: string;
}

export interface DailyMaterial {
  id: string;
  category: string;
  materialType: string;
  unit: string;
  openingStock: number;
  receivedQty: number;
  issuedQty: number;
  closingStock: number;
  reorderLevel: number;
  requestedBy: string;
  taskId: string;
  varianceReason: string;
}

export interface DailyScope {
  id: string;
  taskId: string;
  yesterdayPlanned: string;
  yesterdayActual: string;
  todayPlanned: string;
  todayActual: string;
  pctPlanned: number;
  pctActual: number;
  varianceExplanation: string;
}

export interface Issue {
  id: string;
  projectId: string;
  issueNumber: string;
  dateRaised: string;
  raisedBy: string;
  title: string;
  description: string;
  taskId: string;
  impactTypes: string[];
  rootCause: string;
  targetDate: string;
  actions: string;
  ownerId: string;
  status: "Open" | "Under Investigation" | "In Progress" | "Escalated" | "Resolved" | "Closed";
  resolutionNotes: string;
  closedAt: string | null;
}

export interface ChangeRequest {
  id: string;
  projectId: string;
  crNumber: string;
  dateRaised: string;
  raisedBy: string;
  changeTypes: string[];
  description: string;
  reason: string;
  summaryTaskId: string;
  taskId: string;
  scopeImpact: string;
  scheduleImpactDays: number;
  costImpact: number;
  qualityImpact: string;
  stakeholderImpact: string;
  recommendedAction: string;
  status: "Proposed" | "Under Review" | "Approved" | "Rejected" | "Implemented" | "Closed";
  approverId: string | null;
  approvedAt: string | null;
  approvalNotes: string;
}

export interface Delay {
  id: string;
  projectId: string;
  taskId: string;
  taskName: string;
  stagePhase: string;
  plannedEndDate: string;
  daysDelayed: number;
  rootCause: string;
  recoveryPlan: string;
  recoveryActions: string;
  ownerId: string;
  revisedEndDate: string;
  status: "Open" | "Recovery Underway" | "Resolved";
}

export interface DocumentFolder {
  id: string;
  projectId: string;
  parentFolderId: string | null;
  name: string;
  createdBy: string;
}

export interface DocumentFile {
  id: string;
  folderId: string;
  projectId: string;
  name: string;
  fileUrl: string;
  version: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Stakeholder {
  id: string;
  projectId: string;
  name: string;
  organization: string;
  role: string;
  influenceLevel: "High" | "Medium" | "Low";
  impactLevel: "High" | "Medium" | "Low";
  notes: string;
}

export interface StakeholderCommPlan {
  id: string;
  stakeholderId: string;
  commType: string;
  frequency: string;
  responsibleId: string;
  method: string;
}

export interface StakeholderEngagementLog {
  id: string;
  stakeholderId: string;
  date: string;
  commType: string;
  summary: string;
  outcome: string;
  followupAction: string;
  followupOwnerId: string;
}

export interface VisitorLog {
  id: string;
  projectId: string;
  date: string;
  visitorName: string;
  organization: string;
  purpose: string;
  accompaniedById: string;
}

export interface QualityNCR {
  id: string;
  projectId: string;
  ncrId: string;
  date: string;
  description: string;
  taskId: string;
  raisedBy: string;
  correctiveAction: string;
  responsiblePerson: string;
  targetCloseDate: string;
  status: "Open" | "In Progress" | "Closed";
}

export interface HSEMatrix {
  id: string;
  projectId: string;
  staffMember: string;
  competency: string;
  dateObtained: string;
  expiryDate: string;
  status: "Valid" | "Expiring Soon" | "Expired";
}
