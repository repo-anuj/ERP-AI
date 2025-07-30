# ERP V1 Technical Implementation Guide
## Step-by-Step Development Instructions

---

## 🏗️ PHASE 1: SYSTEM ANALYSIS & ARCHITECTURE DESIGN

### Step 1.1: Create New Architecture Documents

```bash
# Create architecture documentation
mkdir -p docs/architecture
mkdir -p docs/api
mkdir -p docs/database
mkdir -p docs/frontend
```

### Step 1.2: Define Core Types and Interfaces

**File: `types/business.ts`**
```typescript
export enum BusinessType {
  MANUFACTURING = "manufacturing",
  SERVICE = "service",
  RETAIL = "retail",
  WHOLESALE = "wholesale",
  CONSULTING = "consulting",
  TECHNOLOGY = "technology",
  HEALTHCARE = "healthcare",
  EDUCATION = "education",
  NONPROFIT = "nonprofit"
}

export enum CompanySize {
  STARTUP = "startup",
  SMALL = "small", 
  MEDIUM = "medium",
  LARGE = "large",
  ENTERPRISE = "enterprise"
}

export enum UserType {
  OWNER = "owner",
  MANAGER = "manager",
  EMPLOYEE = "employee", 
  VENDOR = "vendor",
  CUSTOMER = "customer",
  CONTRACTOR = "contractor"
}

export interface CompanyProfile {
  id: string;
  businessType: BusinessType;
  companySize: CompanySize;
  industry: string;
  features: CompanyFeature[];
  settings: CompanySettings;
}

export interface CompanyFeature {
  name: string;
  enabled: boolean;
  module: string;
  requiredSize?: CompanySize[];
  requiredType?: BusinessType[];
}
```

### Step 1.3: Create Feature Matrix Configuration

**File: `config/features.ts`**
```typescript
export const FEATURE_MATRIX = {
  [BusinessType.MANUFACTURING]: {
    required: ['inventory', 'sales', 'finance', 'hr'],
    optional: ['projects', 'procurement', 'quality'],
    advanced: ['bom', 'production', 'maintenance']
  },
  [BusinessType.SERVICE]: {
    required: ['sales', 'finance', 'hr', 'projects'],
    optional: ['inventory', 'scheduling'],
    advanced: ['sla', 'ticketing', 'resources']
  },
  [BusinessType.RETAIL]: {
    required: ['inventory', 'sales', 'finance', 'hr'],
    optional: ['projects', 'procurement'],
    advanced: ['pos', 'loyalty', 'multichannel']
  }
  // ... other business types
};

export const SIZE_LIMITATIONS = {
  [CompanySize.STARTUP]: {
    maxUsers: 10,
    maxLocations: 1,
    features: ['basic_crm', 'inventory', 'sales', 'basic_hr', 'finance']
  },
  [CompanySize.SMALL]: {
    maxUsers: 50,
    maxLocations: 3,
    features: ['*'] // All features available
  }
  // ... other sizes
};
```

---

## 🗄️ PHASE 2: DATABASE SCHEMA REDESIGN

### Step 2.1: Create New Prisma Schema

