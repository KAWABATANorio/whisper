import { createReadStream } from 'node:fs';
import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from  'openai';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_APIKEY!
});
const openai = new OpenAIApi(configuration);

const whisper = async (inputFile: string): Promise<string> => {
  const start = new Date();
  const resp = await openai.createTranscription(
    createReadStream(inputFile),
    'whisper-1',
    undefined,
    'text',
    0.2,
    'ja'
  );

  console.log(`whisper: ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
  return resp.data as unknown as string;
};

export { whisper }
