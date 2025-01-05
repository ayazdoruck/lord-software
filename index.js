const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const moment = require('moment');

const token = 'BOT-TOKEN';
const clientId = 'BOT-CLİENT-ID';
const guildId = 'GUILD-ID';
const allowedRoleId = 'BOT-KULLANABILECEK-ROL';
const logChannelId = 'LOG-KANAL-ID';

const roleToAssign = 'CUSTOMER-ROLE-ID';
const roleToRemove = 'CUSTOMER-ROLE-ID';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

const dataFile = './customers.json';

function loadData() {
  try {
    const rawData = fs.readFileSync(dataFile, 'utf8');
    return JSON.parse(rawData);
  } catch (err) {
    return [];
  }
}

function saveData(data) {
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2), 'utf8');
}

client.once('ready', () => {
  console.log('Lord Software Bot Çalışıyor!');
  checkMemberships();
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (!interaction.member.roles.cache.has(allowedRoleId)) {
    return interaction.reply({
      content: 'Bu komutu kullanmaya yetkiniz yok!',
      ephemeral: true,
    });
  }

  const { commandName } = interaction;

  if (commandName === 'uyelik_ekle') {
    const uyeKey = interaction.options.getString('uye_key');
    const sure = interaction.options.getInteger('sure');
    const discordId = interaction.options.getUser('kullanici_id').id;

    const expirationTime = moment().add(sure, 'minutes').toISOString();

    const data = loadData();
    data.push({ uyeKey, sure, discordId, expirationTime });
    saveData(data);

    const guild = await client.guilds.fetch(guildId);
    const member = await guild.members.fetch(discordId);
    await member.roles.add(roleToAssign);

    const user = await client.users.fetch(discordId);
    const dmEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Lord Software Üyelik Bilgisi')
      .setDescription(`Üyeliğiniz başarıyla eklendi!\n\n**Üye Anahtarı:** ${uyeKey}\n**Süre:** ${sure} dakika\n**Üyelik Bitiş Zamanı:** ${moment(expirationTime).format('YYYY-MM-DD HH:mm:ss')}`)
      .setTimestamp()
      .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

    try {
      await user.send({ embeds: [dmEmbed] });
    } catch (err) {
      console.error(`Kullanıcıya DM gönderilemedi: ${discordId}`, err);
    }

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Lord Software')
      .setDescription(`Üyelik başarılı!\nÜye Anahtarı: ${uyeKey}\nSüre: ${sure} dakika\nKullanıcı ID'si: <@${discordId}>`)
      .setTimestamp()
      .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

    interaction.reply({ embeds: [embed] });

    const logChannel = await client.channels.fetch(logChannelId);
    const logEmbed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Yeni Üyelik Eklendi')
      .setDescription(`Üye Anahtarı: ${uyeKey}\nSüre: ${sure} dakika\nKullanıcı ID'si: <@${discordId}>`)
      .setTimestamp()
      .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

    logChannel.send({ embeds: [logEmbed] });
  }

  if (commandName === 'uyelik_listele') {
    const data = loadData();

    if (data.length === 0) {
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Lord Software')
        .setDescription('Üye Bulunmamaktadır.')
        .setTimestamp()
        .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

      interaction.reply({ embeds: [embed] });
      return;
    }

    let memberList = '';
    data.forEach((member, index) => {
      const expiration = moment(member.expirationTime).format('YYYY-MM-DD HH:mm:ss');
      memberList += `${index + 1}. ÜyeKey: ${member.uyeKey}, Süre: ${member.sure} dakika, Bitiş Zamanı: ${expiration}, Kullanıcı ID: <@${member.discordId}>\n`;
    });

    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('Lord Software')
      .setDescription(`**Tüm Üyelikler:**\n${memberList}`)
      .setTimestamp()
      .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

    interaction.reply({ embeds: [embed] });
  }
});

async function checkMemberships() {
  const data = loadData();
  const now = moment();

  data.forEach(async (member, index) => {
    const expirationTime = moment(member.expirationTime);
    if (now.isAfter(expirationTime)) {
      const user = await client.users.fetch(member.discordId);
      const embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Lord Software')
        .setDescription(`Lord Software Üyeliğinizin süresi bitmiştir.\nÜye Anahtarı: ${member.uyeKey}`)
        .setTimestamp()
        .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

      try {
        await user.send({ embeds: [embed] });
      } catch (err) {
        console.error(`Kullanıcıya mesaj gönderilemedi: ${member.discordId}`, err);
      }

      const guild = await client.guilds.fetch(guildId);
      const memberToRemoveRole = await guild.members.fetch(member.discordId);
      await memberToRemoveRole.roles.remove(roleToRemove);

      data.splice(index, 1);
      saveData(data);

      const logChannel = await client.channels.fetch(logChannelId);
      const logEmbed = new EmbedBuilder()
        .setColor('#FF0000')
        .setTitle('Üyelik Süresi Bitti')
        .setDescription(`Üye Anahtarı: ${member.uyeKey}\nKullanıcı ID'si: <@${member.discordId}>`)
        .setTimestamp()
        .setFooter({ text: 'Lord Software', iconURL: 'https://raw.githubusercontent.com/ayazdoruck/lord-software/refs/heads/main/logo.png' });

      logChannel.send({ embeds: [logEmbed] });
    }
  });

  setTimeout(checkMemberships, 10000);
}

client.login(token);
