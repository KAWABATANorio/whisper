import { createWriteStream, rm } from 'node:fs';
import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import type { User } from 'discord.js';
import ffmpeg from 'fluent-ffmpeg';
import * as prism from 'prism-media';
import { botEvent } from './event';

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}

export function createListeningStream(receiver: VoiceReceiver, userId: string, user?: User) {
  const filename = `./recordings/${Date.now()}-${getDisplayName(userId, user)}.webm`;
  console.log(`👂 Started recording ${filename}`);

  try {
    const opusStream = receiver.subscribe(userId, {
      end: {
        behavior: EndBehaviorType.AfterInactivity,
        duration: 300,
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

    const out = createWriteStream(filename);
    const start = new Date();

    ffmpeg()
      .input(opusStream.pipe(oggStream))
      .inputFormat('ogg')
      .audioCodec('libopus')
      .audioChannels(2)
      .outputFormat('webm')
      .on('error', (e: Error) => {
        throw e;
      })
      .on('end', () => {
        console.log(`✅ Recorded ${filename}, ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);

        const done = () => {
          // eslint-disable-next-line @typescript-eslint/no-empty-function
          rm(filename, () => { });
        };
        botEvent.emit('message', filename, user, done);
      })
      .pipe(out, { end: true });
  } catch (e) {
    console.warn(`❌ Error recording file ${filename} - ${(e as Error).message}`);
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    rm(filename, () => { });
  }
}
