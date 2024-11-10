import { createClient, LiveTranscriptionEvents } from "@deepgram/sdk";
import dotenv from "dotenv";

dotenv.config();

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export const handleDeepgramConnection = async (ws) => {
  const connection = deepgram.listen.live({
    model: "nova-2",
    language: "en-US",
    smart_format: true,
    encoding: 'linear16',
    sample_rate: 24000,
  });

  connection.on(LiveTranscriptionEvents.Open, () => {
    console.log("Connected to Deepgram for transcription.");

    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      if (data.channel.alternatives[0].transcript) {
        console.log(data);
        ws.send(data.channel.alternatives[0].transcript); // Send transcript back to client
      }
    });

    connection.on(LiveTranscriptionEvents.Error, (err) => {
      console.error("Deepgram Error:", err);
      ws.send("Error with transcription service");
    });
  });

  ws.on("message", (audioChunk) => {
    if (Buffer.isBuffer(audioChunk)) {
      connection.send(audioChunk);
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected.");
  });
};
