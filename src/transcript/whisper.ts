import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { ReadStream, rm, createReadStream } from 'node:fs';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { Transcripter } from './transcripter';
import { opusStreamToWebm } from '../ffmpeg';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_APIKEY!
});
const openai = new OpenAIApi(configuration);

export class Whisper extends Transcripter {

  private async spawnIfNeed(key: string): Promise<ChildProcessWithoutNullStreams> {
    const p = this.processMap.find(e => e.key === key);
    if (p) {
      return p.process;
    }

    const p0 = { key, process: spawn('') };
    this.processMap.push(p0);
    return new Promise((resolve, reject) => {
      p0.process
        .on('spawn', () => {
          resolve(p0.process);
        })
        .on('error', err => reject(err));
    });
  }

  private readonly processMap: Array<{
    key: string,
    process: ChildProcessWithoutNullStreams
  }> = [];

  public async transcript(oggStream: ReadStream, filenameBase = 'undefined'): Promise<void> {
    const filename = `./recordings/${Date.now()}-${filenameBase}.webm`;
    try {
      await opusStreamToWebm(oggStream, filename);

      const start = new Date();

      const p = await this.spawnIfNeed(filenameBase);
      oggStream.pipe(p.stdin, { end: true });

      const resp = await openai.createTranscription(
        createReadStream(filename) as any as File,
        'whisper-1',
        undefined,
        'text',
        0.2,
        'ja'
      );
    
      console.log(`whisper: ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);

      this.client.onMessage(resp.data as unknown as string);
    } catch (e) {
      throw e;
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      rm(filename, () => {});
    }
  }
}
