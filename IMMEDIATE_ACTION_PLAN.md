# ERP V1 - Immediate Action Plan
## What to Do Right Now

---

## 🚨 CRITICAL ISSUES TO FIX FIRST

### 1. **TypeScript Errors** (Priority: CRITICAL)
Your codebase has TypeScript errors that prevent proper compilation. These must be fixed first.

**Action Required:**
```bash
# Run TypeScript check to see all errors
npx tsc --noEmit

# Fix common issues:
# - Missing type definitions
# - Incorrect prop types
# - Undefined variables
# - Import/export issues
```

### 2. **Inconsistent Authentication** (Priority: HIGH)
You have two different authentication systems (User vs Employee) causing confusion.

**Current Problems:**
- `/api/auth/signin` for Users (owners)
- `/api/auth/employee-signin` for Employees
- Different token structures
- Inconsistent permission handling

### 3. **Broken API Connections** (Priority: HIGH)
Many frontend components don't properly connect to APIs or use hardcoded data.

**Examples Found:**
- Dashboard uses mock data instead of real APIs
- Sales module has incomplete API integration
- Project management has TypeScript errors
- Finance module disconnected from other modules

---

## 📋 IMMEDIATE IMPLEMENTATION STEPS

### WEEK 1: Foundation Fixes

#### Day 1-2: Fix TypeScript Errors
```bash
# 1. Install missing dependencies
npm install --save-dev @types/node @types/react @types/react-dom

# 2. Fix import/export issues
# 3. Add proper type definitions
# 4. Fix component prop types
```

#### Day 3-4: Standardize Authentication
```typescript
// Create unified auth system
// File: lib/unified-auth.ts

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  userType: 'owner' | 'employee' | 'manager';
  permissions: string[];
  companyId: string;
}

export async function signIn(email: string, password: string): Promise<AuthUser | null> {
  // Try owner first
  const owner = await prisma.user.findUnique({ where: { email } });
  if (owner && await verifyPassword(password, owner.password)) {
    return {
      id: owner.id,
      email: owner.email,
      name: `${owner.firstName} ${owner.lastName}`,
      userType: 'owner',
      permissions: ['*'], // All permissions
      companyId: owner.companyId!
    };
  }
  
  // Try employee
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (employee && await verifyPassword(password, employee.password)) {
    return {
      id: employee.id,
      email: employee.email,
      name: `${employee.firstName} ${employee.lastName}`,
      userType: employee.role as 'employee' | 'manager',
      permissions: employee.permissions,
      companyId: employee.companyId
    };
  }
  
  return null;
}
```

#### Day 5-7: Fix Core API Connections

**1. Fix Dashboard API**
```typescript
// app/api/dashboard/route.ts
export async function GET() {
  const companyId = await getUserCompanyId();
  
  const [employeeCount, inventoryCount, salesData, recentSales] = await Promise.all([
    prisma.employee.count({ where: { companyId } }),
    prisma.inventoryItem.count({ where: { companyId } }),
    prisma.sale.aggregate({
      where: { companyId },
      _sum: { total: true },
      _count: true
    }),
    prisma.sale.findMany({
      where: { companyId },
      include: { customer: true, employee: true },
      orderBy: { date: 'desc' },
      take: 5
    })
  ]);
  
  return NextResponse.json({
    employeeCount,
    inventoryCount,
    totalSales: salesData._sum.total || 0,
    activeSalesCount: salesData._count,
    recentSales
  });
}
```

**2. Fix Sales Module**
```typescript
// Fix sales page to use real data
// app/sales/page.tsx

const [salesData, setSalesData] = useState(null);

useEffect(() => {
  async function fetchSalesData() {
    const response = await fetch('/api/sales/analytics');
    const data = await response.json();
    setSalesData(data);
  }
  fetchSalesData();
}, []);
```

### WEEK 2: Core Module Integration

#### Day 1-3: Inventory-Sales Integration
```typescript
// When creating a sale, update inventory
// app/api/sales/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create sale
    const sale = await tx.sale.create({
      data: {
        // ... sale data
      }
    });
    
    // 2. Update inventory for each item
    for (const item of body.items) {
      const inventoryItem = await tx.inventoryItem.findFirst({
        where: { name: item.product, companyId }
      });
      
      if (inventoryItem && inventoryItem.quantity >= item.quantity) {
        await tx.inventoryItem.update({
          where: { id: inventoryItem.id },
          data: { quantity: inventoryItem.quantity - item.quantity }
        });
      } else {
        throw new Error(`Insufficient inventory for ${item.product}`);
      }
    }
    
    return sale;
  });
  
  return NextResponse.json(result);
}
```

#### Day 4-5: Finance Integration
```typescript
// Auto-create transactions for sales
// lib/finance-integration.ts

export async function createSaleTransaction(sale: Sale) {
  await prisma.transaction.create({
    data: {
      date: sale.date,
      description: `Sale to ${sale.customer.name}`,
      amount: sale.total,
      type: 'income',
      companyId: sale.companyId,
      reference: sale.invoiceNumber
    }
  });
}
```

#### Day 6-7: HR-Project Integration
```typescript
// Connect employees to projects properly
// app/api/projects/route.ts

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate that project manager exists
  const manager = await prisma.employee.findFirst({
    where: { 
      id: body.projectManager.employeeId,
      companyId 
    }
  });
  
  if (!manager) {
    return NextResponse.json(
      { error: 'Project manager not found' },
      { status: 400 }
    );
  }
  
  const project = await prisma.project.create({
    data: {
      ...body,
      companyId
    }
  });
  
  return NextResponse.json(project);
}
```

---

## 🎯 BUSINESS TYPE CUSTOMIZATION (WEEK 3)

### Create Business Type Configuration

