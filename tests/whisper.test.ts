import { createReadStream } from 'node:fs';
import { whisper, speechToText } from '../src/transcript'

test('whisper', async () => {
  const start = new Date();
  const text = await whisper(`${__dirname}/../recordings/imposter.webm`);
  const measure = new Date().getTime() - start.getTime();
  console.log(text);
  console.log(`✅ ${measure.toLocaleString()} ms`);
}, 10000);

test('speechToText', async () => {
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);
  const text = await speechToText(input);
  console.log(text);
}, 30000);
