import express from 'express';
import { createServer } from "http";

import { WebSocketServer } from 'ws';
import orchestrator from './orchestrator.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 8081;

wss.on('connection', (ws) => {
  console.log('Client connected to server');
  orchestrator(ws);
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
