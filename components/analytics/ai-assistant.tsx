'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Brain,
  Send,
  RefreshCw,
  BarChart,
  PieChart,
  LineChart,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
  History,
  Sparkles,
  Lightbulb,
  Trash2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import {
  ChartRenderer,
  TableComponent,
  VisualizationContainer,
  ChartData,
  TableData
} from './ai-components';

// Types for messages
type MessageRole = 'user' | 'assistant' | 'system';

interface Message {
  role: MessageRole;
  content: string;
  timestamp: Date;
  id?: string;
  visualizations?: {
    charts?: ChartData[];
    tables?: TableData[];
  };
}

interface AIResponse {
  text: string;
  charts?: ChartData[];
  tables?: TableData[];
}

interface InventoryMetrics {
  totalItems: number;
  totalQuantity: number;
  totalValue: number;
  lowStock: number;
  categories: number;
}

interface SalesMetrics {
  totalSales: number;
  totalRevenue: number;
  averageSale: number;
  pendingPayments: number;
  topCustomers: { name: string; amount: number }[];
}

interface FinanceMetrics {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  cashFlow: number;
  topExpenseCategories: { name: string; amount: number }[];
  topIncomeCategories: { name: string; amount: number }[];
}

interface AggregatedData {
  inventory: {
    items: any[];
    metrics: InventoryMetrics;
  };
  sales: {
    transactions: any[];
    metrics: SalesMetrics;
  };
  finance: {
    transactions: any[];
    metrics: FinanceMetrics;
  };
  projects: any[];
  employees: any[];
  lastUpdated?: string;
}

interface AIAssistantProps {
  aggregatedData: AggregatedData;
  isLoading?: boolean;
}

// Keywords that trigger data analysis mode
const ANALYSIS_KEYWORDS = [
  'analyze', 'analysis', 'compare', 'trend', 'report', 'statistics',
  'metrics', 'performance', 'calculate', 'measure', 'visualize',
  'chart', 'graph', 'table', 'dashboard', 'kpi', 'forecast',
  'inventory', 'sales', 'finance', 'projects', 'employees',
  'revenue', 'profit', 'loss', 'budget', 'expense'
];

// Suggested queries for the user
const SUGGESTED_QUERIES = [
  'Show me sales trends over the last period',
  'Compare revenue and expenses by month',
  'What are my top selling products?',
  'Analyze inventory turnover rate',
  'Show me project profitability',
  'Which employees have the highest sales?',
  'What is my current cash flow status?',
  'Identify products with low stock',
  'Compare budget vs actual expenses',
  'What is the overall business health?'
];

// Generate a unique ID for messages
const generateId = () => Math.random().toString(36).substring(2, 15);

