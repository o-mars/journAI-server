import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

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
