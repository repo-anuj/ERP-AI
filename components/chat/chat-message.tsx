'use client';

import React, { useState } from 'react';
import {
  MoreVertical,
  MessageCircle,
  Edit,
  Trash2,
  Pin,
  Copy,
  Flag,
  Download,
  Eye,
  Heart,
  ThumbsUp,
  Check,
  CheckCircle,
  Clock,
  AlertCircle,
  File,
  Image as ImageIcon,
  PlayCircle,
  PauseCircle,
  Volume2,
  CheckCircle as CheckCheck,
  PlayCircle as Play,
  PauseCircle as Pause,
  ArrowLeft as Reply
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';

// Helper function to format relative time
const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  return format(date, 'MMM d, yyyy');
};

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

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId: string;
  isConsecutive?: boolean;
  showAvatar?: boolean;
  onReply?: (message: ChatMessage) => void;
  onEdit?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onPin?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onApprove?: (taskId: string) => void;
  onReject?: (taskId: string, reason: string) => void;
}

export function ChatMessage({
  message,
  currentUserId,
  isConsecutive = false,
  showAvatar = true,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  onApprove,
  onReject
}: ChatMessageProps) {
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  const isOwnMessage = message.senderId === currentUserId;
  const isSystemMessage = message.type === 'system';

  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Clock className="h-3 w-3 text-muted-foreground" />;
      case 'sent':
        return <Check className="h-3 w-3 text-muted-foreground" />;
      case 'delivered':
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      case 'read':
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Volume2 className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Play className="h-4 w-4" />;
    return <File className="h-4 w-4" />;
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    if (attachment.type.startsWith('image/')) {
      return (
        <div key={attachment.id} className="relative group">
          <img
            src={attachment.thumbnail || attachment.url}
            alt={attachment.name}
            className="max-w-xs max-h-64 rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              setSelectedImage(attachment.url);
              setShowImagePreview(true);
            }}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all rounded-lg flex items-center justify-center">
            <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      );
    }

    if (attachment.type.startsWith('audio/')) {
      return (
        <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg max-w-xs">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div className="flex-1">
            <div className="text-sm font-medium">{attachment.name}</div>
            <Progress value={audioProgress} className="h-1 mt-1" />
          </div>
          <span className="text-xs text-muted-foreground">
            {formatFileSize(attachment.size)}
          </span>
        </div>
      );
    }

    return (
      <div key={attachment.id} className="flex items-center space-x-3 p-3 bg-muted rounded-lg max-w-xs">
        {getFileIcon(attachment.type)}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{attachment.name}</div>
          <div className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</div>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <a href={attachment.url} download={attachment.name}>
            <Download className="h-4 w-4" />
          </a>
        </Button>
      </div>
    );
  };

  if (isSystemMessage) {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`group flex space-x-3 ${isOwnMessage ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        {showAvatar && !isConsecutive && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={message.senderAvatar} />
            <AvatarFallback className="text-xs">
              {message.senderName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}

        {/* Message Content */}
        <div className={`flex-1 max-w-[70%] ${isConsecutive && showAvatar ? 'ml-11' : ''}`}>
          {/* Header */}
          {!isConsecutive && (
            <div className={`flex items-center space-x-2 mb-1 ${isOwnMessage ? 'justify-end' : ''}`}>
              <span className="text-sm font-medium">{message.senderName}</span>
              <Badge variant="outline" className="text-xs">
                {message.senderRole}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(new Date(message.timestamp))}
              </span>
              {message.edited && (
                <span className="text-xs text-muted-foreground">(edited)</span>
              )}
              {message.pinned && (
                <Pin className="h-3 w-3 text-yellow-500" />
              )}
            </div>
          )}

          {/* Reply Preview */}
          {message.replyToMessage && (
            <div className="mb-2 p-2 bg-muted/50 rounded border-l-2 border-l-primary">
              <div className="text-xs text-muted-foreground">{message.replyToMessage.senderName}</div>
              <div className="text-sm truncate">{message.replyToMessage.content}</div>
            </div>
          )}

          {/* Message Bubble */}
          <div className={`relative p-3 rounded-lg ${
            isOwnMessage 
              ? 'bg-primary text-primary-foreground ml-auto' 
              : 'bg-muted'
          } ${message.type === 'approval_request' ? 'border-l-4 border-l-yellow-500' : ''}`}>
            
            {/* Content */}
            <div className="space-y-2">
              {message.content && (
                <div className="text-sm whitespace-pre-wrap break-words">
                  {message.content}
                </div>
              )}

              {/* Task Info for Approval Requests */}
              {message.type === 'approval_request' && message.taskName && (
                <div className="bg-background/10 p-2 rounded text-xs">
                  <div className="font-medium">Task: {message.taskName}</div>
                  <div className="text-muted-foreground">Awaiting approval</div>
                </div>
              )}

              {/* Attachments */}
              {message.attachments.length > 0 && (
                <div className="space-y-2">
                  {message.attachments.map(renderAttachment)}
                </div>
              )}

              {/* Tags */}
              {message.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {message.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Message Actions */}
            <div className={`absolute top-1 ${isOwnMessage ? 'left-1' : 'right-1'} opacity-0 group-hover:opacity-100 transition-opacity`}>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align={isOwnMessage ? "start" : "end"}>
                  <div className="space-y-1">
                    {onReply && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onReply(message)}
                      >
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                    )}
                    
                    {isOwnMessage && onEdit && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onEdit(message)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => navigator.clipboard.writeText(message.content)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>

                    {onPin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => onPin(message.id)}
                      >
                        <Pin className="h-4 w-4 mr-2" />
                        {message.pinned ? 'Unpin' : 'Pin'}
                      </Button>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-red-600"
                    >
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </Button>

                    {isOwnMessage && onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-red-600"
                        onClick={() => onDelete(message.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Reactions */}
          {message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {message.reactions.map(reaction => (
                <Button
                  key={reaction.emoji}
                  variant={reaction.userReacted ? "default" : "outline"}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => onReact?.(message.id, reaction.emoji)}
                >
                  {reaction.emoji} {reaction.count}
                </Button>
              ))}
              
              {/* Quick React */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                    +
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2">
                  <div className="flex space-x-1">
                    {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                      <Button
                        key={emoji}
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => onReact?.(message.id, emoji)}
                      >
                        {emoji}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}

          {/* Approval Actions */}
          {message.type === 'approval_request' && !isOwnMessage && message.taskId && (
            <div className="flex space-x-2 mt-2">
              <Button
                size="sm"
                onClick={() => onApprove?.(message.taskId!)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onReject?.(message.taskId!, 'Needs revision')}
              >
                <AlertCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
            </div>
          )}

          {/* Status and Thread Info */}
          <div className={`flex items-center justify-between mt-1 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
            <div className="flex items-center space-x-1">
              {isOwnMessage && getStatusIcon()}
              {message.threadCount && message.threadCount > 0 && (
                <Button variant="ghost" size="sm" className="h-5 text-xs text-muted-foreground">
                  {message.threadCount} replies
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center">
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
