export interface IndustryTemplate {
  industry: string;
  displayName: string;
  icon: string;
  description: string;
  departments: DepartmentTemplate[];
  roles: RoleTemplate[];
  inventoryCategories: CategoryTemplate[];
  sampleProducts: ProductTemplate[];
  workflows: WorkflowTemplate[];
  features: string[];
  specificFields: Record<string, any>;
}

export interface DepartmentTemplate {
  name: string;
  description: string;
  isRequired: boolean;
  suggestedRoles: string[];
}

export interface RoleTemplate {
  title: string;
  department: string;
  permissions: string[];
  salaryRange?: { min: number; max: number };
  description: string;
}

export interface CategoryTemplate {
  name: string;
  description: string;
  type: 'product' | 'service' | 'raw_material' | 'finished_good';
}

export interface ProductTemplate {
  name: string;
  category: string;
  unit: string;
  estimatedPrice: number;
  description: string;
  specifications?: Record<string, any>;
}

export interface WorkflowTemplate {
  name: string;
  description: string;
  steps: string[];
  approvers: string[];
}

export const INDUSTRY_TEMPLATES: Record<string, IndustryTemplate> = {
  manufacturing: {
    industry: 'manufacturing',
    displayName: 'Manufacturing',
    icon: '🏭',
    description: 'Production and assembly of goods, quality control, and supply chain management',
    departments: [
      {
        name: 'Production',
        description: 'Manufacturing and assembly operations',
        isRequired: true,
        suggestedRoles: ['Production Manager', 'Machine Operator', 'Assembly Worker']
      },
      {
        name: 'Quality Control',
        description: 'Product quality assurance and testing',
        isRequired: true,
        suggestedRoles: ['Quality Inspector', 'QC Manager', 'Test Engineer']
      },
      {
        name: 'Maintenance',
        description: 'Equipment and facility maintenance',
        isRequired: true,
        suggestedRoles: ['Maintenance Technician', 'Maintenance Manager']
      },
      {
        name: 'Logistics',
        description: 'Supply chain and distribution',
        isRequired: true,
        suggestedRoles: ['Logistics Coordinator', 'Warehouse Manager', 'Shipping Clerk']
      },
      {
        name: 'Procurement',
        description: 'Raw material and equipment purchasing',
        isRequired: false,
        suggestedRoles: ['Procurement Manager', 'Buyer', 'Vendor Manager']
      }
    ],
    roles: [
      {
        title: 'Production Manager',
        department: 'Production',
        permissions: ['manage_production', 'view_inventory', 'manage_employees'],
        salaryRange: { min: 60000, max: 90000 },
        description: 'Oversees manufacturing operations and production schedules'
      },
      {
        title: 'Quality Inspector',
        department: 'Quality Control',
        permissions: ['quality_control', 'view_production', 'create_reports'],
        salaryRange: { min: 40000, max: 60000 },
        description: 'Ensures product quality meets standards and specifications'
      },
      {
        title: 'Machine Operator',
        department: 'Production',
        permissions: ['operate_machinery', 'view_production_schedule'],
        salaryRange: { min: 35000, max: 50000 },
        description: 'Operates manufacturing equipment and machinery'
      }
    ],
    inventoryCategories: [
      {
        name: 'Raw Materials',
        description: 'Basic materials used in production',
        type: 'raw_material'
      },
      {
        name: 'Work in Progress',
        description: 'Items currently being manufactured',
        type: 'product'
      },
      {
        name: 'Finished Goods',
        description: 'Completed products ready for sale',
        type: 'finished_good'
      },
      {
        name: 'Tools & Equipment',
        description: 'Manufacturing tools and equipment',
        type: 'product'
      },
      {
        name: 'Packaging Materials',
        description: 'Materials for product packaging',
        type: 'raw_material'
      }
    ],
    sampleProducts: [
      {
        name: 'Steel Rod (Grade A)',
        category: 'Raw Materials',
        unit: 'kg',
        estimatedPrice: 50,
        description: 'High-grade steel rod for manufacturing',
        specifications: { grade: 'A', diameter: '10mm', length: '6m' }
      },
      {
        name: 'Finished Product A',
        category: 'Finished Goods',
        unit: 'pieces',
        estimatedPrice: 500,
        description: 'Main manufactured product',
        specifications: { weight: '2kg', dimensions: '30x20x10cm' }
      }
    ],
    workflows: [
      {
        name: 'Production Planning',
        description: 'Plan and schedule production runs',
        steps: ['Demand Analysis', 'Resource Planning', 'Schedule Creation', 'Approval'],
        approvers: ['Production Manager']
      },
      {
        name: 'Quality Inspection',
        description: 'Quality control process for finished goods',
        steps: ['Initial Inspection', 'Testing', 'Documentation', 'Approval/Rejection'],
        approvers: ['Quality Inspector', 'QC Manager']
      }
    ],
    features: ['inventory_management', 'production_planning', 'quality_control', 'maintenance_tracking'],
    specificFields: {
      productionCapacity: 'Daily production capacity',
      machineryList: 'List of manufacturing equipment',
      qualityCertifications: 'Quality certifications (ISO, etc.)',
      safetyCompliance: 'Safety standards compliance'
    }
  },

  service: {
    industry: 'service',
    displayName: 'Service Business',
    icon: '🛠️',
    description: 'Professional services, consulting, and customer support',
    departments: [
      {
        name: 'Customer Service',
        description: 'Client support and relationship management',
        isRequired: true,
        suggestedRoles: ['Customer Service Representative', 'Account Manager']
      },
      {
        name: 'Operations',
        description: 'Service delivery and operations',
        isRequired: true,
        suggestedRoles: ['Operations Manager', 'Service Technician']
      },
      {
        name: 'Sales',
        description: 'Business development and sales',
        isRequired: true,
        suggestedRoles: ['Sales Executive', 'Business Development Manager']
      }
    ],
    roles: [
      {
        title: 'Service Manager',
        department: 'Operations',
        permissions: ['manage_services', 'view_customers', 'manage_schedules'],
        salaryRange: { min: 55000, max: 80000 },
        description: 'Oversees service delivery and customer satisfaction'
      },
      {
        title: 'Customer Representative',
        department: 'Customer Service',
        permissions: ['view_customers', 'create_tickets', 'manage_appointments'],
        salaryRange: { min: 30000, max: 45000 },
        description: 'Handles customer inquiries and support requests'
      }
    ],
    inventoryCategories: [
      {
        name: 'Service Packages',
        description: 'Different service offerings',
        type: 'service'
      },
      {
        name: 'Consultation Services',
        description: 'Advisory and consulting services',
        type: 'service'
      },
      {
        name: 'Support Services',
        description: 'Ongoing support and maintenance',
        type: 'service'
      }
    ],
    sampleProducts: [
      {
        name: 'Business Consultation',
        category: 'Consultation Services',
        unit: 'hours',
        estimatedPrice: 200,
        description: 'Professional business advisory services',
        specifications: { duration: '1 hour', expertise: 'Business Strategy' }
      },
      {
        name: 'Technical Support',
        category: 'Support Services',
        unit: 'hours',
        estimatedPrice: 100,
        description: 'Technical assistance and troubleshooting',
        specifications: { duration: '30 minutes', type: 'Remote Support' }
      }
    ],
    workflows: [
      {
        name: 'Service Request',
        description: 'Process customer service requests',
        steps: ['Request Received', 'Assessment', 'Assignment', 'Service Delivery', 'Completion'],
        approvers: ['Service Manager']
      }
    ],
    features: ['appointment_scheduling', 'customer_management', 'service_tracking', 'billing'],
    specificFields: {
      serviceTypes: 'Types of services offered',
      serviceAreas: 'Geographic service areas',
      appointmentDuration: 'Standard appointment duration'
    }
  },

  retail: {
    industry: 'retail',
    displayName: 'Retail Business',
    icon: '🛍️',
    description: 'Product sales, inventory management, and customer experience',
    departments: [
      {
        name: 'Sales',
        description: 'Customer sales and support',
        isRequired: true,
        suggestedRoles: ['Sales Associate', 'Cashier', 'Sales Manager']
      },
      {
        name: 'Inventory',
        description: 'Stock management and procurement',
        isRequired: true,
        suggestedRoles: ['Inventory Manager', 'Stock Clerk']
      },
      {
        name: 'Marketing',
        description: 'Promotions and customer engagement',
        isRequired: false,
        suggestedRoles: ['Marketing Manager', 'Visual Merchandiser']
      }
    ],
    roles: [
      {
        title: 'Store Manager',
        department: 'Sales',
        permissions: ['manage_store', 'view_sales', 'manage_employees'],
        salaryRange: { min: 45000, max: 70000 },
        description: 'Oversees store operations and staff'
      },
      {
        title: 'Sales Associate',
        department: 'Sales',
        permissions: ['create_sales', 'view_inventory', 'customer_service'],
        salaryRange: { min: 25000, max: 35000 },
        description: 'Assists customers and processes sales'
      }
    ],
    inventoryCategories: [
      {
        name: 'Electronics',
        description: 'Electronic devices and accessories',
        type: 'product'
      },
      {
        name: 'Clothing',
        description: 'Apparel and fashion items',
        type: 'product'
      },
      {
        name: 'Home & Garden',
        description: 'Home improvement and garden supplies',
        type: 'product'
      }
    ],
    sampleProducts: [
      {
        name: 'Smartphone',
        category: 'Electronics',
        unit: 'pieces',
        estimatedPrice: 699,
        description: 'Latest model smartphone',
        specifications: { brand: 'TechBrand', model: 'X1', storage: '128GB' }
      },
      {
        name: 'T-Shirt',
        category: 'Clothing',
        unit: 'pieces',
        estimatedPrice: 25,
        description: 'Cotton t-shirt',
        specifications: { size: 'M', color: 'Blue', material: '100% Cotton' }
      }
    ],
    workflows: [
      {
        name: 'Purchase Order',
        description: 'Order products from suppliers',
        steps: ['Inventory Check', 'Supplier Selection', 'Order Creation', 'Approval', 'Delivery'],
        approvers: ['Inventory Manager']
      }
    ],
    features: ['pos_system', 'inventory_tracking', 'customer_loyalty', 'promotions'],
    specificFields: {
      storeLocations: 'Number of physical store locations',
      onlineStore: 'Online store presence',
      posSystem: 'Point of sale system type'
    }
  },

  technology: {
    industry: 'technology',
    displayName: 'Technology',
    icon: '💻',
    description: 'Software development, IT services, and technology solutions',
    departments: [
      {
        name: 'Engineering',
        description: 'Software development and technical implementation',
        isRequired: true,
        suggestedRoles: ['Software Engineer', 'DevOps Engineer', 'Tech Lead']
      },
      {
        name: 'Product',
        description: 'Product management and strategy',
        isRequired: true,
        suggestedRoles: ['Product Manager', 'Product Owner', 'UX Designer']
      },
      {
        name: 'Sales',
        description: 'Business development and client acquisition',
        isRequired: true,
        suggestedRoles: ['Sales Engineer', 'Account Executive']
      }
    ],
    roles: [
      {
        title: 'Software Engineer',
        department: 'Engineering',
        permissions: ['code_access', 'deploy_code', 'view_projects'],
        salaryRange: { min: 70000, max: 120000 },
        description: 'Develops and maintains software applications'
      },
      {
        title: 'Product Manager',
        department: 'Product',
        permissions: ['manage_products', 'view_analytics', 'manage_roadmap'],
        salaryRange: { min: 80000, max: 130000 },
        description: 'Defines product strategy and requirements'
      }
    ],
    inventoryCategories: [
      {
        name: 'Software Licenses',
        description: 'Software tools and licenses',
        type: 'service'
      },
      {
        name: 'Hardware',
        description: 'Computer equipment and devices',
        type: 'product'
      },
      {
        name: 'Cloud Services',
        description: 'Cloud computing and hosting services',
        type: 'service'
      }
    ],
    sampleProducts: [
      {
        name: 'Development License',
        category: 'Software Licenses',
        unit: 'licenses',
        estimatedPrice: 299,
        description: 'Annual development tool license',
        specifications: { type: 'IDE', users: '1', duration: '1 year' }
      },
      {
        name: 'Cloud Hosting',
        category: 'Cloud Services',
        unit: 'monthly',
        estimatedPrice: 150,
        description: 'Cloud server hosting service',
        specifications: { cpu: '4 cores', ram: '16GB', storage: '500GB' }
      }
    ],
    workflows: [
      {
        name: 'Software Development',
        description: 'Software development lifecycle',
        steps: ['Planning', 'Development', 'Testing', 'Code Review', 'Deployment'],
        approvers: ['Tech Lead', 'Product Manager']
      }
    ],
    features: ['project_management', 'time_tracking', 'code_repository', 'client_billing'],
    specificFields: {
      technologyStack: 'Primary technology stack used',
      developmentMethodology: 'Development methodology (Agile, Scrum, etc.)',
      clientTypes: 'Types of clients served'
    }
  }
};

