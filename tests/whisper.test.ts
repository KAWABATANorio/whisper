import { whisper } from '../src/whisper'

test('whisper test1', async () => {
  const text = await whisper(__dirname + '/../recordings/imposter.webm');
  console.log(text);
}, 10000);
test('whisper test2', async () => {
  const text = await whisper(__dirname + '/../recordings/pink-dakarana.webm');
  console.log(text);
}, 10000);
