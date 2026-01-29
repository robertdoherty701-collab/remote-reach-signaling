const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active devices
const devices = new Map();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    activeDevices: devices.size,
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  let registeredDeviceId = null;

  // Register device
  socket.on('register', (data, callback) => {
    const { deviceId, deviceName, password, platform } = data;

    // Check if device ID is already taken
    if (devices.has(deviceId) && devices.get(deviceId).socket.id !== socket.id) {
      callback({ error: 'Device ID already registered' });
      return;
    }

    registeredDeviceId = deviceId;

    devices.set(deviceId, {
      socket,
      deviceName,
      password,
      platform,
      connectedAt: Date.now()
    });

    console.log(`Device registered: ${deviceId} (${deviceName})`);
    callback({ success: true, deviceId });
  });

  // Connection request from viewer to host
  socket.on('connect-request', ({ targetId, password }) => {
    const target = devices.get(targetId);

    if (!target) {
      socket.emit('connect-error', { error: 'Dispositivo não encontrado' });
      return;
    }

    if (target.password !== password) {
      socket.emit('connect-error', { error: 'Senha inválida' });
      return;
    }

    // Get requester info
    const requester = [...devices.entries()].find(([_, v]) => v.socket.id === socket.id);
    const requesterId = requester ? requester[0] : socket.id;
    const requesterName = requester ? requester[1].deviceName : 'Unknown';

    // Forward request to target device
    target.socket.emit('incoming-connection', {
      fromId: requesterId,
      fromName: requesterName
    });

    console.log(`Connection request: ${requesterId} -> ${targetId}`);
  });

  // Accept connection
  socket.on('accept-connection', ({ fromId }) => {
    const requester = devices.get(fromId);

    if (!requester) {
      socket.emit('connect-error', { error: 'Solicitante não encontrado' });
      return;
    }

    // Get accepter info
    const accepter = [...devices.entries()].find(([_, v]) => v.socket.id === socket.id);
    const accepterId = accepter ? accepter[0] : socket.id;

    // Notify requester that connection was accepted
    requester.socket.emit('connection-accepted', {
      fromId: accepterId
    });

    console.log(`Connection accepted: ${accepterId} -> ${fromId}`);
  });

  // Reject connection
  socket.on('reject-connection', ({ fromId, reason }) => {
    const requester = devices.get(fromId);

    if (requester) {
      requester.socket.emit('connection-rejected', { reason });
    }

    console.log(`Connection rejected: -> ${fromId}`);
  });

  // WebRTC signaling
  socket.on('signal', ({ targetId, signal }) => {
    const target = devices.get(targetId);

    if (target) {
      // Get sender info
      const sender = [...devices.entries()].find(([_, v]) => v.socket.id === socket.id);
      const senderId = sender ? sender[0] : socket.id;

      target.socket.emit('signal', {
        fromId: senderId,
        signal
      });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);

    if (registeredDeviceId) {
      devices.delete(registeredDeviceId);

      // Notify connected peers
      devices.forEach((device) => {
        device.socket.emit('peer-disconnected', {
          peerId: registeredDeviceId
        });
      });

      console.log(`Device unregistered: ${registeredDeviceId}`);
    }
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
