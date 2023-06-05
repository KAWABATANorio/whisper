import http from 'http';
import { ReadStream, rm } from 'node:fs';
import path from 'node:path';
import type { User } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import { client, botEvent } from './bot';
import { opusStreamToWebm } from './ffmpeg';
import { speechToText } from './transcript/speech-to-text';
import { whisper } from './transcript/whisper';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.get('/', (_req, res) => {
  res.sendFile(path.resolve('./src/index.html'));
});
server.listen(3000);

void client.login(process.env.DISCORD_APP_TOKEN);

function getDisplayName(userId: string, user?: User) {
  return user ? `${user.username}_${user.discriminator}` : userId;
}

function emit(user: User | undefined, text: string) {
  if (text.length > 0) {
    console.log(`${user?.username ?? ''}: ${text}`);
    io.emit('message', {
      username: user?.username,
      avatar: user?.avatarURL(),
      color: user?.hexAccentColor,
      message: text,
    });
  }
}

async function transcriptWithWhisper(inputStream: ReadStream, userId: string, user: User | undefined) {
  const filename = `./recordings/${Date.now()}-${getDisplayName(userId, user)}.webm`;

  try {
    await opusStreamToWebm(inputStream, filename);
    const text = (await whisper(filename)).replace(/\n/g, ' ').trim();
    emit(user, text);
  } catch (e) {
    console.error(filename, `❌ Failed transcript filename ${(e as Error).message}`);
  } finally {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    rm(filename, () => {});
  }
}

async function transcriptWithSpeechToText(inputStream: ReadStream, user: User | undefined) {
  try {
    await speechToText(inputStream, (text: string) => {
      emit(user, text);
    });
  } catch (e) {
    console.error(`❌ Failed transcript ${(e as Error).message}`);
  }
}

enum TranscriptType {
  Whisper,
  SpeechToText,
};

botEvent.on('message', (inputStream: ReadStream, userId: string, user: User | undefined) => {
  (async () => {
    if (user && !user.hexAccentColor) {
      user = await client.users.fetch(user, { force: true });
    }

    const type = TranscriptType.SpeechToText;

    switch (type as TranscriptType) {
    case TranscriptType.Whisper:
      void transcriptWithWhisper(inputStream, userId, user);
      break;
    case TranscriptType.SpeechToText:
      void transcriptWithSpeechToText(inputStream, user);
      break;
    }
  })();
});