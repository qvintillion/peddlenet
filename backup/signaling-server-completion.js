          
          // Clear room messages when room is completely empty
          if (messageStore.has(roomId)) {
            messageStore.delete(roomId);
            console.log(`🗑️ Messages for room ${roomId} deleted (room empty)`);
          }
        }
      } else {
        console.log(`⚠️ User ${displayName} tried to leave non-existent room ${roomId}`);
      }
    }
    
    // Clear socket user data
    socket.userData = null;
  });
});

// Start server
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🎵 PeddleNet Signaling Server v1.1.0-admin-enhanced running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
  console.log(`🎡 Server info: http://localhost:${PORT}/`);
  console.log(``);
  console.log(`📋 ROOM CODE ENDPOINTS:`);
  console.log(`   POST http://localhost:${PORT}/register-room-code`);
  console.log(`   GET  http://localhost:${PORT}/resolve-room-code/:code`);
  console.log(`   GET  http://localhost:${PORT}/room-stats/:roomId`);
  console.log(``);
  console.log(`📊 ENHANCED ADMIN DASHBOARD ENDPOINTS:`);
  console.log(`   GET  http://localhost:${PORT}/admin/analytics`);
  console.log(`   GET  http://localhost:${PORT}/admin/activity`);
  console.log(`   GET  http://localhost:${PORT}/admin/users/detailed`);
  console.log(`   GET  http://localhost:${PORT}/admin/rooms/detailed`);
  console.log(`   POST http://localhost:${PORT}/admin/broadcast`);
  console.log(`   POST http://localhost:${PORT}/admin/broadcast/room`);
  console.log(`   POST http://localhost:${PORT}/admin/room/clear [SUPER ADMIN]`);
  console.log(`   POST http://localhost:${PORT}/admin/database/wipe [SUPER ADMIN]`);
  console.log(``);
  console.log(`🔐 ADMIN SECURITY LEVELS:`);
  console.log(`   Basic Admin: ${ADMIN_CREDENTIALS.basic.username} / ${ADMIN_CREDENTIALS.basic.password}`);
  console.log(`   Super Admin: ${ADMIN_CREDENTIALS.super.username} / ${ADMIN_CREDENTIALS.super.password}`);
  console.log(``);
  console.log(`✅ ENHANCED FEATURES:`);
  console.log(`   ✅ Fixed unique user counting (no double counting across rooms)`);
  console.log(`   ✅ All created rooms visible (not just active ones)`);
  console.log(`   ✅ Super admin password for destructive operations`);
  console.log(`   ✅ Broadcast to specific rooms by room code`);
  console.log(`   ✅ Enhanced user and room tracking`);
  console.log(`   ✅ Comprehensive analytics and monitoring`);
  console.log(``);
  console.log(`🌐 Frontend: http://localhost:3000`);
  console.log(`🔧 Admin Dashboard: http://localhost:3000/admin-analytics`);
});

module.exports = { app, server, io };
