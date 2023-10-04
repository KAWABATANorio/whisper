import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import { ReadStream, createWriteStream, rm } from 'node:fs';
import * as path from 'node:path';
import appRootPath from 'app-root-path';
import * as dotenv from 'dotenv';
import { Transcripter } from './transcripter';

dotenv.config();

export class FasterWhisper extends Transcripter {

  private static processMap: Array<{
    key: string,
    process: ChildProcessWithoutNullStreams | undefined
  }> = [];

  private async spawnIfNeed(key: string): Promise<ChildProcessWithoutNullStreams> {
    const p = FasterWhisper.processMap.find(e => e.key === key);
    if (p?.process) {
      return p.process;
    }

    const command = path.normalize(process.env.PYTHON_EXECUTABLE!);
    const param = path.normalize(`${__dirname}/transcript_faster_whisper.py`);
    const p0 = { key, process: spawn(command, ['-u', param]) };
    FasterWhisper.processMap.push(p0);
    return new Promise((resolve, reject) => {
      p0.process
        .on('spawn', () => {
          console.log(`spawned python ${p0.key}`);
          resolve(p0.process);
        })
        .on('close', () => {
          FasterWhisper.processMap = FasterWhisper.processMap.filter(e => e.key !== key);
        })
        .stderr.on('data', err => {
          reject(err);
        });
    });
  }

  private transcriptByFasterWhisper(filename: string, childProcess: ChildProcessWithoutNullStreams): Promise<string> {
    return new Promise((resolve, reject) => {
      const removeListner = (p: ChildProcessWithoutNullStreams) => {
        p.stderr.removeListener('data', receiveError);
        p.stdout.removeListener('data', receiveData);
      }

      const receiveError = (data: string) => {
        console.log(`Pythonからの出力: ${data}`);
        removeListner(childProcess);
        reject(data);
      };
      const receiveData = (data: string) => {
        console.log(`Pythonからの出力: ${data}`);
        const r = data.toString().split('[result]');
        if (r.length > 0) {
          removeListner(childProcess);
          resolve(r[1]!);
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
        .on('close', resolve0), { end: true })
    );
  }

  public async transcript(oggStream: ReadStream, filenameBase = 'undefined'): Promise<void> {
    const start = new Date();
    const filename = `${appRootPath.path}/recordings/${Date.now()}-${filenameBase}.ogg`;
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
      rm(filename, () => {});
    }
  }
}
