'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Send,
  Paperclip,
  Heart,
  MoreVertical,
  MessageCircle,
  Edit,
  Trash2,
  Pin,
  Search,
  Users,
  Phone,
  Video,
  Settings,
  Download,
  Eye,
  ThumbsUp,
  ExternalLink,
  Copy,
  Flag,
  Volume,
  VolumeX,
  Image,
  File,
  X,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  Wifi,
  WifiOff,
  Volume as Mic,
  VolumeX as MicOff,
  Image as Camera,
  ArrowLeft as Reply,
  ExternalLink as Share,
  Heart as Smile
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { hrmsRealtimeService, HRMSEventType } from '@/lib/hrms-realtime-service';
import { ChatMessage as ChatMessageComponent } from './chat-message';

// Enhanced message interface
interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderAvatar?: string;
  timestamp: string;
  type: 'message' | 'approval_request' | 'approval_response' | 'system' | 'file' | 'image' | 'voice';
  taskId?: string;
  taskName?: string;
  approvalStatus?: string;
  tags: string[];
  edited?: boolean;
  editedAt?: string;
  replyTo?: string;
  replyToMessage?: ChatMessage;
  reactions: MessageReaction[];
  attachments: MessageAttachment[];
  status: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
  pinned?: boolean;
  threadCount?: number;
  isThread?: boolean;
  parentId?: string;
}

interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
  userReacted: boolean;
}

interface MessageAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  thumbnail?: string;
  uploadProgress?: number;
}

interface TypingUser {
  id: string;
  name: string;
  timestamp: number;
}

interface OnlineUser {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  lastSeen?: string;
}

interface UltimateProjectChatProps {
  projectId: string;
  projectName: string;
  className?: string;
  height?: string;
  showHeader?: boolean;
  showOnlineUsers?: boolean;
  allowFileUpload?: boolean;
  allowVoiceMessages?: boolean;
  allowVideoCall?: boolean;
  maxFileSize?: number; // in MB
}

