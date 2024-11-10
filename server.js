import { RealtimeRelay } from './relay.js';
import OpenAI from "openai";
import { WebSocketServer } from 'ws';
import fetch from "node-fetch";
// const express = require('express');
// const bodyParser = require('body-parser');
import { createServer } from "http";
import dotenv from 'dotenv';
// const dotenv = require('dotenv');

dotenv.config({ override: true }); // Load API key from .env file

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error(
    `Environment variable "OPENAI_API_KEY" is required.\n` +
      `Please set it in your .env file.`
  );
  process.exit(1);
}

const PORT = parseInt(process.env.PORT) || 8081;

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/openai/completion") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { messages } = JSON.parse(body);
        
        // Make a completion request to OpenAI
        const completion = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages,
        });

        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(completion));
      } catch (error) {
        console.error("Error handling completion:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  }
});

const proxyServer = createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*"); // Replace '*' with your client origin in production
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "POST" && req.url === "/proxy/openai") {
    let body = "";

    // Collect incoming data from client
    req.on("data", chunk => {
      body += chunk;
    });

    req.on("end", async () => {
      try {
        // Parse client data to get messages
        const { messages } = JSON.parse(body);

        // Make a request to OpenAI API
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o", // or any model you need
            messages
          })
        });

        // Process and forward the response back to the client
        const responseData = await openaiResponse.json();
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(responseData));
      } catch (error) {
        console.error("Error making OpenAI request:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to fetch data from OpenAI" }));
      }
    });
  }
  else if (req.method === "POST" && req.url === "/tts") {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", async () => {
      try {
        const { messages } = body;
        console.log(body);
        const completion = await openai.audio.speech.create({
          model: "tts-1",
          voice: "shimmer",
          input: body,
          // response_format: 'pcm',
        });
        console.log('foo');
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(completion));
      } catch (error) {
        console.error("Error handling completion:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: error.message }));
      }
    });
  }
  else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));
  }
});

const wss = new WebSocketServer({ server: proxyServer });
const relay = new RealtimeRelay(OPENAI_API_KEY);
relay.setWebSocketServer(wss); // Create a method to set the WebSocket server if needed

proxyServer.listen(PORT, () => {
  console.log(`HTTP & WebSocket server listening on http://localhost:${PORT}`);
});

// const relay = new RealtimeRelay(OPENAI_API_KEY);
// relay.listen(PORT);
