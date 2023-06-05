import { EndBehaviorType, VoiceReceiver } from '@discordjs/voice';
import type { User } from 'discord.js';
import * as prism from 'prism-media';
import { botEvent } from './event';

export function createListeningStream(receiver: VoiceReceiver, userId: string, user?: User) {
  console.log(`👂 Started recording ${user ? `${user.username}_${user.discriminator}` : userId}`);

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

    botEvent.emit('message', opusStream.pipe(oggStream), userId, user);
  } catch (e) {
    // nothing to do.
  }
}
