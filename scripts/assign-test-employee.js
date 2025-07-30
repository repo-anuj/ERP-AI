const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function assignTestEmployee() {
  try {
    const employeeId = '684dc914c43941f8cf8cc4ee';
    const companyId = '67ab6f97ed85baa0ef51d95d';
    
    console.log('Looking for employee:', employeeId);
    
    // Check if employee exists
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId }
    });
    
    if (!employee) {
      console.log('Employee not found');
      return;
    }
    
    console.log('Employee found:', employee.firstName, employee.lastName);
    
    // Get existing projects for this company
    const projects = await prisma.project.findMany({
      where: { companyId: companyId },
      take: 3 // Get first 3 projects
    });
    
    console.log('Found', projects.length, 'projects');
    
    if (projects.length === 0) {
      // Create a test project
      console.log('Creating test project...');
      
      const testProject = await prisma.project.create({
        data: {
          name: 'Test Employee Project',
          description: 'A test project for employee dashboard testing',
          type: 'internal',
          status: 'in_progress',
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          completionPercentage: 25,
          projectManager: {
            employeeId: employeeId,
            name: `${employee.firstName} ${employee.lastName}`,
            role: employee.position,
            department: employee.department
          },
          teamMembers: [
            {
              employeeId: employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              role: employee.position,
              department: employee.department
            }
          ],
          budget: 50000,
          expenses: 12500,
          priority: 'high',
          tags: ['test', 'employee-dashboard'],
          notes: 'Test project for employee dashboard functionality',
          companyId: companyId
        }
      });
      
      console.log('Created test project:', testProject.id);
      
      // Create some test tasks
      const tasks = [
        {
          name: 'Setup Development Environment',
          description: 'Configure development tools and environment',
          status: 'completed',
          priority: 'high',
          assigneeId: employeeId,
          assigneeName: `${employee.firstName} ${employee.lastName}`,
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          estimatedHours: 8,
          actualHours: 6.5,
          completionPercentage: 100,
          dependencies: [],
          notes: 'Completed ahead of schedule',
          companyId: companyId,
          projectId: testProject.id
        },
        {
          name: 'Implement User Authentication',
          description: 'Build secure user authentication system',
          status: 'in_progress',
          priority: 'high',
          assigneeId: employeeId,
          assigneeName: `${employee.firstName} ${employee.lastName}`,
          startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
          estimatedHours: 16,
          actualHours: 8.5,
          completionPercentage: 60,
          dependencies: [],
          notes: 'Making good progress, on track for completion',
          companyId: companyId,
          projectId: testProject.id
        },
        {
          name: 'Database Schema Design',
          description: 'Design and implement database schema',
          status: 'not_started',
          priority: 'medium',
          assigneeId: employeeId,
          assigneeName: `${employee.firstName} ${employee.lastName}`,
          startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
          dueDate: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
          estimatedHours: 12,
          actualHours: 0,
          completionPercentage: 0,
          dependencies: [],
          notes: 'Waiting for authentication to be completed',
          companyId: companyId,
          projectId: testProject.id
        }
      ];
      
      for (const taskData of tasks) {
        const task = await prisma.task.create({ data: taskData });
        console.log('Created task:', task.name);
      }
      
    } else {
      // Assign employee to existing projects
      console.log('Assigning employee to existing projects...');
      
      for (let i = 0; i < Math.min(2, projects.length); i++) {
        const project = projects[i];
        
        // Check if employee is already assigned
        const isManager = project.projectManager?.employeeId === employeeId;
        const isTeamMember = project.teamMembers?.some(member => member.employeeId === employeeId);
        
        if (!isManager && !isTeamMember) {
          // Add employee as team member
          const updatedTeamMembers = [
            ...(project.teamMembers || []),
            {
              employeeId: employeeId,
              name: `${employee.firstName} ${employee.lastName}`,
              role: employee.position,
              department: employee.department
            }
          ];
          
          await prisma.project.update({
            where: { id: project.id },
            data: { teamMembers: updatedTeamMembers }
          });
          
          console.log('Added employee to project:', project.name);
        } else {
          console.log('Employee already assigned to project:', project.name);
        }
      }
    }
    
    console.log('Assignment completed successfully!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

assignTestEmployee();
