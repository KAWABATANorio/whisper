import { createReadStream } from 'node:fs';
import { Configuration, OpenAIApi } from  'openai';

const configuration = new Configuration({
  apiKey: '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',
});

const openai = new OpenAIApi(configuration);

(async () => {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const resp = await openai.createTranscription(
    createReadStream('recordings/1681808802555-モバきち_6452.mp3'),
    // createReadStream('resources/imposter.mp3'),
    'whisper-1',
    undefined,
    'text',
    0.2,
    'ja'
  );
  console.log(resp.data);
})();
