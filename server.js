const http = require('http');
const path = require('path');
const express = require('express');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WS_PATH = '/ws';

const app = express();
app.use(express.static(PUBLIC_DIR));

// Basic 404 handler for non-static routes.
app.use((req, res) => {
  res.status(404).type('text').send('Not found');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

wss.on('connection', (socket, request) => {
  const clientAddress = request.socket.remoteAddress;
  console.log(`Client connected: ${clientAddress}`);

  socket.send(
    JSON.stringify({
      type: 'system',
      message: 'Connected to websocket server'
    })
  );

  socket.on('message', (data) => {
    const messageText = data.toString();
    console.log(`Received: ${messageText}`);

    const payload = JSON.stringify({
      type: 'chat',
      from: clientAddress,
      message: messageText,
      timestamp: Date.now()
    });

    for (const client of wss.clients) {
      if (client.readyState === client.OPEN) {
        client.send(payload);
      }
    }
  });

  socket.on('close', () => {
    console.log(`Client disconnected: ${clientAddress}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}${WS_PATH}`);
});
