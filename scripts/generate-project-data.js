/**
 * This script generates sample project data for the ERP-AI system
 * Run with: node scripts/generate-project-data.js
 * The output will be saved to project-data.json
 */

const fs = require('fs');
const { ObjectId } = require('mongodb');

// Helper function to generate random dates within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Helper function to generate random integer within a range
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to pick a random item from an array
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Helper function to generate MongoDB ObjectId
function generateObjectId() {
  return new ObjectId().toString();
}

// Helper function to format currency
function formatCurrency(amount) {
  return parseFloat(amount.toFixed(2));
}

// Generate sample data
function generateProjectData() {
  const currentDate = new Date();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(currentDate.getFullYear() - 1);

  // Load the sample data to get company ID and employees
  let sampleData, salesData;
  try {
    sampleData = JSON.parse(fs.readFileSync('sample-data.json', 'utf8'));
    salesData = JSON.parse(fs.readFileSync('sales-data.json', 'utf8'));
  } catch (error) {
    console.error('Error loading required data files. Please run generate-sample-data.js and generate-sales-data.js first.');
    process.exit(1);
  }

  const companyId = sampleData.Company[0]._id;
  const employees = sampleData.Employee;
  const customers = salesData.Customer;

  // Generate project data
  const projects = [];
  const projectStatuses = ["planning", "in_progress", "on_hold", "completed", "cancelled"];
  const projectTypes = ["internal", "client", "research", "maintenance"];
  const projectNames = {
    "internal": [
      "ERP System Implementation", "Office Relocation", "IT Infrastructure Upgrade",
      "Employee Training Program", "Process Optimization", "Digital Transformation",
      "Data Migration", "Security Enhancement", "Compliance Audit", "Brand Refresh"
    ],
    "client": [
      "Website Redesign", "Mobile App Development", "E-commerce Platform", 
      "CRM Implementation", "Marketing Campaign", "Product Launch",
      "Business Intelligence Dashboard", "Cloud Migration", "Custom Software Development", "SEO Optimization"
    ],
    "research": [
      "Market Analysis", "Competitor Research", "New Technology Evaluation",
      "Product Feasibility Study", "User Experience Research", "Industry Trends Analysis",
      "Customer Satisfaction Survey", "Emerging Markets Research", "AI Implementation Study", "Sustainability Initiative"
    ],
    "maintenance": [
      "System Upgrade", "Database Optimization", "Server Maintenance",
      "Software Patching", "Network Infrastructure Review", "Security Audit",
      "Performance Optimization", "Backup System Implementation", "Disaster Recovery Planning", "Code Refactoring"
    ]
  };
  
  // Generate 15 projects
  for (let i = 0; i < 15; i++) {
    const type = randomItem(projectTypes);
    const name = randomItem(projectNames[type]);
    
    // Determine project dates
    const startDate = randomDate(oneYearAgo, new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000)); // Start between a year ago and a month ago
    
    // Determine status and end date based on start date
    let status, endDate, completionPercentage;
    const daysSinceStart = Math.floor((currentDate - startDate) / (1000 * 60 * 60 * 24));
    const projectDuration = randomInt(30, 180); // Projects last between 1-6 months
    
    if (daysSinceStart < projectDuration * 0.2) {
      // Project is in early stages
      status = Math.random() > 0.3 ? "planning" : "in_progress";
      completionPercentage = randomInt(5, 20);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + projectDuration);
    } else if (daysSinceStart < projectDuration * 0.6) {
      // Project is in middle stages
      status = Math.random() > 0.2 ? "in_progress" : (Math.random() > 0.5 ? "planning" : "on_hold");
      completionPercentage = randomInt(20, 60);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + projectDuration);
    } else if (daysSinceStart < projectDuration) {
      // Project is in late stages
      status = Math.random() > 0.3 ? "in_progress" : (Math.random() > 0.5 ? "on_hold" : "completed");
      completionPercentage = status === "completed" ? 100 : randomInt(60, 95);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + projectDuration);
    } else {
      // Project should be finished by now
      status = Math.random() > 0.2 ? "completed" : (Math.random() > 0.5 ? "in_progress" : "cancelled");
      completionPercentage = status === "completed" ? 100 : (status === "cancelled" ? randomInt(10, 90) : randomInt(80, 95));
      endDate = status === "completed" || status === "cancelled" ? new Date(startDate.getTime() + randomInt(projectDuration * 0.8, projectDuration * 1.2) * 24 * 60 * 60 * 1000) : new Date(startDate.getTime() + projectDuration * 24 * 60 * 60 * 1000);
    }
    
    // If end date is in the future, adjust it
    if (endDate > currentDate && (status === "completed" || status === "cancelled")) {
      endDate = new Date(currentDate.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000);
    }
    
    // Assign project manager and team members
    const projectManager = randomItem(employees.filter(emp => emp.position.includes("Manager") || emp.department === "Engineering"));
    
    // Select 3-8 team members
    const teamSize = randomInt(3, 8);
    const teamMembers = [];
    const assignedEmployees = [projectManager._id];
    
    for (let j = 0; j < teamSize; j++) {
      let teamMember;
      do {
        teamMember = randomItem(employees);
      } while (assignedEmployees.includes(teamMember._id));
      
      assignedEmployees.push(teamMember._id);
      teamMembers.push({
        employeeId: teamMember._id,
        name: `${teamMember.firstName} ${teamMember.lastName}`,
        role: teamMember.position,
        department: teamMember.department
      });
    }
    
    // Assign client for client projects
    let client = null;
    if (type === "client") {
      client = randomItem(customers);
    }
    
    // Generate budget
    const budget = type === "internal" || type === "maintenance" 
      ? randomInt(10000, 50000) 
      : (type === "client" ? randomInt(20000, 100000) : randomInt(15000, 80000));
    
    // Calculate expenses based on completion percentage
    const expenses = formatCurrency(budget * (completionPercentage / 100) * (0.8 + Math.random() * 0.4));
    
    // Create project
    const projectId = generateObjectId();
    projects.push({
      _id: projectId,
      name: name,
      description: `${name} - ${type.charAt(0).toUpperCase() + type.slice(1)} project`,
      type: type,
      status: status,
      startDate: startDate,
      endDate: endDate,
      completionPercentage: completionPercentage,
      projectManager: {
        employeeId: projectManager._id,
        name: `${projectManager.firstName} ${projectManager.lastName}`,
        department: projectManager.department
      },
      teamMembers: teamMembers,
      client: client ? {
        customerId: client._id,
        name: client.name,
        company: client.company,
        email: client.email
      } : null,
      budget: budget,
      expenses: expenses,
      priority: randomItem(["low", "medium", "high"]),
      tags: [type, randomItem(["critical", "innovation", "maintenance", "growth", "compliance", "cost-saving"])],
      notes: Math.random() > 0.7 ? `${randomItem(["Key strategic initiative", "Executive sponsor: CEO", "Cross-department collaboration", "Potential for expansion", "Phase 1 of multi-phase project"])}` : "",
      companyId: companyId,
      createdAt: new Date(startDate.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
      updatedAt: randomDate(startDate, currentDate)
    });
  }

  // Generate task data
  const tasks = [];
  const taskStatuses = ["not_started", "in_progress", "completed", "blocked"];
  const taskPriorities = ["low", "medium", "high", "urgent"];
  
  // Task templates by project type
  const taskTemplates = {
    "internal": [
      "Requirements Gathering", "System Design", "Implementation Planning", 
      "Resource Allocation", "Stakeholder Meetings", "Testing Strategy", 
      "Training Materials", "Documentation", "Deployment Planning", "Post-Implementation Review"
    ],
    "client": [
      "Client Kickoff Meeting", "Requirements Analysis", "Proposal Development", 
      "Design Phase", "Development Sprint", "Client Review", 
      "Quality Assurance", "User Acceptance Testing", "Deployment", "Client Training"
    ],
    "research": [
      "Research Planning", "Data Collection", "Literature Review", 
      "Methodology Development", "Data Analysis", "Findings Compilation", 
      "Report Drafting", "Peer Review", "Presentation Preparation", "Publication"
    ],
    "maintenance": [
      "System Audit", "Issue Identification", "Backup Creation", 
      "Implementation of Fixes", "Performance Testing", "Security Review", 
      "User Notification", "Documentation Update", "Rollback Planning", "Post-Maintenance Testing"
    ]
  };
  
  // Generate tasks for each project
  projects.forEach(project => {
    const projectType = project.type;
    const taskCount = randomInt(5, 15); // 5-15 tasks per project
    const taskTemplateList = taskTemplates[projectType];
    
    // Create a copy of task templates to avoid duplicates
    const availableTasks = [...taskTemplateList];
    
    for (let i = 0; i < taskCount && availableTasks.length > 0; i++) {
      // Pick a random task name and remove it from available tasks
      const taskIndex = randomInt(0, availableTasks.length - 1);
      const taskName = availableTasks[taskIndex];
      availableTasks.splice(taskIndex, 1);
      
      // Determine task dates
      const taskStartDate = randomDate(project.startDate, new Date(Math.min(project.endDate.getTime(), currentDate.getTime())));
      
      // Determine status and end date based on project status and completion
      let taskStatus, taskEndDate;
      
      if (project.status === "planning") {
        taskStatus = Math.random() > 0.7 ? "not_started" : (Math.random() > 0.5 ? "in_progress" : "completed");
      } else if (project.status === "in_progress") {
        taskStatus = Math.random() > 0.1 ? (Math.random() > 0.4 ? "in_progress" : (Math.random() > 0.5 ? "completed" : "not_started")) : "blocked";
      } else if (project.status === "on_hold") {
        taskStatus = Math.random() > 0.2 ? (Math.random() > 0.6 ? "in_progress" : "not_started") : (Math.random() > 0.5 ? "completed" : "blocked");
      } else if (project.status === "completed") {
        taskStatus = Math.random() > 0.1 ? "completed" : "in_progress";
      } else { // cancelled
        taskStatus = Math.random() > 0.3 ? (Math.random() > 0.5 ? "not_started" : "in_progress") : (Math.random() > 0.5 ? "completed" : "blocked");
      }
      
      // Set task end date based on status
      if (taskStatus === "completed") {
        taskEndDate = randomDate(taskStartDate, new Date(Math.min(project.endDate.getTime(), currentDate.getTime())));
      } else if (taskStatus === "in_progress" || taskStatus === "blocked") {
        taskEndDate = randomDate(currentDate, project.endDate);
      } else { // not_started
        taskEndDate = randomDate(currentDate, new Date(project.endDate.getTime() + 7 * 24 * 60 * 60 * 1000));
      }
      
      // Ensure task end date is not after project end date for completed projects
      if ((project.status === "completed" || project.status === "cancelled") && taskEndDate > project.endDate) {
        taskEndDate = project.endDate;
      }
      
      // Assign task to team member
      const assignee = randomItem(project.teamMembers);
      
      // Generate estimated and actual hours
      const estimatedHours = randomInt(4, 40);
      const actualHours = taskStatus === "completed" ? estimatedHours * (0.7 + Math.random() * 0.6) : (taskStatus === "in_progress" ? estimatedHours * (0.1 + Math.random() * 0.7) : 0);
      
      tasks.push({
        _id: generateObjectId(),
        projectId: project._id,
        name: taskName,
        description: `${taskName} for ${project.name}`,
        status: taskStatus,
        priority: randomItem(taskPriorities),
        assigneeId: assignee.employeeId,
        assigneeName: assignee.name,
        startDate: taskStartDate,
        dueDate: taskEndDate,
        estimatedHours: estimatedHours,
        actualHours: formatCurrency(actualHours),
        completionPercentage: taskStatus === "completed" ? 100 : (taskStatus === "in_progress" ? randomInt(10, 90) : (taskStatus === "blocked" ? randomInt(10, 50) : 0)),
        dependencies: [], // Will be filled later
        notes: Math.random() > 0.8 ? `${randomItem(["Requires special attention", "Discuss with team", "Check with client first", "May need additional resources", "Critical path task"])}` : "",
        companyId: companyId,
        createdAt: new Date(taskStartDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000),
        updatedAt: taskStatus === "not_started" ? new Date(taskStartDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000) : randomDate(taskStartDate, currentDate)
      });
    }
  });
  
  // Add task dependencies (for tasks in the same project)
  tasks.forEach(task => {
    const projectTasks = tasks.filter(t => t.projectId === task.projectId && t._id !== task._id);
    
    // Add 0-2 dependencies
    const dependencyCount = Math.min(randomInt(0, 2), projectTasks.length);
    
    for (let i = 0; i < dependencyCount; i++) {
      let dependency;
      do {
        dependency = randomItem(projectTasks);
      } while (task.dependencies.includes(dependency._id));
      
      task.dependencies.push(dependency._id);
    }
  });

  // Generate milestone data
  const milestones = [];
  
  // Milestone templates by project type
  const milestoneTemplates = {
    "internal": [
      "Project Kickoff", "Requirements Finalized", "Design Approval", 
      "Implementation Complete", "Testing Complete", "Training Complete", "Go Live"
    ],
    "client": [
      "Contract Signed", "Requirements Approved", "Design Approval", 
      "Development Complete", "User Acceptance Testing", "Client Approval", "Project Delivery"
    ],
    "research": [
      "Research Plan Approved", "Data Collection Complete", "Analysis Complete", 
      "Initial Findings Review", "Final Report Submission", "Presentation to Stakeholders"
    ],
    "maintenance": [
      "Audit Complete", "Issues Identified", "Fixes Implemented", 
      "Testing Complete", "System Restored", "Documentation Updated"
    ]
  };
  
  // Generate milestones for each project
  projects.forEach(project => {
    const projectType = project.type;
    const milestoneCount = randomInt(3, 6); // 3-6 milestones per project
    const milestoneTemplateList = milestoneTemplates[projectType];
    
    // Create a copy of milestone templates to avoid duplicates
    const availableMilestones = [...milestoneTemplateList];
    
    // Calculate milestone dates based on project duration
    const projectDuration = project.endDate.getTime() - project.startDate.getTime();
    
    for (let i = 0; i < milestoneCount && i < availableMilestones.length; i++) {
      // Pick a milestone name in order (to maintain chronological sequence)
      const milestoneName = availableMilestones[i];
      
      // Calculate target date based on position in sequence
      const targetDate = new Date(project.startDate.getTime() + (projectDuration * (i + 1)) / (milestoneCount + 1));
      
      // Determine status based on current date and project status
      let status;
      
      if (targetDate > currentDate) {
        status = "pending";
      } else {
        if (project.status === "completed") {
          status = "completed";
        } else if (project.status === "cancelled") {
          status = Math.random() > 0.3 ? "missed" : (Math.random() > 0.5 ? "completed" : "pending");
        } else {
          status = Math.random() > 0.2 ? "completed" : (Math.random() > 0.5 ? "pending" : "missed");
        }
      }
      
      // Adjust completion date based on status
      let completionDate = null;
      if (status === "completed") {
        completionDate = new Date(targetDate.getTime() + randomInt(-5, 5) * 24 * 60 * 60 * 1000);
        
        // Ensure completion date is not after current date
        if (completionDate > currentDate) {
          completionDate = new Date(currentDate.getTime() - randomInt(1, 3) * 24 * 60 * 60 * 1000);
        }
        
        // Ensure completion date is not before project start date
        if (completionDate < project.startDate) {
          completionDate = new Date(project.startDate.getTime() + randomInt(1, 10) * 24 * 60 * 60 * 1000);
        }
      }
      
      milestones.push({
        _id: generateObjectId(),
        projectId: project._id,
        name: milestoneName,
        description: `${milestoneName} for ${project.name}`,
        targetDate: targetDate,
        completionDate: completionDate,
        status: status,
        deliverables: Math.random() > 0.5 ? `${randomItem(["Documentation", "Report", "Prototype", "Design", "Code", "Test Results", "Training Materials"])}` : "",
        notes: Math.random() > 0.8 ? `${randomItem(["Critical milestone", "Client review required", "Executive presentation", "Budget approval point", "Go/No-go decision"])}` : "",
        companyId: companyId,
        createdAt: new Date(project.startDate.getTime() - randomInt(1, 7) * 24 * 60 * 60 * 1000),
        updatedAt: status === "completed" ? completionDate : randomDate(project.startDate, currentDate)
      });
    }
  });

  // Generate project analytics data
  const projectAnalytics = [];
  
  // Project completion rate by department
  const departments = [...new Set(employees.map(emp => emp.department))];
  
  departments.forEach(department => {
    const departmentProjects = projects.filter(project => 
      project.projectManager.department === department || 
      project.teamMembers.some(member => member.department === department)
    );
    
    if (departmentProjects.length === 0) {
      return;
    }
    
    const completedProjects = departmentProjects.filter(project => project.status === "completed");
    const cancelledProjects = departmentProjects.filter(project => project.status === "cancelled");
    const ongoingProjects = departmentProjects.filter(project => project.status !== "completed" && project.status !== "cancelled");
    
    const completionRate = departmentProjects.length > 0 ? (completedProjects.length / departmentProjects.length) * 100 : 0;
    const cancellationRate = departmentProjects.length > 0 ? (cancelledProjects.length / departmentProjects.length) * 100 : 0;
    
    // Calculate average completion percentage for ongoing projects
    const avgCompletionPercentage = ongoingProjects.length > 0 
      ? ongoingProjects.reduce((sum, project) => sum + project.completionPercentage, 0) / ongoingProjects.length 
      : 0;
    
    projectAnalytics.push({
      _id: generateObjectId(),
      type: "department_performance",
      department: department,
      totalProjects: departmentProjects.length,
      completedProjects: completedProjects.length,
      cancelledProjects: cancelledProjects.length,
      ongoingProjects: ongoingProjects.length,
      completionRate: formatCurrency(completionRate),
      cancellationRate: formatCurrency(cancellationRate),
      averageCompletionPercentage: formatCurrency(avgCompletionPercentage),
      companyId: companyId,
      createdAt: currentDate,
      updatedAt: currentDate
    });
  });
  
  // Project budget performance
  const budgetPerformance = {
    _id: generateObjectId(),
    type: "budget_performance",
    totalBudget: formatCurrency(projects.reduce((sum, project) => sum + project.budget, 0)),
    totalExpenses: formatCurrency(projects.reduce((sum, project) => sum + project.expenses, 0)),
    underBudgetProjects: projects.filter(project => project.expenses <= project.budget).length,
    overBudgetProjects: projects.filter(project => project.expenses > project.budget).length,
    averageBudgetUtilization: formatCurrency((projects.reduce((sum, project) => sum + project.expenses, 0) / projects.reduce((sum, project) => sum + project.budget, 0)) * 100),
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  projectAnalytics.push(budgetPerformance);
  
  // Project timeline performance
  const completedProjects = projects.filter(project => project.status === "completed");
  let onTimeProjects = 0;
  let delayedProjects = 0;
  let averageDelay = 0;
  
  completedProjects.forEach(project => {
    const plannedDuration = (project.endDate.getTime() - project.startDate.getTime()) / (24 * 60 * 60 * 1000);
    const actualDuration = (project.updatedAt.getTime() - project.startDate.getTime()) / (24 * 60 * 60 * 1000);
    
    if (actualDuration <= plannedDuration) {
      onTimeProjects++;
    } else {
      delayedProjects++;
      averageDelay += (actualDuration - plannedDuration);
    }
  });
  
  if (delayedProjects > 0) {
    averageDelay /= delayedProjects;
  }
  
  const timelinePerformance = {
    _id: generateObjectId(),
    type: "timeline_performance",
    totalCompletedProjects: completedProjects.length,
    onTimeProjects: onTimeProjects,
    delayedProjects: delayedProjects,
    onTimePercentage: completedProjects.length > 0 ? formatCurrency((onTimeProjects / completedProjects.length) * 100) : 0,
    averageDelayDays: formatCurrency(averageDelay),
    companyId: companyId,
    createdAt: currentDate,
    updatedAt: currentDate
  };
  
  projectAnalytics.push(timelinePerformance);

  // Combine all data
  const projectData = {
    Project: projects,
    Task: tasks,
    Milestone: milestones,
    ProjectAnalytics: projectAnalytics
  };

  return projectData;
}

// Generate the data
const projectData = generateProjectData();

// Write to file
fs.writeFileSync('project-data.json', JSON.stringify(projectData, null, 2));
console.log('Project data generated and saved to project-data.json');
