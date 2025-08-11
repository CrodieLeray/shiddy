import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pictochat',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Database utility functions
export class DatabaseManager {
  
  // Get user by session ID or create new one
  static async getOrCreateUser(sessionId: string, username: string, userColor: string = '#000080') {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM users WHERE session_id = ?',
        [sessionId]
      );
      
      if ((rows as any[]).length > 0) {
        // Update existing user
        await pool.execute(
          'UPDATE users SET current_username = ?, user_color = ?, last_active = CURRENT_TIMESTAMP WHERE session_id = ?',
          [username, userColor, sessionId]
        );
        return { sessionId, username, userColor, isNew: false };
      } else {
        // Create new user
        await pool.execute(
          'INSERT INTO users (session_id, current_username, user_color) VALUES (?, ?, ?)',
          [sessionId, username, userColor]
        );
        
        // Log username history
        await pool.execute(
          'INSERT INTO username_history (session_id, username) VALUES (?, ?)',
          [sessionId, username]
        );
        
        return { sessionId, username, userColor, isNew: true };
      }
    } catch (error) {
      console.error('Database error in getOrCreateUser:', error);
      throw error;
    }
  }

  // Update username for existing session
  static async updateUsername(sessionId: string, newUsername: string) {
    try {
      await pool.execute(
        'UPDATE users SET current_username = ?, last_active = CURRENT_TIMESTAMP WHERE session_id = ?',
        [newUsername, sessionId]
      );
      
      // Log username change
      await pool.execute(
        'INSERT INTO username_history (session_id, username) VALUES (?, ?)',
        [sessionId, newUsername]
      );
      
      return { success: true };
    } catch (error) {
      console.error('Database error in updateUsername:', error);
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

      const [result] = await pool.execute(
        `INSERT INTO messages 
         (user_session_id, username, user_color, room_name, message_text, drawing_data, message_type) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sessionId, username, userColor, roomName, messageText, drawingData, messageType]
      );

      // Update user last active
      await pool.execute(
        'UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE session_id = ?',
        [sessionId]
      );

      return { 
        success: true, 
        messageId: (result as any).insertId 
      };
    } catch (error) {
      console.error('Database error in saveMessage:', error);
      throw error;
    }
  }

  // Get recent messages (last 30 days)
  static async getRecentMessages(roomName: string = 'Global Shiddy Board', limit: number = 100) {
    try {
      const [rows] = await pool.execute(
        `SELECT id, username, user_color, message_text, drawing_data, message_type, created_at
         FROM messages 
         WHERE room_name = ? AND is_deleted = FALSE 
         AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)
         ORDER BY created_at ASC 
         LIMIT ?`,
        [roomName, limit]
      );

      return rows as any[];
    } catch (error) {
      console.error('Database error in getRecentMessages:', error);
      throw error;
    }
  }

  // Get active users count
  static async getActiveUsersCount(roomName: string = 'Global Shiddy Board') {
    try {
      const [rows] = await pool.execute(
        `SELECT COUNT(DISTINCT u.session_id) as count
         FROM users u
         WHERE u.last_active > DATE_SUB(NOW(), INTERVAL 5 MINUTE)`,
        []
      );

      return (rows as any[])[0].count;
    } catch (error) {
      console.error('Database error in getActiveUsersCount:', error);
      return 0;
    }
  }

  // Manual cleanup function
  static async cleanupOldData() {
    try {
      // Mark messages older than 30 days as deleted
      await pool.execute(
        'UPDATE messages SET is_deleted = TRUE WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY) AND is_deleted = FALSE'
      );
      
      // Delete messages older than 35 days
      await pool.execute(
        'DELETE FROM messages WHERE created_at < DATE_SUB(NOW(), INTERVAL 35 DAY)'
      );
      
      // Clean inactive users
      await pool.execute(
        'DELETE FROM users WHERE last_active < DATE_SUB(NOW(), INTERVAL 30 DAY)'
      );

      return { success: true };
    } catch (error) {
      console.error('Database error in cleanupOldData:', error);
      throw error;
    }
  }
}

export default DatabaseManager;
