const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

client.once('ready', () => {
  console.log(`${client.user.tag} olarak giriş yapıldı.`);
  client.user.setPresence({
    activities: [{ name: 'pahiy.site', type: ActivityType.Watching }],
    status: 'online',
  });
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'site') {
    await interaction.reply({
      content: '🔗 [Siteye Gitmek İçin Tıkla](https://pahiy.site)',
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);