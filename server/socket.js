const { Server } = require('socket.io');

let io = null;

function initIO(server) {
  if (io) return io;

  io = new Server(server, {
    cors: {
      origin: [
        'https://kotakbasai.vercel.app',
        'https://kotakbasai.onrender.com',
        'http://localhost:3000',
        'http://localhost:5173'
      ],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Store connected users and admins
  const connectedUsers = new Map();
  const connectedAdmins = new Set();

  io.on('connection', (socket) => {
    console.log('🔌 Socket connected:', socket.id);
    console.log('   Rooms before join:', Array.from(socket.rooms));

    socket.on('user:join', (userId) => {
      connectedUsers.set(socket.id, userId);
      socket.join(`user:${userId}`);
      console.log(`👤 User ${userId} joined socket ${socket.id}`);
      console.log('   Rooms after join:', Array.from(socket.rooms));
    });

    socket.on('admin:join', () => {
      connectedAdmins.add(socket.id);
      socket.join('admin:room');
      console.log(`🔧 Admin joined socket ${socket.id}`);
      console.log('   Rooms after join:', Array.from(socket.rooms));
    });

    socket.on('disconnect', () => {
      const userId = connectedUsers.get(socket.id);
      if (userId) {
        connectedUsers.delete(socket.id);
        console.log(`👤 User ${userId} disconnected`);
      }
      if (connectedAdmins.has(socket.id)) {
        connectedAdmins.delete(socket.id);
        console.log(`🔧 Admin disconnected socket ${socket.id}`);
      }
    });
  });

  // Add debug: log connected sockets count periodically
  setInterval(() => {
    console.log(`📊 Socket.IO stats: ${io.engine.clientsCount} clients connected`);
    console.log(`   Connected users: ${connectedUsers.size}`);
    console.log(`   Connected admins: ${connectedAdmins.size}`);
  }, 30000);

  return io;
}

function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initIO() first.');
  }
  return io;
}

module.exports = { initIO, getIO };
