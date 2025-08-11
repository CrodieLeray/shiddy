import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface PictoChatMessage {
  id: string;
  user_session_id: string;
  username: string;
  user_color: string;
  room_name: string;
  message_text?: string;
  drawing_data?: string;
  message_type: 'text' | 'drawing' | 'both';
  created_at: string;
  is_deleted: boolean;
}

export interface UserSession {
  sessionId: string;
  username: string;
  userColor: string;
  isNew: boolean;
}

export function usePictoChat(roomName: string = 'Global Shiddy Board') {
  const [sessionId, setSessionId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('#000080');
  const [messages, setMessages] = useState<PictoChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize session ID on mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem('pictochat_session_id');
    const newSessionId = existingSessionId || uuidv4();
    
    if (!existingSessionId) {
      localStorage.setItem('pictochat_session_id', newSessionId);
    }
    
    setSessionId(newSessionId);
  }, []);

  // Load messages when session is ready
  useEffect(() => {
    if (sessionId) {
      loadMessages();
      loadStats();
    }
  }, [sessionId, roomName]);

  const loadMessages = useCallback(async () => {
    if (!sessionId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/pictochat/messages?roomName=${encodeURIComponent(roomName)}&limit=100`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load messages');
      }
      
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
      console.error('Error loading messages:', err);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, roomName]);

  const loadStats = useCallback(async () => {
    if (!sessionId) return;
    
    try {
      const response = await fetch(
        `/api/pictochat/stats?roomName=${encodeURIComponent(roomName)}`
      );
      
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data.stats?.activeUsers || 0);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }, [sessionId, roomName]);

  const setUserProfile = useCallback(async (newUsername: string, newUserColor?: string): Promise<boolean> => {
    if (!sessionId || !newUsername.trim()) return false;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pictochat/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          username: newUsername.trim(),
          userColor: newUserColor || userColor
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to set username');
      }

      const data = await response.json();
      
      setUsername(newUsername.trim());
      if (newUserColor) {
        setUserColor(newUserColor);
      }
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set username');
      console.error('Error setting username:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, userColor]);

  const sendMessage = useCallback(async (
    messageText?: string, 
    drawingData?: string
  ): Promise<boolean> => {
    if (!sessionId || !username || (!messageText && !drawingData)) {
      return false;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/pictochat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          username,
          userColor,
          roomName,
          messageText: messageText?.trim(),
          drawingData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      // Add the new message to local state immediately
      if (data.message) {
        setMessages(prev => [...prev, data.message]);
      }
      
      // Update stats
      loadStats();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Error sending message:', err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId, username, userColor, roomName, loadStats]);

  return {
    // State
    sessionId,
    username,
    userColor,
    messages,
    isLoading,
    activeUsers,
    error,
    
    // Actions
    setUserProfile,
    sendMessage,
    loadMessages,
    loadStats,
    
    // Helpers
    hasUsername: !!username,
    isReady: !!sessionId
  };
}
