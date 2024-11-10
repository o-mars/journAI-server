import { handleSpeechToText } from './stt.js';
import { handleTextToSpeech } from './tts.js';
import { handleOpenAITextProcessing, initializeOpenAIConnection, initClient, sendText } from './openai.js';

export default function orchestrator(ws) {
  initClient(async (openAIResponse) => {
    sendOpenAITextResponseToClient(ws, openAIResponse);

    const ttsResponse = await handleTextToSpeech(openAIResponse);
    sendTextToSpeechResponseToClient(ws, ttsResponse);
  })

  handleSpeechToText(ws, async (sttResponse) => {
    sendSpeechToTextResponseToClient(ws, sttResponse);

    await sendText(sttResponse);
    // sendOpenAiTextResponseToClient(ws, openAIResponse);

    // const ttsResponse = await handleTextToSpeech(sttResponse);
    // sendTextToSpeechResponseToClient(ws, ttsResponse);
  })
}

function sendSpeechToTextResponseToClient(clientConnection, response) {
  clientConnection.send(JSON.stringify({ type: 'stt', data: response }));
}

function sendOpenAITextResponseToClient(clientConnection, response) {
  clientConnection.send(JSON.stringify({ type: 'openai-response', data: response }));
}

function sendTextToSpeechResponseToClient(clientConnection, response) {
  clientConnection.send(JSON.stringify({ type: 'tts', data: null }));
  clientConnection.send(response);
}
