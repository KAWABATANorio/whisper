import { ReadStream } from 'node:fs';
import speech, { protos } from '@google-cloud/speech';
import { Transcripter } from './transcripter';
import s = protos.google.cloud.speech.v1;

const client = new speech.SpeechClient({
  keyFilename: 'config/google-api-key.json'
});

export class SpeechToText extends Transcripter {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public transcript(oggStream: ReadStream, _filenameBase = 'undefined'): Promise<void> {
    const start = new Date();

    const config: s.IStreamingRecognitionConfig = {
      config: {
        encoding: s.RecognitionConfig.AudioEncoding.OGG_OPUS,
        sampleRateHertz: 48000,
        audioChannelCount: 2,
        languageCode: 'ja_JP',
      },
    };

    return new Promise<void>((resolve, reject) => {
      const stream = client.streamingRecognize(config);
      oggStream.pipe(stream)
        .on('data', (response: s.IRecognizeResponse) => {
          const text = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .join(' ');
          if (text) {
            this.client.onMessage(text);
          }
          console.log(`speechToText(data): ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
        }).on('error', err => {
          reject(err);
        }).on('end', () => {
          console.log(`speechToText(end): ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
          resolve();
        });
    });
  }
}
