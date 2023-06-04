import http from 'http';
import type { User } from 'discord.js';
import * as dotenv from 'dotenv';
import express from 'express';
import { Server } from 'socket.io';
import { client, botEvent } from './bot';
import { whisper } from './whisper';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.get('/', (_req, res) => {
  res.sendFile(`${__dirname}/index.html`);
});
server.listen(3000);

void client.login(process.env.DISCORD_APP_TOKEN);

botEvent.on('message', (filename: string, user: User | undefined, done: () => void) => {
  (async () => {
    try {
      if (user && !user.hexAccentColor) {
        user = await client.users.fetch(user, { force: true });
      }
      const text = (await whisper(filename)).replace(/\n/g, ' ').trim();
      if (text.length > 0) {
        console.log(`${user?.username ?? ''}: ${text}`);
        io.emit('message', {
          username: user?.username,
          avatar: user?.avatarURL(),
          color: user?.hexAccentColor,
          message: text,
        });
      }
    } catch (e) {
      console.error(filename, `❌ Failed transcript filename ${(e as Error).message}`);
    }
    done();
  })();
});