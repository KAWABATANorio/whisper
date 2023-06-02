import { entersState, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import type { DiscordGatewayAdapterCreator } from '@discordjs/voice';
import { Client, CommandInteraction, GuildMember } from 'discord.js';
import { createListeningStream } from './createListeningStream';

async function join(
  interaction: CommandInteraction,
  client: Client,
  connection?: VoiceConnection,
) {
  await interaction.deferReply({ ephemeral: true });
  if (!connection) {
    if (interaction.member instanceof GuildMember && interaction.member.voice.channel) {
      const channel = interaction.member.voice.channel;
      connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        selfDeaf: false,
        selfMute: true,
        adapterCreator: channel.guild.voiceAdapterCreator as any as DiscordGatewayAdapterCreator,
      });
    } else {
      await interaction.followUp('Join a voice channel and then try that again!');
      return;
    }
  }

  client.users.cache.forEach((_user, userId) => {
    if (client.application?.id === userId) return;
    const receiver = connection!.receiver;
    createListeningStream(receiver, userId, client.users.cache.get(userId));
  });

  try {
    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    const receiver = connection.receiver;

    receiver.speaking.on('start', (userId) => {
      createListeningStream(receiver, userId, client.users.cache.get(userId));
    });
  } catch (error) {
    console.warn(error);
    await interaction.followUp('Failed to join voice channel within 20 seconds, please try again later!');
  }

  await interaction.followUp('Ready!');
}

async function leave(
  interaction: CommandInteraction,
  _client: Client,
  connection?: VoiceConnection,
) {
  if (connection) {
    connection.destroy();
    await interaction.reply({ ephemeral: true, content: 'Left the channel!' });
  } else {
    await interaction.reply({ ephemeral: true, content: 'Not playing in this server!' });
  }
}

export const interactionHandlers = new Map<
  string,
  (
    interaction: CommandInteraction,
    client: Client,
    connection?: VoiceConnection,
  ) => Promise<void>
>();
interactionHandlers.set('join', join);
interactionHandlers.set('leave', leave);