**File: `prisma/schema-v2.prisma`**
```prisma
// Enhanced Company Model
model Company {
  id                String             @id @default(auto()) @map("_id") @db.ObjectId
  name              String
  address           String?
  phone             String?
  email             String?
  website           String?
  logo              String?
  defaultCurrency   String             @default("USD")
  
  // Business Configuration
  profile           CompanyProfile?
  locations         Location[]
  departments       Department[]
  
  // Existing relations
  users             User[]
  employees         Employee[]
  vendors           Vendor[]
  customers         Customer[]
  
  // Core modules
  inventory         InventoryItem[]
  sales             Sale[]
  projects          Project[]
  transactions      Transaction[]
  
  createdAt         DateTime           @default(now())
  updatedAt         DateTime           @updatedAt
}

// New Company Profile Model
model CompanyProfile {
  id            String       @id @default(auto()) @map("_id") @db.ObjectId
  company       Company      @relation(fields: [companyId], references: [id])
  companyId     String       @unique @db.ObjectId
  businessType  String       // BusinessType enum
  companySize   String       // CompanySize enum
  industry      String
  foundedYear   Int?
  description   String?
  features      CompanyFeature[]
  settings      Json         // CompanySettings object
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
}

// Company Features
model CompanyFeature {
  id          String         @id @default(auto()) @map("_id") @db.ObjectId
  profile     CompanyProfile @relation(fields: [profileId], references: [id])
  profileId   String         @db.ObjectId
  name        String
  enabled     Boolean        @default(true)
  module      String
  config      Json?          // Feature-specific configuration
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

// Enhanced User Model
model User {
  id            String         @id @default(auto()) @map("_id") @db.ObjectId
  email         String         @unique
  password      String
  firstName     String?
  lastName      String?
  image         String?
  
  // User Type and Permissions
  userType      String         @default("owner") // UserType enum
  permissions   String[]       // Permission array
  
  // Profile and Preferences
  profile       UserProfile?
  preferences   Json?          // UserPreferences object
  
  // Relations
  company       Company?       @relation(fields: [companyId], references: [id])
  companyId     String?        @db.ObjectId
  notifications Notification[]
  transactions  Transaction[]
  
  // Activity tracking
  lastActive    DateTime?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

// User Profile
model UserProfile {
  id          String   @id @default(auto()) @map("_id") @db.ObjectId
  user        User     @relation(fields: [userId], references: [id])
  userId      String   @unique @db.ObjectId
  bio         String?
  location    String?
  timezone    String?
  language    String   @default("en")
  darkMode    Boolean  @default(false)
  compactView Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

// Vendor Management
model Vendor {
  id            String           @id @default(auto()) @map("_id") @db.ObjectId
  name          String
  email         String?
  phone         String?
  address       VendorAddress?
  category      String
  status        String           @default("active") // active, inactive, suspended
  rating        Float?
  
  // Relations
  company       Company          @relation(fields: [companyId], references: [id])
  companyId     String           @db.ObjectId
  contacts      VendorContact[]
  purchaseOrders PurchaseOrder[]
  
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt
  
  @@index([companyId])
}

// Vendor Contacts
model VendorContact {
  id        String   @id @default(auto()) @map("_id") @db.ObjectId
  vendor    Vendor   @relation(fields: [vendorId], references: [id])
  vendorId  String   @db.ObjectId
  name      String
  email     String?
  phone     String?
  position  String?
  isPrimary Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Purchase Orders
model PurchaseOrder {
  id            String              @id @default(auto()) @map("_id") @db.ObjectId
  orderNumber   String
  vendor        Vendor              @relation(fields: [vendorId], references: [id])
  vendorId      String              @db.ObjectId
  status        String              @default("draft") // draft, sent, approved, received, cancelled
  orderDate     DateTime
  expectedDate  DateTime?
  receivedDate  DateTime?
  total         Float
  tax           Float?
  notes         String?
  items         PurchaseOrderItem[]
  company       Company             @relation(fields: [companyId], references: [id])
  companyId     String              @db.ObjectId
  createdAt     DateTime            @default(now())
  updatedAt     DateTime            @updatedAt
  
  @@index([companyId])
  @@index([vendorId])
}

// Purchase Order Items
model PurchaseOrderItem {
  id              String        @id @default(auto()) @map("_id") @db.ObjectId
  purchaseOrder   PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
  purchaseOrderId String        @db.ObjectId
  product         String
  description     String?
  quantity        Int
  unitPrice       Float
  total           Float
  receivedQty     Int           @default(0)
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
}

// Locations
model Location {
  id        String     @id @default(auto()) @map("_id") @db.ObjectId
  name      String
  address   String?
  city      String?
  state     String?
  country   String?
  zipCode   String?
  isMain    Boolean    @default(false)
  company   Company    @relation(fields: [companyId], references: [id])
  companyId String     @db.ObjectId
  employees Employee[]
  inventory InventoryItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  
  @@index([companyId])
}

// Departments
model Department {
  id          String     @id @default(auto()) @map("_id") @db.ObjectId
  name        String
  description String?
  manager     String?    // Employee ID
  budget      Float?
  company     Company    @relation(fields: [companyId], references: [id])
  companyId   String     @db.ObjectId
  employees   Employee[]
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  
  @@index([companyId])
}

// Enhanced Employee Model
model Employee {
  id         String   @id @default(auto()) @map("_id") @db.ObjectId
  firstName  String
  lastName   String
  email      String   @unique
  phone      String?
  position   String
  
  // Department and Location
  department Department? @relation(fields: [departmentId], references: [id])
  departmentId String?   @db.ObjectId
  location   Location?   @relation(fields: [locationId], references: [id])
  locationId String?     @db.ObjectId
  
  startDate  DateTime
  salary     Float?
  status     String   @default("active")
  password   String?
  
  // User Type and Permissions
  userType   String   @default("employee") // UserType enum
  permissions String[]
  
  // Enhanced profile fields
  employeeId String?
  avatar     String?
  dateOfBirth DateTime?
  gender     String?
  maritalStatus String?
  nationality String?
  
  // Contact Information
  personalEmail String?
  alternatePhone String?
  emergencyContactName String?
  emergencyContactPhone String?
  emergencyContactRelation String?
  
  // Address
  address    EmployeeAddress?
  
  // Professional Information
  jobTitle   String?
  workLocation String?
  manager    String?
  hireDate   DateTime?
  probationEndDate DateTime?
  contractType String?
  workType   String?
  
  // Skills and Education
  education  EducationRecord[]
  skills     String[]
  certifications CertificationRecord[]
  
  // Financial Information
  bankAccountNumber String?
  bankName         String?
  bankRoutingNumber String?
  taxId            String?
  
  // Work Authorization
  workAuthorizationStatus String?
  visaType               String?
  visaExpiryDate         DateTime?
  
  // Additional Information
  bio        String?
  notes      String?
  documents  EmployeeDocument[]
  idProofs   EmployeeIdProof[]
  
  // Relations
  company    Company  @relation(fields: [companyId], references: [id])
  companyId  String   @db.ObjectId
  sales      Sale[]
  attendance Attendance[]
  chatMessages ProjectChat[]
  
  lastLogin  DateTime?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  
  @@index([companyId])
  @@index([departmentId])
  @@index([locationId])
  @@index([userType])
  @@index([employeeId])
}

// Embedded types
type VendorAddress {
  street   String?
  city     String?
  state    String?
  zipCode  String?
  country  String?
}

type EmployeeAddress {
  street     String?
  city       String?
  state      String?
  zipCode    String?
  country    String?
}

type EducationRecord {
  id          String
  institution String
  degree      String
  fieldOfStudy String?
  startDate   DateTime?
  endDate     DateTime?
  gpa         String?
  description String?
}

type CertificationRecord {
  id           String
  name         String
  issuingOrg   String
  issueDate    DateTime?
  expiryDate   DateTime?
  credentialId String?
  description  String?
}

type EmployeeDocument {
  id          String
  name        String
  type        String
  url         String
  fileSize    Int?
  mimeType    String?
  uploadDate  DateTime
  uploadedBy  String?
  description String?
  isPublic    Boolean
}

type EmployeeIdProof {
  id           String
  name         String
  value        String
  issuedBy     String?
  issueDate    DateTime?
  expiryDate   DateTime?
  verified     Boolean
  verifiedBy   String?
  verifiedAt   DateTime?
  notes        String?
  createdAt    DateTime
  updatedAt    DateTime
}
```