export function AIAssistant({ aggregatedData, isLoading = false }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'I am your AI analytics assistant. I can help analyze your business data and provide insights about inventory, sales, finance, projects, and employees. How can I help you today?',
      timestamp: new Date(),
      id: generateId()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [dataPreloaded, setDataPreloaded] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [savedQueries, setSavedQueries] = useState<{id: string, query: string}[]>([]);
  const [queryHistory, setQueryHistory] = useState<{id: string, query: string, timestamp: Date}[]>([]);

  // Preprocess and store data for faster AI responses
  useEffect(() => {
    if (aggregatedData && !isLoading && !dataPreloaded) {
      console.log('Preloading data for AI assistant');
      setDataPreloaded(true);
    }
  }, [aggregatedData, isLoading, dataPreloaded]);

  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to determine if a message is conversational
  const isConversational = (message: string): boolean => {
    const lowerCaseMessage = message.toLowerCase();
    return !ANALYSIS_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));
  };

  // Function to detect if analysis mode should be activated based on message content
  const detectAnalysisMode = (message: string): boolean => {
    if (!message.trim()) return false;
    const lowerCaseMessage = message.toLowerCase();
    return ANALYSIS_KEYWORDS.some(keyword => lowerCaseMessage.includes(keyword));
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    const messageId = generateId();
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date(),
      id: messageId
    };

    // Add to query history
    setQueryHistory(prev => [
      { id: messageId, query: inputValue, timestamp: new Date() },
      ...prev.slice(0, 19) // Keep only the last 20 queries
    ]);

    // Determine if the message is conversational
    const shouldAnalyze = !isConversational(inputValue);
    setIsAnalysisMode(shouldAnalyze);

    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputValue('');
    setIsAiThinking(true);
    setAiResponse(null);

    try {
      const conversationHistory = messages
        .filter(msg => msg.role !== 'system')
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));

      // Use backend API for analysis mode
      if (shouldAnalyze) {
        // Enhanced data payload with metrics for analysis
        const enhancedDataPayload = {
          inventory: aggregatedData.inventory || { metrics: {}, items: [] },
          sales: aggregatedData.sales || { metrics: {}, transactions: [] },
          finance: aggregatedData.finance || { metrics: {}, transactions: [] },
          projects: aggregatedData.projects || [],
          employees: aggregatedData.employees || [],
          lastUpdated: aggregatedData.lastUpdated || new Date().toISOString()
        };

        const apiResponse = await fetch('/api/analytics/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.content,
            conversationHistory,
            analyze: true,
            enhancedData: enhancedDataPayload
          })
        });

        if (!apiResponse.ok) {
          throw new Error('Failed to get AI response');
        }

        const result = await apiResponse.json();

        // Parse the response for visualizations
        if (result) {
          setAiResponse(result);
        }
      } else {
        // Use OpenAI API for regular chat
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: [
              {
                "role": "system",
                "content": shouldAnalyze
                ? `You are a helpful ERP analytics assistant with knowledge about business operations, inventory management, sales, finance, project management, and employee management.

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
                }`
                :
                `You are a helpful conversational assistant for an ERP system. Respond in a natural, helpful way to questions about business operations and ERP systems. You don't need to analyze any data right now - just chat with the user in a friendly manner.

                If the user asks a question that would require data analysis, you can suggest they use keywords like "analyze", "report", or "metrics" to trigger the data analysis capabilities.`
              },
              ...conversationHistory,
              {
                "role": "user",
                "content": shouldAnalyze
                ? JSON.stringify({
                    query: userMessage.content,
                    data: {
                      inventorySummary: aggregatedData.inventory.metrics,
                      inventoryItems: aggregatedData.inventory.items.slice(0, 20),
                      salesSummary: aggregatedData.sales.metrics,
                      recentSales: aggregatedData.sales.transactions.slice(0, 10),
                      financeSummary: aggregatedData.finance.metrics,
                      recentTransactions: aggregatedData.finance.transactions.slice(0, 10),
                      projectCount: aggregatedData.projects.length,
                      projects: aggregatedData.projects.slice(0, 10),
                      employeeCount: aggregatedData.employees.length,
                      lastUpdated: aggregatedData.lastUpdated
                    },
                    conversationHistory: conversationHistory
                  })
                : userMessage.content
              }
            ]
          })
        });

        if (!response.ok) {
          throw new Error('Failed to get AI response');
        }

        const result = await response.json();
        const aiContent = result.choices[0].message.content;

        try {
          // Try to parse as JSON (for analysis mode)
          const jsonResponse = JSON.parse(aiContent);
          setAiResponse(jsonResponse);
        } catch (e) {
          // If not JSON, it's a regular text response
          setAiResponse({ text: aiContent });
        }
      }

      // Add AI response to messages
      if (aiResponse) {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: aiResponse.text,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            role: 'assistant',
            content: 'I analyzed your request.',
            timestamp: new Date(),
          },
        ]);
      }

    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to get AI response. Please try again.');

      // Add error message to chat
      setMessages(prevMessages => [
        ...prevMessages,
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
          id: generateId()
        },
      ]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Save a query for future use
  const handleSaveQuery = (query: string) => {
    const id = generateId();
    setSavedQueries(prev => [...prev, { id, query }]);
    toast.success('Query saved for future use');
  };

  // Use a saved or suggested query
  const handleUseQuery = (query: string) => {
    setInputValue(query);
    setActiveTab('chat');
  };

  const clearConversation = () => {
    setMessages([
      {
        role: 'system',
        content: 'I am your AI analytics assistant. I can help analyze your business data and provide insights about inventory, sales, finance, projects, and employees. How can I help you today?',
        timestamp: new Date()
      }
    ]);
    setAiResponse(null);
    setIsAnalysisMode(false);
  };

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getQuickPrompts = () => [
    {
      text: "Analyze top selling products",
      icon: <BarChart className="h-3 w-3 mr-2" />,
      isAnalysis: true
    },
    {
      text: "Compare income vs expenses",
      icon: <PieChart className="h-3 w-3 mr-2" />,
      isAnalysis: true
    },
    {
      text: "How does this ERP system work?",
      icon: <Brain className="h-3 w-3 mr-2" />,
      isAnalysis: false
    },
    {
      text: "What can you help me with?",
      icon: <Search className="h-3 w-3 mr-2" />,
      isAnalysis: false
    }
  ];

  return (
    <div className="flex flex-col h-full">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Brain className="mr-2 h-5 w-5 text-primary" />
              <CardTitle>AI Analytics Assistant</CardTitle>
            </div>
            <div className="flex space-x-2">
              {aiResponse &&
               ((aiResponse.charts && aiResponse.charts.length > 0) ||
                (aiResponse.tables && aiResponse.tables.length > 0)) ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowVisualizations(!showVisualizations)}
                >
                  {showVisualizations ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      Hide Visuals
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      Show Visuals
                    </>
                  )}
                </Button>
              ) : null}
              <Button variant="outline" size="sm" onClick={clearConversation}>
                Clear Chat
              </Button>
            </div>
          </div>
          <CardDescription>
            Ask questions about your business data and get AI-powered insights
          </CardDescription>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="saved">Saved Queries</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
          <TabsContent value="chat" className="flex-1 flex flex-col mt-0">
            <div className="flex-1 overflow-y-auto pb-4 space-y-4">
            {messages.filter(m => m.role !== 'system').map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="mb-1 text-sm">
                    {message.content}
                  </div>
                  <div className="text-[10px] opacity-70 text-right">
                    {formatTimestamp(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {isAiThinking && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    <span className="text-sm">{isAnalysisMode ? 'Analyzing data...' : 'Thinking...'}</span>
                  </div>
                </div>
              </div>
            )}

            {showVisualizations && aiResponse?.charts && aiResponse.charts.length > 0 && (
              <VisualizationContainer title="Data Visualizations">
                {aiResponse.charts.map((chart, index) => (
                  <ChartRenderer key={index} chart={chart} index={index} />
                ))}
              </VisualizationContainer>
            )}

            {showVisualizations && aiResponse?.tables && aiResponse.tables.length > 0 && (
              <VisualizationContainer title="Data Tables">
                {aiResponse.tables.map((table, index) => (
                  <TableComponent key={index} table={table} />
                ))}
              </VisualizationContainer>
            )}

            <div ref={messagesEndRef} />
            </div>

            {/* Quick prompts */}
            {messages.filter(m => m.role !== 'system').length < 2 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
                <div className="flex flex-wrap gap-2">
                  {getQuickPrompts().map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant={prompt.isAnalysis ? "default" : "outline"}
                      size="sm"
                      className={`text-xs ${prompt.isAnalysis ? "bg-primary/90" : ""}`}
                      onClick={() => {
                        setInputValue(prompt.text);
                        // Small delay to show the user the button was clicked
                        setTimeout(() => {
                          handleSendMessage();
                        }, 100);
                      }}
                    >
                      {prompt.icon}
                      {prompt.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-auto flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={isAnalysisMode ? "Ask about your business data..." : "Chat with AI assistant..."}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    // Update analysis mode in real-time as user types
                    setIsAnalysisMode(detectAnalysisMode(e.target.value));
                  }}
                  onKeyDown={handleKeyDown}
                  className="pl-8 pr-12"
                  disabled={isAiThinking || isLoading}
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute right-0 top-0 h-full px-3 py-2"
                  onClick={handleSendMessage}
                  disabled={isAiThinking || isLoading || !inputValue.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send</span>
                </Button>
              </div>
            </div>

            {/* Analysis mode indicator */}
            {inputValue && (
              <div className="mt-2 text-[10px] text-muted-foreground">
                {isAnalysisMode ? (
                  <span className="flex items-center">
                    <BarChart className="h-3 w-3 mr-1 text-primary" />
                    Analysis mode: I'll examine your data to answer this question
                  </span>
                ) : (
                  <span className="flex items-center">
                    <Brain className="h-3 w-3 mr-1" />
                    Chat mode: Add analysis keywords for data insights
                  </span>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="saved" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Saved Queries</h3>
                {savedQueries.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSavedQueries([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>

              {savedQueries.length === 0 ? (
                <div className="text-center py-8">
                  <Save className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No saved queries yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Save frequently used queries for quick access</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {savedQueries.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{item.query}</p>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUseQuery(item.query)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSavedQueries(prev => prev.filter(q => q.id !== item.id))}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Suggested Queries</h3>
                <div className="space-y-2">
                  {SUGGESTED_QUERIES.map((query, index) => (
                    <Card key={index} className="p-3">
                      <div className="flex justify-between items-start">
                        <p className="text-sm">{query}</p>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUseQuery(query)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveQuery(query)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-0">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Recent Queries</h3>
                {queryHistory.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setQueryHistory([])}
                  >
                    Clear History
                  </Button>
                )}
              </div>

              {queryHistory.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No query history yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Your recent queries will appear here</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queryHistory.map((item) => (
                    <Card key={item.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm">{item.query}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUseQuery(item.query)}
                          >
                            <Send className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveQuery(item.query)}
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>


        </CardContent>
      </Card>
    </div>
  );
}