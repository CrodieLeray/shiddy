import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ShiddyChatMessage {
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

const shiddyNames = [
  "ShiddyArtist", "PixelShiddy", "DoodleShiddy", "CanvasShiddy", "SketchShiddy",
  "ShiddyChaos", "DrawShiddy", "PaintShiddy", "ArtShiddy", "ShiddySquad",
  "BrushShiddy", "PixelPunk", "ShiddyDude", "PaintPal", "SketchStar",
  "ColorShiddy", "ShiddyVibes", "ArtAttack", "DrawDream", "ShiddyKing"
];

const shiddyColors = [
  '#FF0080', '#00FF80', '#8000FF', '#FF8000', '#0080FF',
  '#80FF00', '#FF0040', '#40FF00', '#0040FF', '#FF4000'
];

function generateShiddyUser() {
  const name = shiddyNames[Math.floor(Math.random() * shiddyNames.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  const color = shiddyColors[Math.floor(Math.random() * shiddyColors.length)];
  
  return {
    username: `${name}${num}`,
    color: color
  };
}

export function useShiddyChat(roomName: string = 'Global Shiddy Board') {
  const [sessionId, setSessionId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [userColor, setUserColor] = useState<string>('#000080');
  const [messages, setMessages] = useState<ShiddyChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Initialize session ID and auto-generate username on mount
  useEffect(() => {
    const existingSessionId = localStorage.getItem('shiddychat_session_id');
    const existingUsername = localStorage.getItem('shiddychat_username');
    const existingColor = localStorage.getItem('shiddychat_color');
    
    const newSessionId = existingSessionId || uuidv4();
    
    if (!existingSessionId) {
      localStorage.setItem('shiddychat_session_id', newSessionId);
    }
    
    // Auto-generate username if none exists
    if (!existingUsername || !existingColor) {
      const generatedUser = generateShiddyUser();
      localStorage.setItem('shiddychat_username', generatedUser.username);
      localStorage.setItem('shiddychat_color', generatedUser.color);
      setUsername(generatedUser.username);
      setUserColor(generatedUser.color);
    } else {
      setUsername(existingUsername);
      setUserColor(existingColor);
    }
    
    setSessionId(newSessionId);
  }, []);

  // Auto-register user when session and username are ready
  useEffect(() => {
    if (sessionId && username) {
      // Auto-register user with database
      setUserProfile(username, userColor);
    }
  }, [sessionId, username]);

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
        `/api/shiddychat/messages?roomName=${encodeURIComponent(roomName)}&limit=100`
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
        `/api/shiddychat/stats?roomName=${encodeURIComponent(roomName)}`
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
      const response = await fetch('/api/shiddychat/user', {
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
      const response = await fetch('/api/shiddychat/messages', {
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
