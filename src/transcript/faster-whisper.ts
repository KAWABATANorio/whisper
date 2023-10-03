import { ReadStream, createWriteStream } from 'node:fs';
import * as dotenv from 'dotenv';
import { Transcripter } from './transcripter';
import { spawn, ChildProcessWithoutNullStreams } from 'node:child_process';
import * as path from 'node:path';

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

    process.env.PYTHONIOENCODING = 'utf-8';
    const command = path.normalize('C:\\Users\\moba\\.pyenv\\pyenv-win\\versions\\3.11.5\\python.exe');
    // const command = path.normalize('/usr/bin/python3');
    const param = path.normalize('./../whisperpy/main.py');
    const p0 = { key, process: spawn(command, ['-u', param]) };
    FasterWhisper.processMap.push(p0);
    return new Promise((resolve, reject) => {
      p0.process
        .on('spawn', () => {
          console.log(`spawned python ${p0.key}`);
          resolve(p0.process);
        })
        .on('close', code => {
          console.log(`Pythonプロセスが終了しました。終了コード: ${code}`);
          FasterWhisper.processMap = FasterWhisper.processMap.filter(e => e.key !== key);
        })
        .stderr.on('data', err => {
          console.log(`Pythonプロセスが終了しました。終了コード: ${err}`);
          reject(err);
        });
    });
  }

  public async transcript(oggStream: ReadStream, filenameBase = 'undefined'): Promise<void> {
    const start = new Date();

    const message = await (() => new Promise<string>(async (resolve, reject) => {
      const filename = `./recordings/${Date.now()}-${filenameBase}.ogg`;
      console.log(filename);
      const childProcess = await this.spawnIfNeed(filenameBase);

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

      await ((): Promise<void> => new Promise(resolve0 =>
        oggStream
        .pipe(createWriteStream(filename)
          .on('close', resolve0), { end: true })
      ))();

      childProcess.stdin.write(filename + "\n");

    }))();

    console.log(`whisper: ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
    this.client.onMessage(message);
  }
}