export function UltimateProjectChat({
  projectId,
  projectName,
  className = '',
  height = 'h-96',
  showHeader = true,
  showOnlineUsers = true,
  allowFileUpload = true,
  allowVoiceMessages = true,
  allowVideoCall = true,
  maxFileSize = 10
}: UltimateProjectChatProps) {
  // State management
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [connected, setConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [pinnedMessages, setPinnedMessages] = useState<ChatMessage[]>([]);
  const [showPinnedMessages, setShowPinnedMessages] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { toast } = useToast();

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);



  // Fetch messages from API
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
        setPinnedMessages(data.messages?.filter((m: ChatMessage) => m.pinned) || []);
        setCurrentUser(data.currentUser);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to load chat messages. Retrying...',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [projectId, toast]);

  // Fetch typing users
  const fetchTypingUsers = useCallback(async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat/typing`);
      if (response.ok) {
        const data = await response.json();
        setTypingUsers(data.typingUsers || []);
      }
    } catch (error) {
      console.error('Error fetching typing users:', error);
    }
  }, [projectId]);

  // Handle typing indicators
  const handleTyping = useCallback(async (isTyping: boolean) => {
    try {
      await fetch(`/api/projects/${projectId}/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping }),
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }, [projectId]);

  // Handle input changes with typing indicators
  const handleInputChange = useCallback((value: string) => {
    setNewMessage(value);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Start typing if not already
    if (value.trim() && !sending) {
      handleTyping(true);
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      handleTyping(false);
    }, 3000);
  }, [sending, handleTyping]);

  // Initial load and real-time updates
  useEffect(() => {
    fetchMessages();

    // Set up polling for messages and typing indicators
    const messageInterval = setInterval(() => {
      fetchMessages();
    }, 3000);

    const typingInterval = setInterval(() => {
      fetchTypingUsers();
    }, 2000);

    return () => {
      clearInterval(messageInterval);
      clearInterval(typingInterval);
    };
  }, [projectId]); // Only depend on projectId to avoid circular dependency

  // Cleanup typing indicator on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      // Stop typing on unmount
      fetch(`/api/projects/${projectId}/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isTyping: false }),
      }).catch(() => {
        // Ignore errors on cleanup
      });
    };
  }, [projectId]);

  // Auto-scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle message actions
  const handleDeleteMessage = useCallback(async (messageId: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat/${messageId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessages(prev => prev.filter(msg => msg.id !== messageId));
        toast({
          title: 'Message deleted',
          description: 'Message has been deleted successfully',
        });
      } else {
        throw new Error('Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete message',
        variant: 'destructive',
      });
    }
  }, [projectId, toast]);

  const handlePinMessage = useCallback(async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      const action = message?.pinned ? 'unpin' : 'pin';

      const response = await fetch(`/api/projects/${projectId}/chat/${messageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => prev.map(msg =>
          msg.id === messageId
            ? { ...msg, pinned: data.message.pinned }
            : msg
        ));

        if (action === 'pin') {
          setPinnedMessages(prev => [...prev, data.message]);
        } else {
          setPinnedMessages(prev => prev.filter(msg => msg.id !== messageId));
        }

        toast({
          title: action === 'pin' ? 'Message pinned' : 'Message unpinned',
          description: `Message has been ${action}ned successfully`,
        });
      } else {
        throw new Error(`Failed to ${action} message`);
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      toast({
        title: 'Error',
        description: 'Failed to update message',
        variant: 'destructive',
      });
    }
  }, [projectId, messages, toast]);

  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/chat/${messageId}/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emoji }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update message reactions locally
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            const existingReaction = msg.reactions.find(r => r.emoji === emoji);
            if (existingReaction) {
              if (data.action === 'removed') {
                return {
                  ...msg,
                  reactions: msg.reactions.filter(r => r.emoji !== emoji)
                };
              } else {
                return {
                  ...msg,
                  reactions: msg.reactions.map(r =>
                    r.emoji === emoji
                      ? { ...r, userReacted: !r.userReacted, count: r.userReacted ? r.count - 1 : r.count + 1 }
                      : r
                  )
                };
              }
            } else {
              return {
                ...msg,
                reactions: [...msg.reactions, { emoji, count: 1, users: [currentUser?.id || ''], userReacted: true }]
              };
            }
          }
          return msg;
        }));

        toast({
          title: data.action === 'added' ? 'Reaction added' : 'Reaction removed',
          description: `${emoji} reaction ${data.action}`,
          duration: 2000,
        });
      } else {
        throw new Error('Failed to react to message');
      }
    } catch (error) {
      console.error('Error reacting to message:', error);
      toast({
        title: 'Error',
        description: 'Failed to add reaction',
        variant: 'destructive',
      });
    }
  }, [projectId, currentUser, toast]);

  const handleApproveTask = useCallback(async (taskId: string) => {
    try {
      const response = await fetch(`/api/employee/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'approved' }),
      });

      if (response.ok) {
        toast({
          title: 'Task approved',
          description: 'Task has been approved successfully',
        });

        // Send approval message (will be handled after sendMessage is defined)
      } else {
        throw new Error('Failed to approve task');
      }
    } catch (error) {
      console.error('Error approving task:', error);
      toast({
        title: 'Error',
        description: 'Failed to approve task',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleRejectTask = useCallback(async (taskId: string, reason: string) => {
    try {
      const response = await fetch(`/api/employee/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'rejected', notes: reason }),
      });

      if (response.ok) {
        toast({
          title: 'Task rejected',
          description: 'Task has been rejected',
        });

        // Send rejection message (will be handled after sendMessage is defined)
      } else {
        throw new Error('Failed to reject task');
      }
    } catch (error) {
      console.error('Error rejecting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject task',
        variant: 'destructive',
      });
    }
  }, [toast]);



  // Send message
  const sendMessage = useCallback(async (content: string, type: string = 'message', attachments: MessageAttachment[] = []) => {
    if ((!content.trim() && attachments.length === 0) || sending) return;

    setSending(true);
    const tempId = `temp-${Date.now()}`;

    // Add optimistic message
    const optimisticMessage: ChatMessage = {
      id: tempId,
      content,
      senderId: currentUser?.id || '',
      senderName: currentUser?.name || 'You',
      senderRole: currentUser?.role || 'member',
      timestamp: new Date().toISOString(),
      type: type as any,
      tags: [],
      reactions: [],
      attachments,
      status: 'sending',
      replyTo: replyingTo?.id
    };

    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
    setReplyingTo(null);
    setSelectedFiles([]);
    scrollToBottom();

    try {
      const response = await fetch(`/api/projects/${projectId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          type,
          replyTo: replyingTo?.id,
          attachments
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Update optimistic message with real data
        setMessages(prev => prev.map(msg =>
          msg.id === tempId
            ? { ...data.message, status: 'sent' }
            : msg
        ));

        // Send real-time update
        hrmsRealtimeService.sendChatMessage(projectId, content);

        toast({
          title: 'Message sent',
          description: 'Your message has been delivered',
          duration: 2000,
        });
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);

      // Mark message as failed
      setMessages(prev => prev.map(msg =>
        msg.id === tempId
          ? { ...msg, status: 'failed' }
          : msg
      ));

      toast({
        title: 'Failed to send',
        description: 'Message could not be delivered. Click to retry.',
        variant: 'destructive',
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => sendMessage(content, type, attachments)}
          >
            Retry
          </Button>
        ),
      });
    } finally {
      setSending(false);
    }
  }, [projectId, sending, currentUser, replyingTo, toast]);

  return (
    <TooltipProvider>
      <Card className={`flex flex-col ${height} ${className}`}>
        {showHeader && (
          <CardHeader className="pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{projectName}</CardTitle>
                  <div className="flex items-center space-x-1">
                    {connected ? (
                      <Wifi className="h-4 w-4 text-green-500" />
                    ) : (
                      <WifiOff className="h-4 w-4 text-red-500" />
                    )}
                    <Badge variant={connected ? "default" : "destructive"} className="text-xs">
                      {connected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Search Toggle */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowSearch(!showSearch)}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Search messages</TooltipContent>
                </Tooltip>

                {/* Online Users */}
                {showOnlineUsers && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Users className="h-4 w-4" />
                        <Badge variant="secondary" className="ml-1">
                          {onlineUsers.length}
                        </Badge>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64">
                      <div className="space-y-2">
                        <h4 className="font-medium">Online Users</h4>
                        {onlineUsers.map(user => (
                          <div key={user.id} className="flex items-center space-x-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user.avatar} />
                              <AvatarFallback className="text-xs">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{user.name}</span>
                            <div className={`w-2 h-2 rounded-full ${
                              user.status === 'online' ? 'bg-green-500' :
                              user.status === 'away' ? 'bg-yellow-500' :
                              user.status === 'busy' ? 'bg-red-500' : 'bg-gray-500'
                            }`} />
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                )}

                {/* Video Call */}
                {allowVideoCall && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Start video call</TooltipContent>
                  </Tooltip>
                )}

                {/* Voice Call */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Phone className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Start voice call</TooltipContent>
                </Tooltip>

                {/* Settings */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Chat settings</TooltipContent>
                </Tooltip>
              </div>
            </div>

            {/* Search Bar */}
            {showSearch && (
              <div className="mt-3">
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
            )}

            {/* Pinned Messages */}
            {pinnedMessages.length > 0 && (
              <div className="mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinnedMessages(!showPinnedMessages)}
                  className="w-full"
                >
                  <Pin className="h-4 w-4 mr-2" />
                  {pinnedMessages.length} Pinned Message{pinnedMessages.length > 1 ? 's' : ''}
                </Button>
              </div>
            )}
          </CardHeader>
        )}

        <CardContent className="flex-1 p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Pinned Messages */}
                  {showPinnedMessages && pinnedMessages.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-4">
                      <h4 className="text-sm font-medium mb-2 flex items-center">
                        <Pin className="h-4 w-4 mr-1" />
                        Pinned Messages
                      </h4>
                      {pinnedMessages.map(message => (
                        <div key={message.id} className="text-sm p-2 bg-background rounded border-l-2 border-primary">
                          <div className="font-medium">{message.senderName}</div>
                          <div className="text-muted-foreground">{message.content}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Regular Messages */}
                  {messages.length > 0 ? (
                    messages
                      .filter(message =>
                        !searchQuery ||
                        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        message.senderName.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((message, index) => {
                        const previousMessage = index > 0 ? messages[index - 1] : null;
                        const isConsecutive = previousMessage &&
                          previousMessage.senderId === message.senderId &&
                          (new Date(message.timestamp).getTime() - new Date(previousMessage.timestamp).getTime()) < 300000; // 5 minutes

                        return (
                          <ChatMessageComponent
                            key={message.id}
                            message={message}
                            currentUserId={currentUser?.id || ''}
                            isConsecutive={isConsecutive || undefined}
                            onReply={setReplyingTo}
                            onEdit={setEditingMessage}
                            onDelete={handleDeleteMessage}
                            onPin={handlePinMessage}
                            onReact={handleReactToMessage}
                            onApprove={handleApproveTask}
                            onReject={handleRejectTask}
                          />
                        );
                      })
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  )}

                  {/* Typing Indicators */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <span>
                        {typingUsers.length === 1
                          ? `${typingUsers[0].name} is typing...`
                          : `${typingUsers.length} people are typing...`
                        }
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-muted/50 border-t border-l-4 border-l-primary">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-xs text-muted-foreground">Replying to {replyingTo.senderName}</div>
                    <div className="text-sm truncate">{replyingTo.content}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReplyingTo(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* File Upload Preview */}
            {selectedFiles.length > 0 && (
              <div className="px-4 py-2 bg-muted/50 border-t">
                <div className="flex items-center space-x-2 mb-2">
                  <File className="h-4 w-4" />
                  <span className="text-sm font-medium">Selected Files</span>
                </div>
                <div className="space-y-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-background rounded">
                      <div className="flex items-center space-x-2">
                        <File className="h-4 w-4" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message Input */}
            <div className="p-4 border-t">
              <div className="flex items-end space-x-2">
                {/* File Upload */}
                {allowFileUpload && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach file</TooltipContent>
                  </Tooltip>
                )}

                {/* Voice Recording */}
                {allowVoiceMessages && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant={isRecording ? "destructive" : "ghost"}
                        size="sm"
                        onClick={() => {/* Voice recording logic */}}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isRecording ? 'Stop recording' : 'Record voice message'}
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Message Input */}
                <div className="flex-1">
                  <Textarea
                    ref={messageInputRef}
                    placeholder={editingMessage ? "Edit message..." : "Type a message..."}
                    value={newMessage}
                    onChange={(e) => handleInputChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(newMessage);
                        handleTyping(false); // Stop typing when message is sent
                      }
                    }}
                    onBlur={() => handleTyping(false)} // Stop typing when input loses focus
                    className="min-h-[40px] max-h-32 resize-none"
                    rows={1}
                  />
                </div>

                {/* Emoji Picker */}
                <Popover open={showEmojiPicker} onOpenChange={setShowEmojiPicker}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Smile className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <div className="grid grid-cols-8 gap-2 p-2">
                      {['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🎉', '🔥', '💯', '😢', '😡', '🙄', '😴', '🤝', '👏'].map(emoji => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji);
                            setShowEmojiPicker(false);
                          }}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Send Button */}
                <Button
                  onClick={() => sendMessage(newMessage)}
                  disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending}
                  size="sm"
                >
                  {sending ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Recording Timer */}
              {isRecording && (
                <div className="flex items-center justify-center mt-2 text-sm text-red-500">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  Recording: {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </div>
              )}
            </div>
          </div>
        </CardContent>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            const validFiles = files.filter(file => file.size <= maxFileSize * 1024 * 1024);

            if (validFiles.length !== files.length) {
              toast({
                title: 'File size limit exceeded',
                description: `Some files were too large. Maximum size is ${maxFileSize}MB.`,
                variant: 'destructive',
              });
            }

            setSelectedFiles(prev => [...prev, ...validFiles]);
          }}
        />
      </Card>
    </TooltipProvider>
  );
}