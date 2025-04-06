'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Brain, 
  Send, 
  RefreshCw, 
  BarChart, 
  PieChart, 
  LineChart, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
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
}

interface AIResponse {
  text: string;
  charts?: ChartData[];
  tables?: TableData[];
}

interface AggregatedData {
  inventory: any[];
  sales: any[];
  finance: any[];
  projects: any[];
  employees: any[];
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

export function AIAssistant({ aggregatedData, isLoading = false }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'system',
      content: 'I am your AI analytics assistant. I can help analyze your business data and provide insights about inventory, sales, finance, projects, and employees. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null);
  const [isAnalysisMode, setIsAnalysisMode] = useState(false);
  const [showVisualizations, setShowVisualizations] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    const userMessage: Message = {
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // Determine if the message is conversational
    const shouldAnalyze = !isConversational(inputValue);
    setIsAnalysisMode(shouldAnalyze);
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsAiThinking(true);
    
    try {
      // Prepare conversation history for the AI
      const conversationHistory = messages
        .filter(m => m.role !== 'system')
        .slice(-6) // Include last 6 messages for context
        .map(m => ({
          role: m.role,
          content: m.content
        }));
      
      // Add current user message
      conversationHistory.push({
        role: 'user',
        content: userMessage.content
      });
      
      // Use backend API for analysis mode
      if (shouldAnalyze) {
        const apiResponse = await fetch('/api/analytics/ai', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: userMessage.content,
            conversationHistory,
            analyze: true
          })
        });
        
        if (apiResponse.ok) {
          const processedResponse = await apiResponse.json();
          setAiResponse(processedResponse);
          
          // Add AI response to chat
          const assistantMessage: Message = {
            role: 'assistant',
            content: processedResponse.text,
            timestamp: new Date()
          };
          
          setMessages(prev => [...prev, assistantMessage]);
          setIsAiThinking(false);
          return;
        }
      }
      
      // Use client-side API for conversational mode
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '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'}`,
          "HTTP-Referer": window.location.href,
          "X-Title": "ERP-AI Analytics Assistant",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          "model": "deepseek/deepseek-v3-base:free",
          "messages": [
            {
              "role": "system",
              "content": `You are an AI analytics assistant for an ERP system. ${shouldAnalyze ? 
                `Analyze the provided business data and answer questions about inventory, sales, finance, projects, and employees.
                
                IMPORTANT: Always respond in a conversational, helpful tone. Do NOT just list query results. Instead, analyze the data and provide meaningful insights.
                
                When appropriate, include structured data tables to help illustrate your points.
                
                When appropriate, suggest visualizations to help understand the data.
                
                Your response MUST be a JSON object with the following structure:
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
              }`
            },
            ...conversationHistory,
            {
              "role": "user",
              "content": shouldAnalyze 
                ? JSON.stringify({
                    query: userMessage.content,
                    data: aggregatedData,
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
      
      // Process AI response
      let processedResponse: AIResponse;
      
      if (shouldAnalyze) {
        try {
          // Try to parse as JSON first
          processedResponse = JSON.parse(aiContent);
          
          // Ensure required properties exist
          if (!processedResponse.text) {
            processedResponse.text = "I've analyzed your data. Here are my findings.";
          }
          
          if (!processedResponse.charts) {
            processedResponse.charts = [];
          }
          
          if (!processedResponse.tables) {
            processedResponse.tables = [];
          }
        } catch (e) {
          // If not valid JSON, use as plain text
          processedResponse = { 
            text: aiContent,
            charts: [],
            tables: [] 
          };
        }
      } else {
        // For conversational mode, just use the text
        processedResponse = { 
          text: aiContent,
          charts: [],
          tables: [] 
        };
      }
      
      setAiResponse(processedResponse);
      
      // Add AI response to chat
      const assistantMessage: Message = {
        role: 'assistant',
        content: processedResponse.text,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      toast.error('Failed to process your query');
      
      // Add error message to chat
      setMessages(prev => [
        ...prev, 
        {
          role: 'assistant',
          content: 'Sorry, I encountered an error while processing your query. Please try again.',
          timestamp: new Date()
        }
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
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex flex-col">
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
        </CardContent>
      </Card>
    </div>
  );
} 