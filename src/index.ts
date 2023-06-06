import http from 'http';
import { ReadStream } from 'node:fs';
import path from 'node:path';
import type { User } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import { client, botEvent } from './bot';
import { Client } from './client';
import { transcripterFactory } from './transcript';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.get('/', (_req, res) => {
  res.sendFile(path.resolve('./src/index.html'));
});
server.listen(3000);

void client.login(process.env.DISCORD_APP_TOKEN);

botEvent.on('message', (inputStream: ReadStream, userId: string, user: User | undefined) => {
  (async () => {
    if (user && !user.hexAccentColor) {
      user = await client.users.fetch(user, { force: true });
    }

    const filenameBase = user ? `${user.username}_${user.discriminator}` : userId;
    try {
      const transcripter = transcripterFactory(new Client(user, io));
      await transcripter.transcript(inputStream, filenameBase);
    } catch (e) {
      console.error(`❌ Failed transcript ${filenameBase} ${(e as Error).message}`);
    }
  })();
});