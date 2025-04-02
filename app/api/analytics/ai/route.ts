import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { cookies } from 'next/headers';

export const runtime = 'nodejs'; // Need this for Prisma

// Add type interfaces
interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  status: string;
  category?: { name: string } | null;
}

interface SaleItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface Sale {
  id: string;
  date: Date;
  totalAmount: number;
  status: string;
  customer?: { name: string } | null;
  items: SaleItem[];
}

interface Transaction {
  id: string;
  date: Date;
  amount: number;
  type: string;
  category?: { name: string } | null;
  status: string;
  description?: string;
}

interface ProjectMember {
  userId: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
  progress: number;
  startDate?: Date | null;
  endDate?: Date | null;
  budget: number;
  members: ProjectMember[];
}

interface Employee {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  department: string | null;
  position: string | null;
  createdAt: Date;
}

interface AuthResult {
  userId: string;
  companyId: string;
}

export async function POST(req: Request) {
  try {
    // Verify authentication using the cookies object directly
    const cookiesObj = cookies();
    const auth = await verifyAuth(cookiesObj) as AuthResult | null;
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = auth.userId;
    const companyId = auth.companyId;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Get request body
    const requestData = await req.json();
    const { query, conversationHistory } = requestData;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Fetch data for analysis
    try {
      // Fetch inventory data
      const inventoryItems = await prisma.inventoryItem.findMany({
        where: { companyId },
        include: {
          category: true
        }
      }) as InventoryItem[];

      // Fetch sales data
      const sales = await prisma.invoice.findMany({
        where: { companyId },
        include: {
          customer: true,
          items: true
        }
      }) as Sale[];

      // Fetch finance data
      const financeTransactions = await prisma.transaction.findMany({
        where: { companyId },
        include: {
          category: true
        }
      }) as Transaction[];

      // Fetch projects data
      const projects = await prisma.project.findMany({
        where: { companyId },
        include: {
          members: true
        }
      }) as Project[];

      // Fetch employees data
      const employees = await prisma.user.findMany({
        where: {
          companyId
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          department: true,
          position: true,
          createdAt: true
        }
      }) as Employee[];

      // Format data for AI
      const aggregatedData = {
        inventory: inventoryItems.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          status: item.status,
          category: item.category?.name || 'Uncategorized'
        })),
        sales: sales.map(sale => ({
          id: sale.id,
          date: sale.date.toISOString(),
          amount: sale.totalAmount,
          customer: sale.customer?.name || 'Unknown',
          status: sale.status,
          items: sale.items.map(item => ({
            id: item.id,
            name: item.description,
            quantity: item.quantity,
            price: item.unitPrice
          }))
        })),
        finance: financeTransactions.map(transaction => ({
          id: transaction.id,
          date: transaction.date.toISOString(),
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category?.name || 'Uncategorized',
          status: transaction.status,
          description: transaction.description
        })),
        projects: projects.map(project => ({
          id: project.id,
          name: project.name,
          status: project.status,
          progress: project.progress,
          startDate: project.startDate?.toISOString(),
          endDate: project.endDate?.toISOString(),
          budget: project.budget,
          team: project.members.map(member => member.userId)
        })),
        employees: employees.map(employee => ({
          id: employee.id,
          name: employee.name,
          department: employee.department || 'General',
          position: employee.position || 'Staff',
          startDate: employee.createdAt.toISOString()
        }))
      };

      // Call OpenRouter AI API
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || process.env.NEXT_PUBLIC_OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-v3-base:free",
          "messages": [
            {
              "role": "system",
              "content": `You are an AI analytics assistant for an ERP system. Analyze the provided business data and answer questions about inventory, sales, finance, projects, and employees.
              
              IMPORTANT: Always respond in a conversational, helpful tone. Do NOT just list query results. Instead, analyze the data and provide meaningful insights.
              
              Maintain a conversational tone and remember previous parts of the conversation.
              
              When appropriate, include structured data tables to help illustrate your points.
              
              When appropriate, suggest visualizations to help understand the data. You can recommend:
              1. Bar charts for comparing values across categories
              2. Pie charts for showing proportions of a whole
              3. Line charts for trends over time
              4. Area charts for cumulative values over time
              
              Your response MUST be a JSON object with the following structure:
              {
                "text": "Your conversational analysis and insights here",
                "charts": [
                  {
                    "type": "bar|pie|line|area",
                    "title": "Descriptive chart title",
                    "data": [{"name": "Category1", "value": 100}, ...],
                    "xAxis": "name",  // Field name for x-axis (for bar/line charts)
                    "dataKey": "value", // Field name for the values
                    "color": "#hex"  // Optional hex color
                  }
                ],
                "tables": [
                  {
                    "title": "Table title",
                    "headers": ["Column1", "Column2", ...],
                    "rows": [
                      ["Value1", "Value2", ...],
                      ["Value1", "Value2", ...]
                    ]
                  }
                ]
              }
              
              The "charts" and "tables" arrays are optional but highly recommended when they help illustrate your analysis.
              
              Always focus on providing specific insights based on the data, not generic statements.`
            },
            ...(conversationHistory || []),
            {
              "role": "user",
              "content": JSON.stringify({
                query,
                data: aggregatedData
              })
            }
          ]
        })
      });

      if (!openRouterResponse.ok) {
        throw new Error('Failed to get AI response');
      }

      const result = await openRouterResponse.json();
      const aiContent = result.choices[0].message.content;
      
      // Process AI response
      try {
        // Try to parse as JSON
        const jsonResponse = JSON.parse(aiContent);
        
        // Ensure required properties exist
        if (!jsonResponse.text) {
          jsonResponse.text = "I've analyzed your data. Here are my findings.";
        }
        
        if (!jsonResponse.charts) {
          jsonResponse.charts = [];
        }
        
        if (!jsonResponse.tables) {
          jsonResponse.tables = [];
        }
        
        return NextResponse.json(jsonResponse);
      } catch (e) {
        // If not valid JSON, create a structured response from the text
        return NextResponse.json({
          text: aiContent,
          charts: [],
          tables: []
        });
      }

    } catch (error) {
      console.error('Error fetching data for AI analysis:', error);
      return NextResponse.json(
        { error: 'Error fetching data for AI analysis', details: error },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in analytics AI route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 