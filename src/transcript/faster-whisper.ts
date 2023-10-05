import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { ReadStream, createWriteStream, rm } from 'node:fs';
import * as path from 'node:path';
import appRootPath from 'app-root-path';
import * as dotenv from 'dotenv';
import { Transcripter } from './transcripter';

dotenv.config();

export class FasterWhisper extends Transcripter {
  public override async init(filenameBase: string): Promise<void> {
    await this.spawnIfNeed(filenameBase);
  }

  private static readonly processMap = new Map<string, ChildProcessWithoutNullStreams>();

  private async spawnIfNeed(key: string): Promise<ChildProcessWithoutNullStreams> {
    const p = FasterWhisper.processMap.get(key);
    if (p) {
      return p;
    }

    const command = path.normalize(process.env.PYTHON_EXECUTABLE!);
    const param = path.normalize(appRootPath.resolve('src/transcript/transcript_faster_whisper.py'));
    const p0 = spawn(command, ['-u', param]);
    FasterWhisper.processMap.set(key, p0);
    return new Promise((resolve, reject) => {
      p0.on('spawn', () => {
          console.log(`spawned python ${key}`);
          resolve(p0);
        })
        .on('close', () => {
          FasterWhisper.processMap.delete(key);
        })
        .stderr.on('data', err => {
          reject(err);
        });
    });
  }

  private transcriptByFasterWhisper(filename: string, childProcess: ChildProcessWithoutNullStreams): Promise<string> {
    return new Promise((resolve, reject) => {
      let receiveError: ((chunk: any) => void) | undefined = undefined;
      let receiveData: ((chunk: any) => void) | undefined = undefined;

      const removeListner = (p: ChildProcessWithoutNullStreams) => {
        p.stderr.removeListener('data', receiveError!);
        p.stdout.removeListener('data', receiveData!);
      }

      receiveError = (data: string) => {
        console.log(`Pythonからの出力: ${data}`);
        removeListner(childProcess);
        reject(data);
      };
      receiveData = (data: string) => {
        console.log(`Pythonからの出力: ${data}`);
        const message = data.toString();
        const startTag = '[result]';
        if (message.startsWith(startTag)) {
          const r = data.toString().split(startTag);
          if (r.length > 1) {
            removeListner(childProcess);
            resolve(r[1]!);
          }
        }
      };

      childProcess.stderr.on('data', receiveError);
      childProcess.stdout.on('data', receiveData);

      childProcess.stdin.write(`${filename}\n`);
    });
  }

  private writeOgg(oggStream: ReadStream, filename: string): Promise<void> {
    return new Promise(resolve0 =>
      oggStream
      .pipe(createWriteStream(filename)
        .on('finish', resolve0), { end: true })
    );
  }

  public async transcript(oggStream: ReadStream, filenameBase = 'undefined'): Promise<void> {
    const start = new Date();
    const filename = path.normalize(`${appRootPath.path}/recordings/${Date.now()}-${filenameBase}.ogg`);
    console.log(filename);

    try {
      const childProcess = await this.spawnIfNeed(filenameBase);
      await this.writeOgg(oggStream, filename);

      const message = await this.transcriptByFasterWhisper(filename, childProcess);

      console.log(`whisper: ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
      this.client.onMessage(message);
    } catch (e) {
      // nothing to do.
    } finally {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setTimeout(() => {
        rm(filename, (e) => {
          e && console.log(e)
        });
      }, 1000);
    }
  }
}
