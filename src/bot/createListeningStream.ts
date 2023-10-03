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
        duration: 100,
      },
    });

    const oggStream = new prism.opus.OggLogicalBitstream({
      opusHead: new prism.opus.OpusHead({
        channelCount: 1,
        sampleRate: 24000,
      }),
      pageSizeControl: {
        maxPackets: 10,
      },
    });

    botEvent.emit('message', opusStream.pipe(oggStream), userId, user);
    // botEvent.emit('message', opusStream, userId, user);
  } catch (e) {
    // nothing to do.
  }
}
