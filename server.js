const http = require('http');
const path = require('path');
const fs = require('fs');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WS_PATH = '/ws';

const server = http.createServer((req, res) => {
  if (serveStatic(req, res)) {
    return;
  }

  res.statusCode = 404;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Not found');
});

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

function serveStatic(req, res) {
  const sanitizedPath = path.normalize(req.url.split('?')[0]).replace(/^(\.\.[/\\])+/, '');
  const requestPath = sanitizedPath === '/' ? '/index.html' : sanitizedPath;
  const filePath = path.join(PUBLIC_DIR, requestPath);

  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Bad request');
    return true;
  }

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain');
      res.end('Internal server error');
      return;
    }

    res.statusCode = 200;
    res.setHeader('Content-Type', getContentType(filePath));
    res.end(content);
  });

  return true;
}

function getContentType(filePath) {
  const ext = path.extname(filePath);
  switch (ext) {
    case '.html':
      return 'text/html; charset=UTF-8';
    case '.js':
      return 'application/javascript; charset=UTF-8';
    case '.css':
      return 'text/css; charset=UTF-8';
    case '.json':
      return 'application/json; charset=UTF-8';
    default:
      return 'application/octet-stream';
  }
}
