import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { WebSocketServer } from "ws";
import path from "path";
import { createServer } from "http";
import fs from "fs";
import { RealtimeRelay } from './relay.js';
import { handleWhisperConnection } from './whisperHandler.js';

dotenv.config({ override: true });
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8081;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const relay = new RealtimeRelay(OPENAI_API_KEY);

const httpServer = createServer(app);

const wss = new WebSocketServer({ server: httpServer });

httpServer.on('upgrade', (request, socket, head) => {
  const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (pathname === '/openai') {
    wss.handleUpgrade(request, socket, head, (ws) => {
      relay.setWebSocketServer(ws);
      relay.connectionHandler(ws, request);
    });
  } else if (pathname === '/whisper') {
    console.log('whisper!');
    wss.handleUpgrade(request, socket, head, (ws) => {
      handleWhisperConnection(ws);
    });
  } else {
    socket.destroy();  // Close connections to unsupported paths
  }
});

async function handleTTS(req, res) {
  try {
    const { input, model = "tts-1", voice = "shimmer", response_format= "mp3" } = req.body;
    const outputPath = path.resolve("./temp_speech.mp3");

    const mp3 = await openai.audio.speech.create({ model, voice, input, response_format });
    const buffer = Buffer.from(await mp3.arrayBuffer());
    await fs.promises.writeFile(outputPath, buffer);

    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Disposition", "attachment; filename=speech.mp3");

    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);
    fileStream.on("end", () => fs.promises.unlink(outputPath).catch(console.error));
  } catch (error) {
    console.error("Error in TTS:", error);
    res.status(500).json({ error: "TTS failed" });
  }
}

app.post("/api/tts", handleTTS);

app.post("/api/completion", async (req, res) => {
  try {
    const { messages } = req.body;
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
    });
    res.json(completion);
  } catch (error) {
    console.error("Error in text-to-text:", error);
    res.status(500).json({ error: error.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`HTTP & WebSocket server listening on http://localhost:${PORT}`);
});