export function getIndustryTemplate(industry: string): IndustryTemplate | null {
  return INDUSTRY_TEMPLATES[industry] || null;
}

export function getAllIndustryTemplates(): IndustryTemplate[] {
  return Object.values(INDUSTRY_TEMPLATES);
}

export function getIndustryFeatures(industry: string): string[] {
  const template = getIndustryTemplate(industry);
  return template?.features || [];
}

export function getIndustryDepartments(industry: string): DepartmentTemplate[] {
  const template = getIndustryTemplate(industry);
  return template?.departments || [];
}

export function getIndustryRoles(industry: string): RoleTemplate[] {
  const template = getIndustryTemplate(industry);
  return template?.roles || [];
}

export function generateSampleData(industry: string, companyId: string) {
  const template = getIndustryTemplate(industry);
  if (!template) return null;

  return {
    departments: template.departments.map(dept => ({
      name: dept.name,
      description: dept.description,
      companyId
    })),
    inventoryCategories: template.inventoryCategories.map(cat => ({
      name: cat.name,
      type: 'expense', // Map to existing budget category type
      companyId
    })),
    sampleProducts: template.sampleProducts.map(product => ({
      name: product.name,
      sku: `SKU-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      category: product.category,
      quantity: 100,
      price: product.estimatedPrice,
      status: 'In Stock',
      description: product.description,
      companyId
    }))
  };
}
