# BuildOS - Enterprise Construction ERP Suite

BuildOS is a modern, enterprise-grade construction ERP suite built with React, TypeScript, Tailwind CSS, and react-router. It's designed as a multi-application platform similar to Google Workspace or Zoho, with each module functioning as a separate application within a unified ecosystem.

## 🏗️ System Architecture

### Multi-Tenant Structure
- Companies register as the primary organizational unit
- First user becomes the Company Admin (Owner)
- All users belong to a company
- All data is company-scoped

### Authentication Flow
1. **Signup**: Company registration with email verification (OTP/magic link)
2. **Login**: Email + password authentication
3. **Email Verification**: Secure account validation

### User Roles
- **Admin** (Company Owner): Full system access, user management
- **Construction Manager**: Project oversight and approvals
- **Accountant**: Financial management
- **Store Manager**: Inventory control
- **HR Manager**: Employee management
- **Employee**: Self-service access

## 🎯 Applications Suite

### 1. App Launcher Dashboard
- Clean grid layout with app cards
- Global search and notifications
- Profile management
- Quick stats overview
- **Access**: Admin users see this first; other users land directly in their primary app

### 2. BuildOS Construction (Blue Theme)
**Pages:**
- **Projects List**: View and manage all construction projects
- **Project Details**: Comprehensive project information with milestones
- **Approvals**: Review and approve material/expense requests

**Features:**
- Create and assign projects
- Track progress and budgets
- Approve requests from employees
- Monitor team assignments

### 3. BuildOS Finance (Green Theme)
**Pages:**
- **Expenses**: Review and approve expense submissions
- **Transactions**: Track all financial transactions
- **Budget Tracking**: Monitor project budgets and spending

**Features:**
- Expense approval workflow
- Real-time budget monitoring
- Financial reporting by project
- Income/expense tracking

### 4. BuildOS Procurement (Purple Theme)
**Pages:**
- **Inventory**: Real-time stock tracking with low-stock alerts
- **Material Requests**: Process material requests from projects
- **Purchase Requests**: Manage procurement orders
- **Suppliers**: Maintain supplier relationships

**Features:**
- Inventory management with reorder levels
- Material request workflow
- Purchase order creation
- Supplier management

### 5. BuildOS HR (Orange Theme)
**Pages:**
- **Employees**: Employee directory and management
- **Attendance**: Track daily attendance and work hours
- **Payroll**: Process monthly payroll

**Features:**
- Employee onboarding
- Project assignments
- Attendance tracking
- Payroll processing

### 6. BuildOS ESS - Employee Self-Service (Indigo Theme)
**Pages:**
- **My Requests**: Track submitted requests
- **Submit Request**: Create material, expense, or leave requests
- **My Projects**: View assigned projects

**Features:**
- Submit material requests
- Submit expense requests
- Submit leave requests
- Track request status

## 🔄 Core Workflows

### Material Request Flow
1. Employee submits request (ESS)
2. Construction Manager approves
3. Procurement checks inventory:
   - **If available**: Issue material
   - **If not**: Create purchase request
4. Finance approves purchase
5. Inventory updated
6. Material issued to project

### Expense Flow
1. Employee submits expense (ESS)
2. Manager reviews (Construction)
3. Finance approves
4. Expense recorded
5. Project cost updated

### Workforce Flow
1. HR adds employee
2. Assign to project
3. Track attendance
4. Process payroll
5. Send to Finance

## 🎨 Design System

### Global Navigation
Each app includes:
- **Top Bar**: App switcher, global search, profile completion bar, notifications, user profile
- **Sidebar**: App-specific navigation

### Color Themes
- Construction: Blue (`bg-blue-600`)
- Finance: Green (`bg-green-600`)
- Procurement: Purple (`bg-purple-600`)
- HR: Orange (`bg-orange-600`)
- ESS: Indigo (`bg-indigo-600`)

### UI Components
- Tables for data-heavy views
- Modal dialogs for forms
- Cards for dashboards
- Status badges for workflow states
- Progress bars for tracking

## 📁 Project Structure

```
src/app/
├── App.tsx                 # Main app with RouterProvider
├── routes.tsx             # React Router configuration
├── components/
│   ├── AppHeader.tsx      # Global navigation header
│   └── Sidebar.tsx        # App-specific sidebar
├── layouts/
│   ├── RootLayout.tsx     # Root wrapper
│   ├── AuthLayout.tsx     # Authentication pages wrapper
│   └── AppLayout.tsx      # Authenticated app wrapper
└── pages/
    ├── auth/              # Authentication pages
    ├── AppLauncherPage.tsx
    ├── construction/      # Construction app pages
    ├── finance/          # Finance app pages
    ├── procurement/      # Procurement app pages
    ├── hr/              # HR app pages
    └── ess/             # ESS app pages
```

## 🚀 Key Features

### Multi-Application Architecture
- Each module is a separate app with its own routing
- Consistent global navigation across apps
- App switcher for easy navigation
- Distinct visual identity per app

### Role-Based Access
- Smart landing pages based on user role
- Permission-based feature access
- Company-scoped data isolation

### Workflow Management
- Status tracking (Pending, Approved, Rejected, Completed)
- Approval chains
- Request routing between modules
- Audit trail ready

### Data-Rich Interface
- Comprehensive tables with search and filters
- Dashboard widgets with key metrics
- Progress tracking
- Real-time status updates

## 🛠️ Technology Stack

- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **React Router 7** - Routing with data mode
- **Tailwind CSS 4** - Styling
- **Lucide React** - Icons
- **Vite** - Build tool

## 📊 Sample Data

The application includes mock data for all modules to demonstrate functionality:
- 4 active projects
- 156 employees across departments
- Inventory items with low-stock alerts
- Pending approvals and requests
- Financial transactions and budgets

## 🎯 Production Considerations

This is a frontend implementation. For production deployment, you would need to:

1. **Backend Integration**: Connect to Supabase or similar backend
2. **Authentication**: Implement real JWT-based auth
3. **Data Persistence**: Replace mock data with API calls
4. **Role Management**: Implement RBAC on backend
5. **File Uploads**: Add document/receipt handling
6. **Real-time Updates**: WebSocket for notifications
7. **Reporting**: Generate PDF reports
8. **Mobile Responsive**: Optimize for tablet/mobile

## 🌟 Design Philosophy

BuildOS follows enterprise SaaS best practices:
- **Clean & Professional**: No playful elements, business-focused
- **Data-Dense**: Maximum information density without clutter
- **Fast Navigation**: Quick app switching and search
- **Modular Design**: Each app is independent yet consistent
- **Scalable Architecture**: Easy to add new modules

---

Built with ❤️ for modern construction companies.
