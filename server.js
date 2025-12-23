const http = require('http');
const path = require('path');
const express = require('express');
const mqtt = require('mqtt');
const { WebSocketServer } = require('ws');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const WS_PATH = '/ws';
const MQTT_HOST = requireEnv('MQTT_HOST');
const MQTT_PORT = parsePort(requireEnv('MQTT_PORT'));
const MQTT_USERNAME = requireEnv('MQTT_USERNAME');
const MQTT_PASSWORD = requireEnv('MQTT_PASSWORD');
const MQTT_URL = `mqtts://${MQTT_HOST}:${MQTT_PORT}`;

const app = express();
app.use(express.static(PUBLIC_DIR));

const latestReadings = new Map();

function requireEnv(key) {
  const value = process.env[key];
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
}

function parsePort(value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    console.error(`Invalid MQTT_PORT value: ${value}`);
    process.exit(1);
  }
  return num;
}

// Basic 404 handler for non-static routes.
app.use((req, res) => {
  res.status(404).type('text').send('Not found');
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: WS_PATH });

wss.broadcast = function broadcast(data) {
  const payload = JSON.stringify(data);
  for (const client of this.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
};

wss.on('connection', (socket, request) => {
  const clientAddress = request.socket.remoteAddress;
  console.log(`Client connected: ${clientAddress}`);

  // Send cached latest values to new client.
  for (const reading of latestReadings.values()) {
    socket.send(JSON.stringify(reading));
  }

  socket.on('close', () => {
    console.log(`Client disconnected: ${clientAddress}`);
  });
});

const mqttClient = mqtt.connect(MQTT_URL, {
  username: MQTT_USERNAME,
  password: MQTT_PASSWORD,
  reconnectPeriod: 2000
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT broker');
  mqttClient.subscribe('/sensor/#', (err) => {
    if (err) {
      console.error('MQTT subscribe error:', err.message);
    } else {
      console.log('Subscribed to /sensor/#');
    }
  });
});

mqttClient.on('error', (err) => {
  console.error('MQTT error:', err.message);
});

mqttClient.on('message', (topic, message) => {
  const text = message.toString();

  try {
    const parsed = JSON.parse(text);

    if (!parsed.instance) {
      console.warn('MQTT payload missing instance, skipping');
      return;
    }

    latestReadings.set(parsed.instance, parsed);
    wss.broadcast(parsed);
  } catch (err) {
    console.error('MQTT payload is not valid JSON, skipping');
    return;
  }
});

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}${WS_PATH}`);
});
