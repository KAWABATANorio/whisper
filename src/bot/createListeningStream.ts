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
  const opusStream = receiver.subscribe(userId, {
    end: {
      behavior: EndBehaviorType.AfterSilence,
      duration: 1000,
    },
  });

  const oggStream = new prism.opus.OggLogicalBitstream({
    opusHead: new prism.opus.OpusHead({
      channelCount: 1,
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
    .audioCodec('libopus')
    .audioChannels(1)
    .outputFormat('webm')
    .on('error', (err: Error) => {
      console.warn(`❌ Error recording file ${filename} - ${err.message}`);
    })
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    .on('end', () => {
      console.log(`✅ Recorded ${filename}, ${(new Date().getTime() - start.getTime()).toLocaleString()} ms`);

      const done = () => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        rm(filename, () => {});
      };
      botEvent.emit('message', filename, user, done);
    })
    .pipe(out, { end: true });
}
