import { whisper } from '../src/whisper'

test('whisper', async () => {
  const start = new Date();
  const text = await whisper(`${__dirname}/../recordings/imposter.webm`);
  const measure = new Date().getTime() - start.getTime();
  console.log(text);
  console.log(`✅ ${measure.toLocaleString()} ms`);
}, 10000);
