import { createReadStream } from 'node:fs';
import { opusStreamToWebm } from '../src/ffmpeg';

async function ogg2webm(): Promise<number> {
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);
  const start = new Date();
  await opusStreamToWebm(input, `${__dirname}/../recordings/imposter.webm`);
  return new Date().getTime() - start.getTime();
}

test('ffmpeg', async () => {
  const measure = await ogg2webm();
  console.log(`✅ ${measure.toLocaleString()} ms`);
});

test('measure', async () => {
  let total = 0;
  const times = 10;
  for (let n = 0; n < times; n++) {
    const measure = await ogg2webm();
    total += measure;
    console.log(`✅ ${measure.toLocaleString()} ms`);
  }
  console.log(`Average: ${(total / times).toLocaleString()} ms`);
}, 10000);
