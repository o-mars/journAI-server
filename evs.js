import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { RealtimeRelay } from './relay.js'; // Ensure this imports correctly
import { handleWhisperConnection } from './whisperHandler.js'; // Import the whisper handler
import { handleDeepgramConnection } from './deepgramHandler.js';

const PORT = 8081;

const proxyServer = createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/proxy/openai') {
    // Handle your HTTP POST requests for OpenAI here
    // relay.handleHttpRequest(req, res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocketServer({ server: proxyServer });
const relay = new RealtimeRelay(process.env.OPENAI_API_KEY);

wss.on('connection', (ws, req) => {
  const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;

  if (pathname === '/openai') {
    relay.setWebSocketServer(wss);
    relay.connectionHandler(ws, req); // Handle OpenAI WebSocket connections
  } else if (pathname === '/whisper') {
    handleDeepgramConnection(ws); // Handle Whisper WebSocket connections
    // handleWhisperConnection(ws); // Handle Whisper WebSocket connections
  } else {
    ws.close(1000, 'Unsupported path'); // Gracefully close unsupported WebSocket connections
  }
});

proxyServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
