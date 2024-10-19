import { RealtimeRelay } from './relay.js';
// import OpenAI from "openai";
// const express = require('express');
// const bodyParser = require('body-parser');
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

const relay = new RealtimeRelay(OPENAI_API_KEY);
relay.listen(PORT);

// const app = express();
// const port = 3000;

// app.use(bodyParser.json());

// const openai = new OpenAI({
//   organization: process.env.OPENAI_ORG_ID,
//   project: process.env.OPENAI_PROJ_ID,
// });


// // Define a route to handle text messages
// app.post('/send-text', async (req, res) => {
//   const { text } = req.body;

//   try {
//     // Send text message to OpenAI API
//     await client.connect();
//     client.sendUserMessageContent([{ type: 'input_text', text }]);

//     client.on('conversation.updated', (event) => {
//       const { item } = event;
//       res.status(200).json({ reply: item });
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error communicating with OpenAI');
//   }
// });

// // Define a route to handle audio input
// app.post('/send-audio', async (req, res) => {
//   const { audio } = req.body; // Assume audio is sent as Int16Array

//   try {
//     await client.connect();
//     client.appendInputAudio(new Int16Array(audio)); // Send streaming audio
//     client.createResponse(); // Trigger response generation

//     client.on('conversation.updated', (event) => {
//       const { delta } = event;
//       if (delta.transcript) {
//         res.status(200).json({ transcript: delta.transcript });
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Error processing audio');
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });

