// sqlite-persistence-simple.js - Simplified SQLite persistence using sqlite3
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
        console.log('📁 Connected to SQLite database (sqlite3):', this.dbPath);
        
        // Create tables
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

  createTables() {
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
      `;

      this.db.exec(sql, (err) => {
        if (err) {
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
      const now = Date.now();
      this.db.run(
        'INSERT OR IGNORE INTO rooms (id, created_at, last_activity) VALUES (?, ?, ?)',
        [roomId, now, now],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`🏠 Room created/verified: ${roomId}`);
            resolve();
          }
        }
      );
    });
  }

  async saveMessage(roomId, message) {
    if (!this.isInitialized) await this.initialize();
    
    // Ensure room exists
    await this.createRoom(roomId);

    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO messages (id, room_id, content, sender, timestamp, type, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          message.id,
          roomId,
          message.content,
          message.sender,
          message.timestamp,
          message.type || 'chat',
          Date.now()
        ],
        function(err) {
          if (err) {
            reject(err);
          } else {
            console.log(`💾 Message saved: ${message.id} in ${roomId}`);
            resolve(message);
          }
        }
      );
    });
  }

  async getRoomMessages(roomId, limit = 100) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT id, content, sender, timestamp, type FROM messages WHERE room_id = ? ORDER BY timestamp ASC LIMIT ?',
        [roomId, limit],
        (err, rows) => {
          if (err) {
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
        }
      );
    });
  }

  async updateRoomActivity(roomId) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE rooms SET last_activity = ? WHERE id = ?',
        [Date.now(), roomId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async updateParticipantCount(roomId, count) {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE rooms SET participant_count = ?, last_activity = ? WHERE id = ?',
        [count, Date.now(), roomId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getAllRooms() {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT r.id, r.created_at, r.last_activity, r.participant_count,
                COUNT(m.id) as message_count
         FROM rooms r
         LEFT JOIN messages m ON r.id = m.room_id
         GROUP BY r.id, r.created_at, r.last_activity, r.participant_count
         ORDER BY r.last_activity DESC`,
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  async getStats() {
    if (!this.isInitialized) await this.initialize();

    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT 
          (SELECT COUNT(*) FROM rooms) as total_rooms,
          (SELECT COUNT(*) FROM messages) as total_messages,
          (SELECT COUNT(*) FROM rooms WHERE participant_count > 0) as active_rooms,
          (SELECT MAX(last_activity) FROM rooms) as latest_activity`,
        [],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              totalRooms: row?.total_rooms || 0,
              totalMessages: row?.total_messages || 0,
              activeRooms: row?.active_rooms || 0,
              latestActivity: row?.latest_activity || 0
            });
          }
        }
      );
    });
  }

  async close() {
    if (this.db) {
      return new Promise((resolve) => {
        console.log('🔒 Closing SQLite database...');
        this.db.close((err) => {
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

  // Fallback for development - just return empty arrays if DB fails
  async migrateFromMemory(memoryRooms) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      console.log('🔄 Migrating in-memory data to database...');
      
      for (const [roomId, room] of memoryRooms.entries()) {
        try {
          await this.createRoom(roomId);
          await this.updateParticipantCount(roomId, room.peers ? room.peers.size : 0);
          
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
    } catch (err) {
      console.error('Migration failed, continuing without persistence:', err);
    }
  }
}

module.exports = MessagePersistence;
