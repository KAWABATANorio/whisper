import { createReadStream, createWriteStream } from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';

test('whisper test1', async () => {
  const input = createReadStream(__dirname + '/../recordings/imposter.ogg');
  const output = createWriteStream(__dirname + '/../recordings/imposter.webm');

  ffmpeg()
    .input(input)
    .inputFormat('ogg')
    .audioCodec('libopus')
    .audioChannels(1)
    .outputFormat('webm')
    .on('error', (err: Error) => {
      console.warn(`❌ Error recording file - ${err.message}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on('end', () => {})
    .pipe(output, { end: true });

}, 10000);
