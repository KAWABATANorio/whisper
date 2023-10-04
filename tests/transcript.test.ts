import { createReadStream } from 'node:fs';
import { ITranscriptClient, Whisper, FasterWhisper, SpeechToText } from '../src/transcript'

export class Client implements ITranscriptClient {
  public onMessage(message: string): void {
    console.log(message);
  }
}

test('whisper', async () => {
  const start = new Date();
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);

  await (new Whisper(new Client())).transcript(input);

  const measure = new Date().getTime() - start.getTime();
  console.log(`✅ ${measure.toLocaleString()} ms`);
}, 10000);

test('speechToText', async () => {
  const start = new Date();
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);

  await (new SpeechToText(new Client())).transcript(input);

  const measure = new Date().getTime() - start.getTime();
  console.log(`✅ ${measure.toLocaleString()} ms`);
}, 30000);

test('faster-whisper', async () => {
  const start = new Date();
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);

  await (new FasterWhisper(new Client())).transcript(input);

  const measure = new Date().getTime() - start.getTime();
  console.log(`✅ ${measure.toLocaleString()} ms`);
}, 120000);
