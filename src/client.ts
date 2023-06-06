import type { User } from 'discord.js';
import { Server } from 'socket.io';
import { ITranscriptClient } from './transcript';
import ignoreWords from '../config/ignore-words.json';

export class Client implements ITranscriptClient {
  public constructor(
    private readonly user: User | undefined,
    private readonly io: Server
  ) {}

  private static readonly history = new Map<string, { text: string, at: number }>();

  private filter(user: User | undefined, text: string): boolean {
    if (text.length === 0) {
      return false;
    }
    if (ignoreWords.includes(text)) {
      console.log(`ignore message. ${text}`);
      return false;
    }
    if (user) {
      // ignore duplicate message.
      const h = Client.history.get(user.id);
      if (h?.text === text && h.at > Date.now() - 3000) {
        console.log(`ignore duplicate message. ${text}`);
        return false;
      } 
      Client.history.set(user.id, { text, at: Date.now() });
    }
    return true;
  }
  
  public onMessage(message: string): void {
    message = message.replace(/\n/g, ' ').trim();
    if (this.filter(this.user, message)) {
      console.log(`${this.user?.username ?? ''}: ${message}`);
      this.io.emit('message', {
        username: this.user?.username,
        avatar: this.user?.avatarURL(),
        color: this.user?.hexAccentColor,
        message,
      });
    }
  }
}