**File: `app/api/company/configure/route.ts`**
```typescript
export async function POST(request: NextRequest) {
  const { businessType, companySize, features } = await request.json();
  const companyId = await getUserCompanyId();
  
  // Update company profile
  await prisma.company.update({
    where: { id: companyId },
    data: {
      // Add business type fields to existing company model
      businessType,
      companySize,
      features: features // JSON field
    }
  });
  
  return NextResponse.json({ success: true });
}
```

### Create Feature Toggle System

**File: `hooks/useFeatures.ts`**
```typescript
export function useFeatures() {
  const [features, setFeatures] = useState<string[]>([]);
  
  useEffect(() => {
    async function fetchFeatures() {
      const response = await fetch('/api/company/features');
      const data = await response.json();
      setFeatures(data.features);
    }
    fetchFeatures();
  }, []);
  
  const hasFeature = (feature: string) => features.includes(feature);
  
  return { features, hasFeature };
}
```

### Update Sidebar with Feature Toggles

**File: `components/layout/sidebar.tsx`**
```typescript
export function Sidebar() {
  const { hasFeature } = useFeatures();
  
  const routes = [
    { label: 'Dashboard', href: '/', icon: Grid },
    { label: 'Inventory', href: '/inventory', icon: Archive, feature: 'inventory' },
    { label: 'Sales', href: '/sales', icon: DollarSign, feature: 'sales' },
    { label: 'HR', href: '/hr', icon: Users, feature: 'hr' },
    { label: 'Projects', href: '/projects', icon: Clipboard, feature: 'projects' },
    { label: 'Finance', href: '/finance', icon: DollarSign, feature: 'finance' }
  ].filter(route => !route.feature || hasFeature(route.feature));
  
  return (
    <div className="sidebar">
      {routes.map(route => (
        <Link key={route.href} href={route.href}>
          {route.label}
        </Link>
      ))}
    </div>
  );
}
```

---

## 🚀 QUICK WINS (WEEK 4)

### 1. Add Business Type Onboarding
```typescript
// app/onboarding/business-setup/page.tsx

export default function BusinessSetup() {
  const [businessType, setBusinessType] = useState('');
  const [companySize, setCompanySize] = useState('');
  
  const handleSubmit = async () => {
    await fetch('/api/company/configure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessType,
        companySize,
        features: getDefaultFeatures(businessType, companySize)
      })
    });
    
    router.push('/dashboard');
  };
  
  return (
    <div className="onboarding">
      <h1>Set Up Your Business</h1>
      
      <div>
        <label>Business Type</label>
        <select value={businessType} onChange={(e) => setBusinessType(e.target.value)}>
          <option value="manufacturing">Manufacturing</option>
          <option value="service">Service</option>
          <option value="retail">Retail</option>
          <option value="consulting">Consulting</option>
        </select>
      </div>
      
      <div>
        <label>Company Size</label>
        <select value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
          <option value="startup">Startup (1-10 employees)</option>
          <option value="small">Small (11-50 employees)</option>
          <option value="medium">Medium (51-200 employees)</option>
          <option value="large">Large (201+ employees)</option>
        </select>
      </div>
      
      <button onClick={handleSubmit}>Complete Setup</button>
    </div>
  );
}
```

### 2. Create Module-Specific Dashboards
```typescript
// Manufacturing Dashboard
// app/dashboard/manufacturing/page.tsx

export default function ManufacturingDashboard() {
  return (
    <div>
      <h1>Manufacturing Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardHeader>Production Orders</CardHeader>
          <CardContent>
            {/* Production-specific metrics */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Inventory Levels</CardHeader>
          <CardContent>
            {/* Inventory alerts for manufacturing */}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>Quality Control</CardHeader>
          <CardContent>
            {/* QC metrics */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

### 3. Add Role-Based Navigation
```typescript
// components/layout/role-based-sidebar.tsx

export function RoleBasedSidebar() {
  const { user } = useAuth();
  const { hasFeature } = useFeatures();
  
  const getRoutesForRole = (userType: string) => {
    switch (userType) {
      case 'owner':
        return ALL_ROUTES.filter(route => hasFeature(route.feature));
      case 'manager':
        return MANAGER_ROUTES.filter(route => hasFeature(route.feature));
      case 'employee':
        return EMPLOYEE_ROUTES.filter(route => hasFeature(route.feature));
      default:
        return [];
    }
  };
  
  const routes = getRoutesForRole(user.userType);
  
  return <Sidebar routes={routes} />;
}
```

---

## ✅ SUCCESS CRITERIA

### Week 1 Success:
- [ ] Zero TypeScript errors
- [ ] Unified authentication system working
- [ ] All API endpoints returning real data
- [ ] Dashboard showing live company data

### Week 2 Success:
- [ ] Sales updates inventory automatically
- [ ] Finance tracks all transactions
- [ ] Projects properly linked to employees
- [ ] All modules integrated

### Week 3 Success:
- [ ] Business type configuration working
- [ ] Feature toggles implemented
- [ ] Role-based access control
- [ ] Customized navigation

### Week 4 Success:
- [ ] Onboarding flow complete
- [ ] Business-specific dashboards
- [ ] Role-based interfaces
- [ ] System ready for any business type

---

## 🔧 TOOLS AND COMMANDS

### Development Commands:
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Run development server
npm run dev

# Check for linting issues
npm run lint

# Build for production
npm run build

# Generate Prisma client
npx prisma generate

# Push database changes
npx prisma db push

# View database
npx prisma studio
```

### Testing Commands:
```bash
# Test API endpoints
curl -X GET http://localhost:3000/api/dashboard

# Test authentication
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

---

This immediate action plan will transform your ERP from a collection of broken features into a working, integrated system within 4 weeks. Each week builds upon the previous one, ensuring steady progress toward a complete V1 ERP system.
