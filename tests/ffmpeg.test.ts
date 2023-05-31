import { createReadStream, createWriteStream } from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';

async function ogg2webm(): Promise<number> {
  const input = createReadStream(`${__dirname}/../recordings/imposter.ogg`);
  const output = createWriteStream(`${__dirname}/../recordings/imposter.webm`);
  const start = new Date();

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(input)
      .inputFormat('ogg')
      .audioCodec('libopus')
      .audioChannels(1)
      .outputFormat('webm')
      .on('error', (err: Error) => {
        console.warn(`❌ Error recording file - ${err.message}`);
        reject(err);
      })
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      .on('end', () => {
        const measure = new Date().getTime() - start.getTime();
        resolve(measure);
      })
      .pipe(output, { end: true });
  });
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