### Step 2.2: Create Migration Scripts

**File: `scripts/migrate-to-v2.ts`**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToV2() {
  console.log('Starting migration to V2 schema...');
  
  try {
    // 1. Create company profiles for existing companies
    const companies = await prisma.company.findMany();
    
    for (const company of companies) {
      await prisma.companyProfile.create({
        data: {
          companyId: company.id,
          businessType: 'service', // Default, can be updated later
          companySize: 'small',    // Default, can be updated later
          industry: 'general',
          features: {
            create: [
              { name: 'inventory', enabled: true, module: 'inventory' },
              { name: 'sales', enabled: true, module: 'sales' },
              { name: 'hr', enabled: true, module: 'hr' },
              { name: 'finance', enabled: true, module: 'finance' },
              { name: 'projects', enabled: true, module: 'projects' }
            ]
          },
          settings: {}
        }
      });
    }
    
    // 2. Update user types for existing users
    await prisma.user.updateMany({
      data: {
        userType: 'owner',
        permissions: ['*'] // Full permissions for existing users
      }
    });
    
    // 3. Update employee user types
    await prisma.employee.updateMany({
      data: {
        userType: 'employee'
      }
    });
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

migrateToV2().catch(console.error);
```

---

## 🔐 PHASE 3: AUTHENTICATION & PERMISSION SYSTEM

### Step 3.1: Create Unified Authentication Service

**File: `lib/auth-v2.ts`**
```typescript
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { UserType, Permission } from '@/types/business';

const secretKey = process.env.JWT_SECRET_KEY;
if (!secretKey) throw new Error('JWT_SECRET_KEY is required');

const key = new TextEncoder().encode(secretKey);

export interface AuthPayload {
  id: string;
  email: string;
  userType: UserType;
  permissions: Permission[];
  companyId: string;
  companyProfile?: any;
}

export async function generateAuthToken(payload: AuthPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(key);
}

export async function verifyAuthToken(token: string): Promise<AuthPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as AuthPayload;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function authenticateUser(
  email: string, 
  password: string, 
  userType?: UserType
): Promise<AuthPayload | null> {
  // Try to find user in different tables based on userType or auto-detect
  let user: any = null;
  let detectedUserType: UserType;
  
  if (!userType) {
    // Auto-detect user type
    user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      detectedUserType = user.userType || UserType.OWNER;
    } else {
      user = await prisma.employee.findUnique({ where: { email } });
      if (user) {
        detectedUserType = user.userType || UserType.EMPLOYEE;
      } else {
        return null; // User not found
      }
    }
  } else {
    // Use specified user type
    detectedUserType = userType;
    if (userType === UserType.OWNER) {
      user = await prisma.user.findUnique({ where: { email } });
    } else {
      user = await prisma.employee.findUnique({ where: { email } });
    }
  }
  
  if (!user) return null;
  
  // Verify password
  const passwordMatch = await verifyPassword(password, user.password);
  if (!passwordMatch) return null;
  
  // Get company profile
  const companyProfile = await prisma.companyProfile.findUnique({
    where: { companyId: user.companyId },
    include: { features: true }
  });
  
  // Get user permissions
  const permissions = getUserPermissions(user, companyProfile);
  
  return {
    id: user.id,
    email: user.email,
    userType: detectedUserType,
    permissions,
    companyId: user.companyId,
    companyProfile
  };
}

function getUserPermissions(user: any, companyProfile: any): Permission[] {
  // If user has custom permissions, use those
  if (user.permissions && user.permissions.length > 0) {
    return user.permissions;
  }
  
  // Otherwise, determine permissions based on user type and company features
  const basePermissions = getBasePermissions(user.userType);
  const enabledFeatures = companyProfile?.features?.filter(f => f.enabled) || [];
  
  return basePermissions.filter(permission => 
    isPermissionAllowed(permission, enabledFeatures)
  );
}

function getBasePermissions(userType: UserType): Permission[] {
  switch (userType) {
    case UserType.OWNER:
      return Object.values(Permission); // All permissions
    case UserType.MANAGER:
      return [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_INVENTORY,
        Permission.MANAGE_INVENTORY,
        Permission.VIEW_SALES,
        Permission.CREATE_SALES,
        Permission.APPROVE_SALES,
        Permission.VIEW_EMPLOYEES,
        Permission.VIEW_FINANCE,
        Permission.VIEW_PROJECTS,
        Permission.MANAGE_PROJECTS,
        Permission.APPROVE_TASKS
      ];
    case UserType.EMPLOYEE:
      return [
        Permission.VIEW_DASHBOARD,
        Permission.VIEW_INVENTORY,
        Permission.VIEW_SALES,
        Permission.CREATE_SALES,
        Permission.VIEW_PROJECTS
      ];
    default:
      return [];
  }
}

function isPermissionAllowed(permission: Permission, enabledFeatures: any[]): boolean {
  const featureMap = {
    [Permission.VIEW_INVENTORY]: 'inventory',
    [Permission.MANAGE_INVENTORY]: 'inventory',
    [Permission.VIEW_SALES]: 'sales',
    [Permission.CREATE_SALES]: 'sales',
    [Permission.APPROVE_SALES]: 'sales',
    [Permission.VIEW_EMPLOYEES]: 'hr',
    [Permission.MANAGE_EMPLOYEES]: 'hr',
    [Permission.VIEW_PAYROLL]: 'hr',
    [Permission.VIEW_FINANCE]: 'finance',
    [Permission.MANAGE_FINANCE]: 'finance',
    [Permission.APPROVE_EXPENSES]: 'finance',
    [Permission.VIEW_PROJECTS]: 'projects',
    [Permission.MANAGE_PROJECTS]: 'projects',
    [Permission.APPROVE_TASKS]: 'projects'
  };
  
  const requiredFeature = featureMap[permission];
  if (!requiredFeature) return true; // Dashboard and other general permissions
  
  return enabledFeatures.some(feature => feature.module === requiredFeature);
}
```

### Step 3.2: Create New Authentication API

**File: `app/api/auth/v2/signin/route.ts`**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser, generateAuthToken } from '@/lib/auth-v2';
import { z } from 'zod';

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  userType: z.enum(['owner', 'manager', 'employee', 'vendor', 'customer', 'contractor']).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, userType } = signInSchema.parse(body);
    
    const authPayload = await authenticateUser(email, password, userType);
    
    if (!authPayload) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    const token = await generateAuthToken(authPayload);
    
    const response = NextResponse.json({
      success: true,
      user: {
        id: authPayload.id,
        email: authPayload.email,
        userType: authPayload.userType,
        permissions: authPayload.permissions
      },
      companyProfile: authPayload.companyProfile
    });
    
    // Set HTTP-only cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Sign-in error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

---

This technical implementation guide provides the foundation for transforming your ERP system. Each phase builds upon the previous one, ensuring a systematic approach to creating a world-class ERP solution.

The next steps would be to continue with Phase 4 (Core Module Development), where we'll rebuild each module with proper integration and consistency.
