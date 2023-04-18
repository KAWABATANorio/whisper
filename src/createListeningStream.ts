import { createReadStream, createWriteStream, rm } from 'node:fs';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import type { User } from 'discord.js';
import * as dotenv from 'dotenv';
import ffmpeg from 'fluent-ffmpeg';
import { Configuration, OpenAIApi } from  'openai';
import * as prism from 'prism-media';

dotenv.config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_APIKEY!
});
const openai = new OpenAIApi(configuration);

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}

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
}

export function createListeningStream(receiver: VoiceReceiver, userId: string, user?: User) {
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1000,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 2,
      sampleRate: 48000,
    }),
    pageSizeControl: {
      maxPackets: 10,
    },
  });

  const filename = `./recordings/${Date.now()}-${getDisplayName(userId, user)}.webm`;

  const out = createWriteStream(filename);

  console.log(`👂 Started recording ${filename}`);
  const start = new Date();

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  ffmpeg()
    .input(opusStream.pipe(oggStream))
    .inputFormat('ogg')
    .outputFormat('webm')
    .on('error', (err: Error) => {
      console.warn(`❌ Error recording file ${filename} - ${err.message}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on('end', () => {
      console.log(`✅ Recorded ${filename}, ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);
      (async () => {
        try {
          const text = await whisper(filename);
          console.log(`result: ${text}`);
        } catch (err) {
          console.warn(`❌ Error recording file ${filename} - ${(err as Error).message}`);
        }
      })();

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      rm(filename, () => {});
    })
    .pipe(out, { end: true });
}
