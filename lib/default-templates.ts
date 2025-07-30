// Default project templates for seeding the database

export const defaultTemplates = [
  {
    name: "E-commerce Website Development",
    description: "Complete e-commerce website with shopping cart, payment integration, and admin panel",
    category: "web_development",
    industry: "technology",
    type: "client",
    isPublic: true,
    estimatedDuration: 45,
    estimatedHours: 360,
    defaultBudget: 75000,
    priority: "high",
    riskLevel: "medium",
    objectives: "Build a fully functional e-commerce platform with modern UI/UX, secure payment processing, inventory management, and customer account features.",
    deliverables: "Responsive website, admin dashboard, payment gateway integration, inventory management system, customer portal, mobile app (optional)",
    successCriteria: "Website loads in under 3 seconds, 99.9% uptime, secure payment processing, mobile-responsive design, SEO optimized",
    tags: ["ecommerce", "web", "payment", "responsive", "seo"],
    milestones: [
      {
        name: "Requirements & Design",
        description: "Gather requirements, create wireframes and UI designs",
        estimatedDays: 7,
        deliverables: "Requirements document, wireframes, UI mockups"
      },
      {
        name: "Frontend Development",
        description: "Develop responsive frontend with React/Next.js",
        estimatedDays: 15,
        deliverables: "Responsive website frontend, product catalog, shopping cart"
      },
      {
        name: "Backend & API Development",
        description: "Build backend APIs, database, and admin panel",
        estimatedDays: 12,
        deliverables: "REST APIs, database schema, admin dashboard"
      },
      {
        name: "Payment Integration",
        description: "Integrate payment gateways and security features",
        estimatedDays: 5,
        deliverables: "Payment processing, SSL certificates, security measures"
      },
      {
        name: "Testing & Deployment",
        description: "Comprehensive testing and production deployment",
        estimatedDays: 6,
        deliverables: "Test reports, deployed website, documentation"
      }
    ],
    tasks: [
      {
        name: "Create project wireframes",
        description: "Design wireframes for all major pages",
        estimatedHours: 16,
        priority: "high",
        requiredSkills: ["UI/UX Design", "Figma"],
        dependencies: []
      },
      {
        name: "Set up development environment",
        description: "Configure development tools and repositories",
        estimatedHours: 8,
        priority: "high",
        requiredSkills: ["Git", "Node.js", "Development Tools"],
        dependencies: []
      },
      {
        name: "Develop product catalog",
        description: "Build product listing and detail pages",
        estimatedHours: 32,
        priority: "high",
        requiredSkills: ["React", "JavaScript", "CSS"],
        dependencies: ["Create project wireframes"]
      },
      {
        name: "Implement shopping cart",
        description: "Build shopping cart functionality",
        estimatedHours: 24,
        priority: "high",
        requiredSkills: ["React", "State Management", "JavaScript"],
        dependencies: ["Develop product catalog"]
      },
      {
        name: "Payment gateway integration",
        description: "Integrate Stripe/PayPal payment processing",
        estimatedHours: 20,
        priority: "high",
        requiredSkills: ["Payment APIs", "Security", "Backend Development"],
        dependencies: ["Implement shopping cart"]
      }
    ],
    requiredRoles: ["Frontend Developer", "Backend Developer", "UI/UX Designer", "Project Manager"],
    requiredSkills: ["React", "Node.js", "JavaScript", "CSS", "Payment APIs", "Database Design"],
    teamSize: 4
  },
  
  {
    name: "Mobile App Development (React Native)",
    description: "Cross-platform mobile application for iOS and Android",
    category: "mobile_app",
    industry: "technology",
    type: "client",
    isPublic: true,
    estimatedDuration: 60,
    estimatedHours: 480,
    defaultBudget: 95000,
    priority: "high",
    riskLevel: "medium",
    objectives: "Develop a cross-platform mobile application with native performance, offline capabilities, push notifications, and seamless user experience.",
    deliverables: "iOS app, Android app, backend API, admin dashboard, app store submissions",
    successCriteria: "App store approval, 4.5+ star rating, under 3-second load time, 95% crash-free sessions",
    tags: ["mobile", "react-native", "ios", "android", "cross-platform"],
    milestones: [
      {
        name: "App Design & Prototyping",
        description: "Create app designs and interactive prototypes",
        estimatedDays: 10,
        deliverables: "UI designs, interactive prototype, design system"
      },
      {
        name: "Core App Development",
        description: "Develop main app features and navigation",
        estimatedDays: 25,
        deliverables: "Core app functionality, navigation, user authentication"
      },
      {
        name: "Backend & API Integration",
        description: "Build backend services and integrate APIs",
        estimatedDays: 15,
        deliverables: "Backend APIs, database, third-party integrations"
      },
      {
        name: "Testing & Optimization",
        description: "Comprehensive testing and performance optimization",
        estimatedDays: 7,
        deliverables: "Test reports, performance optimizations, bug fixes"
      },
      {
        name: "App Store Submission",
        description: "Prepare and submit apps to app stores",
        estimatedDays: 3,
        deliverables: "App store listings, submitted apps, approval"
      }
    ],
    tasks: [
      {
        name: "Create app wireframes",
        description: "Design wireframes for all app screens",
        estimatedHours: 20,
        priority: "high",
        requiredSkills: ["Mobile UI/UX", "Figma", "Prototyping"],
        dependencies: []
      },
      {
        name: "Set up React Native project",
        description: "Initialize React Native project with navigation",
        estimatedHours: 12,
        priority: "high",
        requiredSkills: ["React Native", "JavaScript", "Mobile Development"],
        dependencies: []
      },
      {
        name: "Implement user authentication",
        description: "Build login, registration, and profile management",
        estimatedHours: 28,
        priority: "high",
        requiredSkills: ["React Native", "Authentication", "Security"],
        dependencies: ["Set up React Native project"]
      },
      {
        name: "Develop core features",
        description: "Build main app functionality and features",
        estimatedHours: 80,
        priority: "high",
        requiredSkills: ["React Native", "JavaScript", "Mobile APIs"],
        dependencies: ["Implement user authentication"]
      }
    ],
    requiredRoles: ["Mobile Developer", "Backend Developer", "UI/UX Designer", "QA Tester"],
    requiredSkills: ["React Native", "JavaScript", "Mobile Development", "API Integration", "UI/UX Design"],
    teamSize: 4
  },

  {
    name: "Digital Marketing Campaign",
    description: "Comprehensive digital marketing campaign with SEO, social media, and content marketing",
    category: "marketing",
    industry: "marketing",
    type: "client",
    isPublic: true,
    estimatedDuration: 90,
    estimatedHours: 200,
    defaultBudget: 35000,
    priority: "medium",
    riskLevel: "low",
    objectives: "Increase brand awareness, drive website traffic, generate qualified leads, and improve search engine rankings through integrated digital marketing strategies.",
    deliverables: "SEO strategy, content calendar, social media campaigns, email marketing, analytics reports",
    successCriteria: "50% increase in organic traffic, 25% increase in lead generation, improved search rankings for target keywords",
    tags: ["marketing", "seo", "social-media", "content", "analytics"],
    milestones: [
      {
        name: "Strategy Development",
        description: "Develop comprehensive marketing strategy and plan",
        estimatedDays: 7,
        deliverables: "Marketing strategy document, competitor analysis, target audience research"
      },
      {
        name: "Content Creation",
        description: "Create content for various marketing channels",
        estimatedDays: 30,
        deliverables: "Blog posts, social media content, email templates, graphics"
      },
      {
        name: "Campaign Launch",
        description: "Launch marketing campaigns across all channels",
        estimatedDays: 14,
        deliverables: "Live campaigns, social media posts, email sequences"
      },
      {
        name: "Optimization & Reporting",
        description: "Monitor, optimize, and report on campaign performance",
        estimatedDays: 39,
        deliverables: "Performance reports, optimization recommendations, ROI analysis"
      }
    ],
    tasks: [
      {
        name: "Conduct market research",
        description: "Research target audience and competitors",
        estimatedHours: 16,
        priority: "high",
        requiredSkills: ["Market Research", "Analytics", "Competitive Analysis"],
        dependencies: []
      },
      {
        name: "Develop SEO strategy",
        description: "Create comprehensive SEO strategy and keyword plan",
        estimatedHours: 12,
        priority: "high",
        requiredSkills: ["SEO", "Keyword Research", "Content Strategy"],
        dependencies: ["Conduct market research"]
      },
      {
        name: "Create content calendar",
        description: "Plan content for 3 months across all channels",
        estimatedHours: 8,
        priority: "medium",
        requiredSkills: ["Content Planning", "Social Media", "Editorial Calendar"],
        dependencies: ["Develop SEO strategy"]
      }
    ],
    requiredRoles: ["Digital Marketing Manager", "Content Creator", "SEO Specialist", "Social Media Manager"],
    requiredSkills: ["Digital Marketing", "SEO", "Content Marketing", "Social Media", "Analytics"],
    teamSize: 3
  },

  {
    name: "Enterprise Software Implementation",
    description: "Implementation of enterprise software solution with customization and training",
    category: "software_implementation",
    industry: "enterprise",
    type: "internal",
    isPublic: true,
    estimatedDuration: 120,
    estimatedHours: 600,
    defaultBudget: 150000,
    priority: "high",
    riskLevel: "high",
    objectives: "Successfully implement enterprise software solution, migrate existing data, customize workflows, and train users for maximum adoption and efficiency.",
    deliverables: "Configured software, migrated data, custom workflows, user training, documentation",
    successCriteria: "95% user adoption rate, 30% improvement in process efficiency, successful data migration with zero data loss",
    tags: ["enterprise", "software", "implementation", "training", "migration"],
    milestones: [
      {
        name: "Requirements Analysis",
        description: "Analyze current processes and define requirements",
        estimatedDays: 14,
        deliverables: "Requirements document, process mapping, gap analysis"
      },
      {
        name: "System Configuration",
        description: "Configure software according to requirements",
        estimatedDays: 30,
        deliverables: "Configured system, custom workflows, integrations"
      },
      {
        name: "Data Migration",
        description: "Migrate existing data to new system",
        estimatedDays: 21,
        deliverables: "Migrated data, data validation reports, backup procedures"
      },
      {
        name: "User Training",
        description: "Train users and create documentation",
        estimatedDays: 28,
        deliverables: "Training materials, user documentation, training sessions"
      },
      {
        name: "Go-Live & Support",
        description: "Launch system and provide post-implementation support",
        estimatedDays: 27,
        deliverables: "Live system, support documentation, performance monitoring"
      }
    ],
    tasks: [
      {
        name: "Conduct stakeholder interviews",
        description: "Interview key stakeholders to understand requirements",
        estimatedHours: 32,
        priority: "high",
        requiredSkills: ["Business Analysis", "Requirements Gathering", "Stakeholder Management"],
        dependencies: []
      },
      {
        name: "Map current processes",
        description: "Document existing business processes and workflows",
        estimatedHours: 40,
        priority: "high",
        requiredSkills: ["Process Mapping", "Business Analysis", "Documentation"],
        dependencies: ["Conduct stakeholder interviews"]
      },
      {
        name: "Configure user roles",
        description: "Set up user roles and permissions in the system",
        estimatedHours: 24,
        priority: "medium",
        requiredSkills: ["System Administration", "Security", "User Management"],
        dependencies: ["Map current processes"]
      }
    ],
    requiredRoles: ["Project Manager", "Business Analyst", "System Administrator", "Training Specialist"],
    requiredSkills: ["Enterprise Software", "Business Analysis", "Data Migration", "User Training", "Project Management"],
    teamSize: 5
  }
];

// Function to seed default templates
export async function seedDefaultTemplates() {
  try {
    for (const template of defaultTemplates) {
      const response = await fetch('/api/projects/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });
      
      if (!response.ok) {
        console.error(`Failed to create template: ${template.name}`);
      }
    }
    console.log('Default templates seeded successfully');
  } catch (error) {
    console.error('Error seeding default templates:', error);
  }
}
