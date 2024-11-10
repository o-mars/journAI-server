import { spawn } from 'child_process';

export const handleWhisperConnection = (ws) => {
  console.log('Client connected for Whisper transcription');
  
  const whisperProcess = spawn('./stream.stdin', [
    '-m', './models/ggml-base.en.bin',
    '-t', '8',
    '--step', '0',
    '--length', '3000',
    '-vth', '0.85'
  ], {
    cwd: '../whisper.cpp'
  });

  ws.on('message', (audioChunk) => {
    whisperProcess.stdin.write(audioChunk);
  });

  whisperProcess.stdout.on('data', (transcription) => {
    ws.send(JSON.stringify({ type: 'transcription', data: transcription.toString() }));
  });

  ws.on('close', () => {
    whisperProcess.stdin.end();
    whisperProcess.kill();
    console.log('Whisper client disconnected');
  });
};
