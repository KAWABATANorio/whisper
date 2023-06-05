import { ReadStream, createWriteStream } from 'node:fs';
import ffmpeg from 'fluent-ffmpeg';

export function opusStreamToWebm(inputStream: ReadStream, filename: string): Promise<void> {
  console.log(`👂 Started recording ${filename}`);
  return new Promise<void>((resolve, reject) => {
    try {
      const out = createWriteStream(filename);
      const start = new Date();
  
      ffmpeg()
        .input(inputStream)
        .inputFormat('ogg')
        .audioCodec('libopus')
        .audioChannels(2)
        .outputFormat('webm')
        .on('error', (e: Error) => {
          throw e;
        })
        .on('end', () => {
          console.log(`✅ Recorded ${filename}, ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
          resolve();
        })
        .pipe(out, { end: true });
    } catch (e) {
      console.warn(`❌ Error recording file ${filename} - ${(e as Error).message}`);
      reject(e);
    }
  });
}
