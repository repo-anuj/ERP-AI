'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User,
  Tag,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  timestamp: string;
  type: 'message' | 'approval_request' | 'approval_response' | 'system';
  taskId?: string;
  taskName?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  tags?: string[];
}

interface ProjectChatProps {
  projectId: string;
  projectName: string;
  className?: string;
}

export function ProjectChat({ projectId, projectName, className }: ProjectChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    // Set up real-time updates with more frequent polling for better UX
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [projectId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      } else if (response.status === 404) {
        console.log('Project chat not found or no access');
        setMessages([]);
      } else if (response.status === 403) {
        console.log('Access denied to project chat');
        setMessages([]);
        toast({
          title: 'Access Denied',
          description: 'You do not have access to this project chat',
          variant: 'destructive',
        });
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat messages',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'message'
        }),
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(); // Refresh messages
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleApprovalResponse = async (messageId: string, taskId: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/projects/tasks/approval`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          approved,
          comments: approved ? 'Approved via chat' : 'Rejected via chat'
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: `Task ${approved ? 'approved' : 'rejected'} successfully`,
        });
        fetchMessages(); // Refresh to show updated status
      } else {
        throw new Error('Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      toast({
        title: 'Error',
        description: 'Failed to process approval',
        variant: 'destructive',
      });
    }
  };

  const getMessageIcon = (type: string, approvalStatus?: string) => {
    switch (type) {
      case 'approval_request':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'approval_response':
        return approvalStatus === 'approved' 
          ? <CheckCircle className="h-4 w-4 text-green-500" />
          : <XCircle className="h-4 w-4 text-red-500" />;
      case 'system':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      default:
        return <MessageCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Project Chat</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5" />
          <span>Project Chat - {projectName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-96">
          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.length > 0 ? (
                messages.map((message) => (
                  <div key={message.id} className="flex space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="" />
                      <AvatarFallback>
                        {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">{message.senderName}</span>
                        <Badge variant="outline" className="text-xs">
                          {message.senderRole}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        {getMessageIcon(message.type, message.approvalStatus)}
                      </div>
                      
                      <div className="text-sm">
                        {message.type === 'approval_request' && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 space-y-2">
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4" />
                              <span className="font-medium">Task Approval Request</span>
                            </div>
                            <div>
                              <span className="font-medium">Task:</span> {message.taskName}
                            </div>
                            <div>{message.content}</div>
                            {message.approvalStatus === 'pending' && (
                              <div className="flex space-x-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleApprovalResponse(message.id, message.taskId!, true)}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleApprovalResponse(message.id, message.taskId!, false)}
                                >
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Reject
                                </Button>
                              </div>
                            )}
                            {message.approvalStatus && message.approvalStatus !== 'pending' && (
                              <Badge 
                                variant={message.approvalStatus === 'approved' ? 'default' : 'destructive'}
                                className="mt-2"
                              >
                                {message.approvalStatus}
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        {message.type === 'approval_response' && (
                          <div className={`border rounded-lg p-3 ${
                            message.approvalStatus === 'approved' 
                              ? 'bg-green-50 border-green-200' 
                              : 'bg-red-50 border-red-200'
                          }`}>
                            <div className="flex items-center space-x-2">
                              {message.approvalStatus === 'approved' 
                                ? <CheckCircle className="h-4 w-4 text-green-600" />
                                : <XCircle className="h-4 w-4 text-red-600" />
                              }
                              <span className="font-medium">
                                Task {message.approvalStatus} - {message.taskName}
                              </span>
                            </div>
                            <div className="mt-1">{message.content}</div>
                          </div>
                        )}
                        
                        {message.type === 'message' && (
                          <div>{message.content}</div>
                        )}
                        
                        {message.type === 'system' && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-blue-800">
                            {message.content}
                          </div>
                        )}
                      </div>
                      
                      {message.tags && message.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {message.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          <Separator />
          
          {/* Message Input */}
          <div className="p-4">
            <div className="flex space-x-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                disabled={sending}
              />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
