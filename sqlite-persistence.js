// sqlite-persistence.js - Message persistence with better-sqlite3 (no deprecated dependencies)
// Development fallback to sqlite3 if better-sqlite3 fails
let Database;
try {
  Database = require('better-sqlite3');
  console.log('📦 Using better-sqlite3 for persistence');
} catch (err) {
  console.warn('⚠️ better-sqlite3 not available, falling back to sqlite3');
  const sqlite3 = require('sqlite3').verbose();
  // Create a wrapper to make sqlite3 behave like better-sqlite3
  Database = class {
    constructor(path) {
      this.path = path;
      this.db = new sqlite3.Database(path);
    }
    
    exec(sql) {
      this.db.exec(sql);
    }
    
    prepare(sql) {
      return {
        run: (...params) => {
          this.db.run(sql, params);
        },
        all: (...params) => {
          return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
              if (err) reject(err);
              else resolve(rows);
            });
          });
        },
        get: (...params) => {
          return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, row) => {
              if (err) reject(err);
              else resolve(row);
            });
          });
        }
      };
    }
    
    close() {
      this.db.close();
    }
  };
}
const path = require('path');
const fs = require('fs');

class MessagePersistence {
  constructor(dbPath) {
    // Use environment-specific database path
    if (!dbPath) {
      if (process.env.NODE_ENV === 'production') {
        // Cloud Run: Use tmp directory
        dbPath = '/tmp/festival-chat/festival-chat.db';
      } else {
        // Local development: Use local data directory
        dbPath = './data/festival-chat.db';
      }
    }
    
    this.dbPath = dbPath;
    this.db = null;
    this.isInitialized = false;
    
    // Ensure data directory exists
    const dir = path.dirname(dbPath);
    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created database directory: ${dir}`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not create directory ${dir}:`, err.message);
      // Fallback to in-memory database
      this.dbPath = ':memory:';
      console.log('📝 Falling back to in-memory database');
    }
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // better-sqlite3 is synchronous, so no need for promises here
      this.db = new Database(this.dbPath);
      console.log('📁 Connected to SQLite database (better-sqlite3):', this.dbPath);
      
      this.createTables();
      this.isInitialized = true;
      console.log('✅ Database initialized successfully');
    } catch (err) {
      console.error('Error opening database:', err);
      throw err;
    }
  }

  createTables() {
    const sql = `
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        created_at INTEGER NOT NULL,
        last_activity INTEGER NOT NULL,
        participant_count INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        room_id TEXT NOT NULL,
        content TEXT NOT NULL,
        sender TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type TEXT DEFAULT 'chat',
        created_at INTEGER NOT NULL,
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages (room_id);
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages (timestamp);
      CREATE INDEX IF NOT EXISTS idx_rooms_last_activity ON rooms (last_activity);
    `;

    this.db.exec(sql);
    console.log('📋 Database tables ready');
  }

  async createRoom(roomId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        INSERT OR IGNORE INTO rooms (id, created_at, last_activity)
        VALUES (?, ?, ?)
      `);
      
      const now = Date.now();
      stmt.run(roomId, now, now);
      console.log(`🏠 Room created/verified: ${roomId}`);
    } catch (err) {
      console.error('Error creating room:', err);
      throw err;
    }
  }

  async saveMessage(roomId, message) {
    if (!this.isInitialized) await this.initialize();

    // Ensure room exists
    await this.createRoom(roomId);

    try {
      const stmt = this.db.prepare(`
        INSERT INTO messages (id, room_id, content, sender, timestamp, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run(
        message.id,
        roomId,
        message.content,
        message.sender,
        message.timestamp,
        message.type || 'chat',
        Date.now()
      );
      
      console.log(`💾 Message saved: ${message.id} in ${roomId}`);
      // Update room last activity
      this.updateRoomActivity(roomId);
      return message;
    } catch (err) {
      console.error('Error saving message:', err);
      throw err;
    }
  }

  async updateRoomActivity(roomId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        UPDATE rooms 
        SET last_activity = ?
        WHERE id = ?
      `);
      
      stmt.run(Date.now(), roomId);
    } catch (err) {
      console.error('Error updating room activity:', err);
      throw err;
    }
  }

  async getRoomMessages(roomId, limit = 100) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT id, content, sender, timestamp, type
        FROM messages 
        WHERE room_id = ?
        ORDER BY timestamp ASC
        LIMIT ?
      `);

      const rows = stmt.all(roomId, limit);
      
      const messages = rows.map(row => ({
        id: row.id,
        content: row.content,
        sender: row.sender,
        timestamp: row.timestamp,
        type: row.type,
        roomId: roomId,
        synced: true
      }));
      
      console.log(`📚 Loaded ${messages.length} messages for room ${roomId}`);
      return messages;
    } catch (err) {
      console.error('Error fetching messages:', err);
      throw err;
    }
  }

  async getAllRooms() {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT r.id, r.created_at, r.last_activity, r.participant_count,
               COUNT(m.id) as message_count
        FROM rooms r
        LEFT JOIN messages m ON r.id = m.room_id
        GROUP BY r.id, r.created_at, r.last_activity, r.participant_count
        ORDER BY r.last_activity DESC
      `);

      return stmt.all();
    } catch (err) {
      console.error('Error fetching rooms:', err);
      throw err;
    }
  }

  async updateParticipantCount(roomId, count) {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        UPDATE rooms 
        SET participant_count = ?, last_activity = ?
        WHERE id = ?
      `);
      
      stmt.run(count, Date.now(), roomId);
    } catch (err) {
      console.error('Error updating participant count:', err);
      throw err;
    }
  }

  async cleanupOldData(maxAgeHours = 24) {
    if (!this.isInitialized) await this.initialize();

    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    try {
      // First, delete old messages
      const deleteMessagesStmt = this.db.prepare(`
        DELETE FROM messages 
        WHERE room_id IN (
          SELECT id FROM rooms WHERE last_activity < ? AND participant_count = 0
        )
      `);

      deleteMessagesStmt.run(cutoffTime);

      // Then delete old rooms
      const deleteRoomsStmt = this.db.prepare(`
        DELETE FROM rooms 
        WHERE last_activity < ? AND participant_count = 0
      `);

      const result = deleteRoomsStmt.run(cutoffTime);
      console.log(`🧹 Cleaned up ${result.changes} old rooms`);
      return result.changes;
    } catch (err) {
      console.error('Error during cleanup:', err);
      throw err;
    }
  }

  async getStats() {
    if (!this.isInitialized) await this.initialize();

    try {
      const stmt = this.db.prepare(`
        SELECT 
          (SELECT COUNT(*) FROM rooms) as total_rooms,
          (SELECT COUNT(*) FROM messages) as total_messages,
          (SELECT COUNT(*) FROM rooms WHERE participant_count > 0) as active_rooms,
          (SELECT MAX(last_activity) FROM rooms) as latest_activity
      `);

      const row = stmt.get();
      
      return {
        totalRooms: row.total_rooms || 0,
        totalMessages: row.total_messages || 0,
        activeRooms: row.active_rooms || 0,
        latestActivity: row.latest_activity || 0
      };
    } catch (err) {
      console.error('Error fetching stats:', err);
      throw err;
    }
  }

  async close() {
    if (this.db) {
      try {
        console.log('🔒 Closing SQLite database...');
        this.db.close();
        console.log('✅ Database connection closed');
        this.db = null;
        this.isInitialized = false;
      } catch (err) {
        console.error('❌ Error closing database:', err);
        this.db = null;
        this.isInitialized = false;
      }
    } else {
      console.log('📁 Database already closed');
    }
  }

  // Helper method to convert in-memory room data to database
  async migrateFromMemory(memoryRooms) {
    if (!this.isInitialized) await this.initialize();

    console.log('🔄 Migrating in-memory data to database...');
    
    for (const [roomId, room] of memoryRooms.entries()) {
      try {
        // Create room
        await this.createRoom(roomId);
        await this.updateParticipantCount(roomId, room.peers ? room.peers.size : 0);
        
        // Save messages
        if (room.messages && room.messages.length > 0) {
          for (const message of room.messages) {
            try {
              await this.saveMessage(roomId, message);
            } catch (err) {
              // Skip duplicates
              if (!err.message.includes('UNIQUE constraint failed')) {
                console.warn('Error migrating message:', err);
              }
            }
          }
        }
        
        console.log(`✅ Migrated room ${roomId}: ${room.messages?.length || 0} messages`);
      } catch (err) {
        console.error(`Error migrating room ${roomId}:`, err);
      }
    }
    
    console.log('🎉 Migration complete!');
  }
}

module.exports = MessagePersistence;
