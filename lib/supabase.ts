import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for TypeScript
export interface User {
  id: string;
  session_id: string;
  current_username: string;
  user_color: string;
  created_at: string;
  updated_at: string;
  last_active: string;
}

export interface Message {
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

export interface UsernameHistory {
  id: string;
  session_id: string;
  username: string;
  changed_at: string;
}

// Supabase utility functions
export class SupabaseManager {
  
  // Get or create user by session ID
  static async getOrCreateUser(sessionId: string, username: string, userColor: string = '#000080') {
    try {
      // First, try to find existing user
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existingUser && !fetchError) {
        // Update existing user
        const { data, error } = await supabase
          .from('users')
          .update({
            current_username: username,
            user_color: userColor,
            last_active: new Date().toISOString()
          })
          .eq('session_id', sessionId)
          .select()
          .single();

        if (error) throw error;

        return { user: data, isNew: false };
      } else {
        // Create new user
        const { data, error } = await supabase
          .from('users')
          .insert({
            session_id: sessionId,
            current_username: username,
            user_color: userColor
          })
          .select()
          .single();

        if (error) throw error;

        // Log username history
        await supabase
          .from('username_history')
          .insert({
            session_id: sessionId,
            username: username
          });

        return { user: data, isNew: true };
      }
    } catch (error) {
      console.error('Error in getOrCreateUser:', error);
      throw error;
    }
  }

  // Update username for existing session
  static async updateUsername(sessionId: string, newUsername: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          current_username: newUsername,
          last_active: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;

      // Log username change
      await supabase
        .from('username_history')
        .insert({
          session_id: sessionId,
          username: newUsername
        });

      return { success: true, user: data };
    } catch (error) {
      console.error('Error in updateUsername:', error);
      throw error;
    }
  }

  // Save message to database
  static async saveMessage(
    sessionId: string,
    username: string,
    userColor: string,
    roomName: string = 'Global Shiddy Board',
    messageText?: string,
    drawingData?: string
  ) {
    try {
      const messageType = messageText && drawingData ? 'both' : 
                         drawingData ? 'drawing' : 'text';

      const { data, error } = await supabase
        .from('messages')
        .insert({
          user_session_id: sessionId,
          username: username,
          user_color: userColor,
          room_name: roomName,
          message_text: messageText,
          drawing_data: drawingData,
          message_type: messageType
        })
        .select()
        .single();

      if (error) throw error;

      // Update user last active
      await supabase
        .from('users')
        .update({ last_active: new Date().toISOString() })
        .eq('session_id', sessionId);

      return { success: true, message: data };
    } catch (error) {
      console.error('Error in saveMessage:', error);
      throw error;
    }
  }

  // Get recent messages (last 30 days)
  static async getRecentMessages(roomName: string = 'Global Shiddy Board', limit: number = 100) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('room_name', roomName)
        .eq('is_deleted', false)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true })
        .limit(limit);

      if (error) throw error;

      return data as Message[];
    } catch (error) {
      console.error('Error in getRecentMessages:', error);
      throw error;
    }
  }

  // Get active users count
  static async getActiveUsersCount() {
    try {
      const fiveMinutesAgo = new Date();
      fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5);

      const { count, error } = await supabase
        .from('users')
        .select('session_id', { count: 'exact', head: true })
        .gte('last_active', fiveMinutesAgo.toISOString());

      if (error) throw error;

      return count || 0;
    } catch (error) {
      console.error('Error in getActiveUsersCount:', error);
      return 0;
    }
  }

  // Subscribe to real-time messages
  static subscribeToMessages(roomName: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `room_name=eq.${roomName}`
        },
        (payload) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  }
}

export default SupabaseManager;
