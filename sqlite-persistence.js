// sqlite-persistence.js - Message persistence with SQLite
const sqlite3 = require('sqlite3').verbose();
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

    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('📁 Connected to SQLite database:', this.dbPath);
        this.createTables()
          .then(() => {
            this.isInitialized = true;
            console.log('✅ Database initialized successfully');
            resolve();
          })
          .catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
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

      this.db.exec(sql, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
        } else {
          console.log('📋 Database tables ready');
          resolve();
        }
      });
    });
  }

  async createRoom(roomId) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR IGNORE INTO rooms (id, created_at, last_activity)
        VALUES (?, ?, ?)
      `;
      const now = Date.now();
      
      this.db.run(sql, [roomId, now, now], function(err) {
        if (err) {
          console.error('Error creating room:', err);
          reject(err);
        } else {
          console.log(`🏠 Room created/verified: ${roomId}`);
          resolve();
        }
      });
    });
  }

  async saveMessage(roomId, message) {
    if (!this.isInitialized) await this.initialize();

    // Ensure room exists
    await this.createRoom(roomId);

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO messages (id, room_id, content, sender, timestamp, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const values = [
        message.id,
        roomId,
        message.content,
        message.sender,
        message.timestamp,
        message.type || 'chat',
        Date.now()
      ];

      this.db.run(sql, values, (err) => {
      if (err) {
      console.error('Error saving message:', err);
      reject(err);
      } else {
      console.log(`💾 Message saved: ${message.id} in ${roomId}`);
      // Update room last activity
      this.updateRoomActivity(roomId);
      resolve(message);
      }
      });
    });
  }

  async updateRoomActivity(roomId) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE rooms 
        SET last_activity = ?
        WHERE id = ?
      `;
      
      this.db.run(sql, [Date.now(), roomId], function(err) {
        if (err) {
          console.error('Error updating room activity:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getRoomMessages(roomId, limit = 100) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, content, sender, timestamp, type
        FROM messages 
        WHERE room_id = ?
        ORDER BY timestamp ASC
        LIMIT ?
      `;

      this.db.all(sql, [roomId, limit], (err, rows) => {
        if (err) {
          console.error('Error fetching messages:', err);
          reject(err);
        } else {
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
          resolve(messages);
        }
      });
    });
  }

  async getAllRooms() {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT r.id, r.created_at, r.last_activity, r.participant_count,
               COUNT(m.id) as message_count
        FROM rooms r
        LEFT JOIN messages m ON r.id = m.room_id
        GROUP BY r.id, r.created_at, r.last_activity, r.participant_count
        ORDER BY r.last_activity DESC
      `;

      this.db.all(sql, [], (err, rows) => {
        if (err) {
          console.error('Error fetching rooms:', err);
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  async updateParticipantCount(roomId, count) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE rooms 
        SET participant_count = ?, last_activity = ?
        WHERE id = ?
      `;
      
      this.db.run(sql, [count, Date.now(), roomId], function(err) {
        if (err) {
          console.error('Error updating participant count:', err);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async cleanupOldData(maxAgeHours = 24) {
    if (!this.isInitialized) await this.initialize();

    const cutoffTime = Date.now() - (maxAgeHours * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      // First, delete old messages
      const deleteMessagesSql = `
        DELETE FROM messages 
        WHERE room_id IN (
          SELECT id FROM rooms WHERE last_activity < ? AND participant_count = 0
        )
      `;

      this.db.run(deleteMessagesSql, [cutoffTime], (err) => {
        if (err) {
          console.error('Error deleting old messages:', err);
          reject(err);
          return;
        }

        // Then delete old rooms
        const deleteRoomsSql = `
          DELETE FROM rooms 
          WHERE last_activity < ? AND participant_count = 0
        `;

        this.db.run(deleteRoomsSql, [cutoffTime], function(err) {
          if (err) {
            console.error('Error deleting old rooms:', err);
            reject(err);
          } else {
            console.log(`🧹 Cleaned up ${this.changes} old rooms`);
            resolve(this.changes);
          }
        });
      });
    });
  }

  async getStats() {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      const sql = `
        SELECT 
          (SELECT COUNT(*) FROM rooms) as total_rooms,
          (SELECT COUNT(*) FROM messages) as total_messages,
          (SELECT COUNT(*) FROM rooms WHERE participant_count > 0) as active_rooms,
          (SELECT MAX(last_activity) FROM rooms) as latest_activity
      `;

      this.db.get(sql, [], (err, row) => {
        if (err) {
          console.error('Error fetching stats:', err);
          reject(err);
        } else {
          resolve({
            totalRooms: row.total_rooms || 0,
            totalMessages: row.total_messages || 0,
            activeRooms: row.active_rooms || 0,
            latestActivity: row.latest_activity || 0
          });
        }
      });
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        console.log('🔒 Closing SQLite database...');
        
        // Force close after timeout
        const timeout = setTimeout(() => {
          console.log('⚠️ Database close timeout, forcing exit');
          this.db = null;
          resolve();
        }, 2000);
        
        this.db.close((err) => {
          clearTimeout(timeout);
          if (err) {
            console.error('❌ Error closing database:', err);
          } else {
            console.log('✅ Database connection closed');
          }
          this.db = null;
          this.isInitialized = false;
          resolve();
        });
      });
    } else {
      console.log('📁 Database already closed');
      return Promise.resolve();
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