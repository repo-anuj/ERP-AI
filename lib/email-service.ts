import nodemailer from 'nodemailer';
import { prisma } from '@/lib/prisma';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface ProjectReportData {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  budget: number;
  expenses: number;
  milestones: Array<{
    name: string;
    status: string;
    targetDate: string;
    completionDate?: string;
  }>;
  tasks: Array<{
    name: string;
    status: string;
    assignee: string;
    dueDate: string;
    progress: number;
  }>;
  teamMembers: Array<{
    name: string;
    role: string;
  }>;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Check if email configuration is available
      const emailUser = process.env.GMAIL_USER || process.env.EMAIL_USER;
      const emailPass = process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASSWORD;
      
      if (!emailUser || !emailPass) {
        console.warn('Email service not configured - missing environment variables');
        return;
      }

      const config: EmailConfig = {
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: emailUser,
          pass: emailPass,
        },
      };

      this.transporter = nodemailer.createTransport(config);
      
      // Verify connection
      if (this.transporter) {
        await this.transporter.verify();
      }
      this.isConfigured = true;
      console.log('Email service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize email service:', error);
      this.isConfigured = false;
    }
  }

  async sendEmail(to: string | string[], subject: string, html: string, text?: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.error('Email service not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.GMAIL_USER,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private htmlToText(html: string): string {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }

  generateProjectReportTemplate(data: ProjectReportData, reportType: 'weekly' | 'milestone' | 'completion'): EmailTemplate {
    const { projectName, status, progress, budget, expenses, milestones, tasks } = data;
    
    let subject = '';
    let title = '';
    
    switch (reportType) {
      case 'weekly':
        subject = `Weekly Progress Report - ${projectName}`;
        title = 'Weekly Progress Report';
        break;
      case 'milestone':
        subject = `Milestone Update - ${projectName}`;
        title = 'Milestone Achievement Report';
        break;
      case 'completion':
        subject = `Project Completion Report - ${projectName}`;
        title = 'Project Completion Report';
        break;
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .progress-bar { background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
          .progress-fill { background: #28a745; height: 100%; transition: width 0.3s ease; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
          .status-planning { background: #ffc107; color: #000; }
          .status-in_progress { background: #007bff; color: #fff; }
          .status-completed { background: #28a745; color: #fff; }
          .status-on_hold { background: #6c757d; color: #fff; }
          .section { margin: 20px 0; padding: 15px; border: 1px solid #dee2e6; border-radius: 8px; }
          .task-item { padding: 10px; border-bottom: 1px solid #eee; }
          .task-item:last-child { border-bottom: none; }
          .budget-info { display: flex; justify-content: space-between; margin: 10px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; font-size: 12px; color: #6c757d; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
          <h2>${projectName}</h2>
          <p><strong>Status:</strong> <span class="status-badge status-${status}">${status.replace('_', ' ')}</span></p>
          <p><strong>Overall Progress:</strong> ${progress}%</p>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${progress}%"></div>
          </div>
        </div>

        <div class="section">
          <h3>📊 Budget Overview</h3>
          <div class="budget-info">
            <span><strong>Total Budget:</strong> $${budget.toLocaleString()}</span>
            <span><strong>Expenses:</strong> $${expenses.toLocaleString()}</span>
            <span><strong>Remaining:</strong> $${(budget - expenses).toLocaleString()}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${Math.min((expenses / budget) * 100, 100)}%; background: ${expenses > budget ? '#dc3545' : '#28a745'}"></div>
          </div>
        </div>

        <div class="section">
          <h3>🎯 Milestones</h3>
          ${milestones.map(milestone => `
            <div class="task-item">
              <strong>${milestone.name}</strong>
              <span class="status-badge status-${milestone.status}">${milestone.status}</span>
              <br>
              <small>Target: ${new Date(milestone.targetDate).toLocaleDateString()}</small>
              ${milestone.completionDate ? `<small> | Completed: ${new Date(milestone.completionDate).toLocaleDateString()}</small>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="section">
          <h3>📋 Recent Tasks</h3>
          ${tasks.slice(0, 10).map(task => `
            <div class="task-item">
              <strong>${task.name}</strong> - ${task.assignee}
              <span class="status-badge status-${task.status}">${task.status.replace('_', ' ')}</span>
              <br>
              <small>Due: ${new Date(task.dueDate).toLocaleDateString()} | Progress: ${task.progress}%</small>
              <div class="progress-bar" style="height: 8px; margin-top: 5px;">
                <div class="progress-fill" style="width: ${task.progress}%"></div>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>This is an automated report generated by your ERP system.</p>
          <p>For more details, please log in to your project dashboard.</p>
        </div>
      </body>
      </html>
    `;

    const text = `
      ${title}
      ${projectName}
      
      Status: ${status.replace('_', ' ')}
      Overall Progress: ${progress}%
      
      Budget Overview:
      - Total Budget: $${budget.toLocaleString()}
      - Expenses: $${expenses.toLocaleString()}
      - Remaining: $${(budget - expenses).toLocaleString()}
      
      Milestones:
      ${milestones.map(m => `- ${m.name}: ${m.status} (Target: ${new Date(m.targetDate).toLocaleDateString()})`).join('\n')}
      
      Recent Tasks:
      ${tasks.slice(0, 10).map(t => `- ${t.name} (${t.assignee}): ${t.status} - ${t.progress}%`).join('\n')}
      
      This is an automated report generated by your ERP system.
    `;

    return { subject, html, text };
  }

  async sendProjectReport(
    projectId: string,
    recipients: string[],
    reportType: 'weekly' | 'milestone' | 'completion'
  ): Promise<boolean> {
    try {
      // Fetch project data
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          tasks: {
            take: 10,
            orderBy: { updatedAt: 'desc' }
          },
          milestones: {
            orderBy: { targetDate: 'asc' }
          }
        }
      });

      if (!project) {
        console.error('Project not found:', projectId);
        return false;
      }

      // Format project data
      const reportData: ProjectReportData = {
        projectId: project.id,
        projectName: project.name,
        status: project.status,
        progress: project.completionPercentage,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate.toISOString(),
        budget: project.budget,
        expenses: project.expenses,
        milestones: project.milestones.map(m => ({
          name: m.name,
          status: m.status,
          targetDate: m.targetDate.toISOString(),
          completionDate: m.completionDate?.toISOString()
        })),
        tasks: project.tasks.map(t => ({
          name: t.name,
          status: t.status,
          assignee: t.assigneeName,
          dueDate: t.dueDate.toISOString(),
          progress: t.completionPercentage
        })),
        teamMembers: [
          { name: project.projectManager.name, role: 'Project Manager' },
          ...project.teamMembers.map(tm => ({ name: tm.name, role: tm.role || 'Team Member' }))
        ]
      };

      // Generate email template
      const template = this.generateProjectReportTemplate(reportData, reportType);

      // Send email
      const success = await this.sendEmail(recipients, template.subject, template.html, template.text);

      if (success) {
        // Save report record
        await prisma.projectReport.create({
          data: {
            projectId,
            reportType,
            title: template.subject,
            content: reportData as any,
            recipients,
            status: 'sent',
            sentAt: new Date(),
            isAutomatic: true,
            companyId: project.companyId
          }
        });
      }

      return success;
    } catch (error) {
      console.error('Failed to send project report:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
export default emailService;
