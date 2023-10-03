import { getVoiceConnection } from '@discordjs/voice';
import { Interaction, Client, Events, GatewayIntentBits } from 'discord.js';
import { deploy } from './deploy';
import { botEvent } from './event'
import { interactionHandlers } from './interactions';

const client = new Client({
  intents: [GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent], 
});

client.once(Events.ClientReady, () => {
  console.log('Ready!');

  client.application?.commands.create
});

client.on(Events.MessageCreate, async (message) => {
  if (!message.guild) return;
  if (!client.application?.owner) await client.application?.fetch();

  if (message.content.toLowerCase() === '!deploy' && message.author.id === client.application?.owner?.id) {
    await deploy(message.guild);
    await message.reply('Deployed!');
  }
});

client.on(Events.InteractionCreate, async (interaction: Interaction) => {
  if (!interaction.isCommand() || !interaction.guildId) return;

  const handler = interactionHandlers.get(interaction.commandName);

  try {
    if (handler) {
      await handler(interaction, client, getVoiceConnection(interaction.guildId));
    } else {
      await interaction.reply('Unknown command');
    }
  } catch (error) {
    console.warn(error);
  }
});

client.on(Events.Error, console.warn);

export { client, botEvent };
