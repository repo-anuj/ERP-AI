import { NextResponse } from 'next/server';

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
    // Get request body first to check if we have enhanced data
    const requestData = await req.json();
    const { query, conversationHistory, enhancedData } = requestData;

    // Validate query is present
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // If enhanced data is not provided, return an error - we can't fetch directly in Edge Runtime
    if (!enhancedData) {
      console.log('No enhanced data provided, and we cannot use Prisma in Edge Runtime');
      return NextResponse.json(
        { error: 'Enhanced data is required. Please provide data from client.' },
        { status: 400 }
      );
    }

    console.log('Using pre-fetched data from client');
    const aggregatedData = enhancedData;
    
    // Now we can process the query with the OpenRouter API
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'No OpenRouter API key configured' },
        { status: 500 }
      );
    }

    // Format data for prompt 
    const dataForAI = {
      inventory: aggregatedData.inventory || { items: [], metrics: {} },
      sales: aggregatedData.sales || { transactions: [], metrics: {} },
      finance: aggregatedData.finance || { transactions: [], metrics: {} },
      projects: aggregatedData.projects || [],
      employees: aggregatedData.employees || [],
      query: query,
      conversation: conversationHistory || []
    };

    const currentDate = new Date().toISOString().split('T')[0];
    
    // Prepare prompt for better analysis
    const systemPrompt = `You are an AI analytics assistant for an ERP system. Today is ${currentDate}.
    
    Analyze the business data provided and answer questions about inventory, sales, finance, projects, and employees.
    
    IMPORTANT: 
    - Always respond in a conversational, helpful tone.
    - Provide meaningful insights based on actual data provided.
    - Include specific numbers and metrics to support your analysis.
    - When appropriate, suggest visualizations to help understand the data.
    
    Your response must be a valid JSON object with this exact structure:
    {
      "text": "Your conversational analysis and insights here",
      "charts": [
        {
          "type": "bar|pie|line|area",
          "title": "Descriptive chart title",
          "data": [{"name": "Category1", "value": 100}, ...],
          "xAxis": "name",
          "dataKey": "value", 
          "color": "#hex"
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
    }`;

    // Use OpenRouter with Gemini model
    let aiResponse;
    try {
      // Use OpenRouter with Gemini model
      const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://erp-ai.vercel.app", 
          "X-Title": "ERP-AI Analytics Assistant",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-pro-exp-03-25:free",
          messages: [
            { 
              role: "user", 
              content: [
                {
                  type: "text",
                  text: `${systemPrompt}\n\nAnalyze this data and answer the following query: "${query}"\n\n${JSON.stringify(dataForAI, null, 2)}`
                }
              ]
            }
          ]
        })
      });
      
      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error('OpenRouter error:', errorText);
        throw new Error(`OpenRouter API error: ${openRouterResponse.status} ${errorText}`);
      }
      
      const result = await openRouterResponse.json();
      if (result.choices && result.choices[0]?.message?.content?.[0]?.text) {
        aiResponse = result.choices[0].message.content[0].text;
      } else {
        console.error('Unexpected response format from OpenRouter:', JSON.stringify(result));
        throw new Error('Invalid response format from OpenRouter');
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return NextResponse.json(
        { error: 'Failed to generate AI analysis', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
    
    // Try to parse the response as JSON
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
      
      // Validate and ensure the response has the correct structure
      if (!parsedResponse.text) {
        parsedResponse.text = "I've analyzed your data and prepared insights.";
      }
      
      if (!parsedResponse.charts) {
        parsedResponse.charts = [];
      }
      
      if (!parsedResponse.tables) {
        parsedResponse.tables = [];
      }
      
    } catch (e) {
      // If not valid JSON, wrap in our expected format
      parsedResponse = {
        text: aiResponse,
        charts: [],
        tables: []
      };
    }
    
    return NextResponse.json(parsedResponse);
    
  } catch (error) {
    console.error('Error in AI analytics route:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}