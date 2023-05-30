import { whisper } from '../src/whisper'

test('whisper test', async () => {
  const text = await whisper(__dirname + '/../recordings/imposter.webm');
  console.log(text);
}, 10000);
