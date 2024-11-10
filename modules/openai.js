import dotenv from "dotenv";
import OpenAI from "openai";
import WebSocket from "ws";
import { RealtimeClient } from '@openai/realtime-api-beta';

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const url = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01";


export async function handleTextToSpeech(text) {
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'shimmer',
      input: text,
      response_format: 'wav',
    });

    console.log(response);

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error("Error in TTS:", error);
  }
}

let realtimeClient = null;

export async function initClient(callback) {
  if (realtimeClient) return;

  realtimeClient = new RealtimeClient({ url: url, apiKey: OPENAI_API_KEY });
  await realtimeClient.connect();
  realtimeClient.updateSession({ 
    modalities: ['text'],
    instructions: 'Ask me about my mood, and be empathetic and reflective.'
  });

  realtimeClient.realtime.on("server.session.created", (x) => {
    console.log("Connected to OpenAI real-time client", x);
  });

  realtimeClient.realtime.on("server.session.updated", (x) => {
    console.log("SESSION UPDATE", x);
  });

  realtimeClient.realtime.on("server.response.text.done", (x) => {
    console.log("RES TEXT", x);
    if (x.text) callback(x.text);
  });

  realtimeClient.on("error", (error) => {
    console.error("Error in OpenAI WebSocket:", error);
  });

  realtimeClient.on("close", () => {
    console.log("Disconnected from OpenAI real-time client");
    realtimeClient = null;
  });
}

export function sendText(text) {
  return new Promise((resolve, reject) => {
    if (realtimeClient.isConnected()) {
      realtimeClient.sendUserMessageContent([{ type: 'input_text', text}]);
      console.log('sent request for user message to RTC');
      resolve();
    } else {
      reject("OpenAI connection is not established");
    }
  });
}

let openAIConnection = null;

export function initializeOpenAIConnection(callback) {
  if (openAIConnection && openAIConnection.readyState === WebSocket.OPEN) {
    return; // Connection already exists
  }


  openAIConnection = new WebSocket(url, {
    headers: {
        "Authorization": "Bearer " + process.env.OPENAI_API_KEY,
        "OpenAI-Beta": "realtime=v1",
    },
  });

  openAIConnection.on("open", () => {
    console.log("Connected to OpenAI real-time client");
  });

  openAIConnection.on("message", (message) => {
    const data = JSON.parse(message);
    console.log('OAI Resp', data);
    if (data.response && callback) {
      console.log('OAI Callback');
      callback(data.response); // Pass response to the callback function
    }
  });

  openAIConnection.on("error", (error) => {
    console.error("Error in OpenAI WebSocket:", error);
  });

  openAIConnection.on("close", () => {
    console.log("Disconnected from OpenAI real-time client");
    openAIConnection = null;
  });
}

export function handleOpenAITextProcessing(text) {
  return new Promise((resolve, reject) => {
    if (openAIConnection && openAIConnection.readyState === WebSocket.OPEN) {

      const event = {
        type: 'conversation.item.create',
        item: {
          type: 'message',
          role: 'user',
          content: [
            {
              text,
              type: 'input_text',
            }
          ]
        }
      };

      openAIConnection.send(JSON.stringify(event));
      openAIConnection.send(JSON.stringify({type: 'response.create'}));
      resolve();
    } else {
      reject("OpenAI connection is not established");
    }
  });
}