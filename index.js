import "dotenv/config";
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder
} from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const resources = [
  "HTML: https://developer.mozilla.org/en-US/docs/Web/HTML",
  "CSS: https://developer.mozilla.org/en-US/docs/Web/CSS",
  "JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  "GitHub: https://github.com"
];

const commands = [
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Show Digital School bot commands"),

  new SlashCommandBuilder()
    .setName("resources")
    .setDescription("Show programming learning resources"),

  new SlashCommandBuilder()
    .setName("classinfo")
    .setDescription("Show Digital School class info"),

  new SlashCommandBuilder()
    .setName("homework")
    .setDescription("Post homework")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("title").setDescription("Homework title").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("task").setDescription("Homework task").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("deadline").setDescription("Deadline").setRequired(false)
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send an announcement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("message").setDescription("Announcement text").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open a help ticket"),

  new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Delete messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o =>
      o.setName("amount").setDescription("1-100").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a student")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("Student").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(true)
    )
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
    { body: commands }
  );

  console.log("Digital School commands loaded.");
});

client.on("guildMemberAdd", async member => {
  const channel = member.guild.systemChannel;
  if (!channel) return;

  channel.send(`Welcome ${member} to Digital School! Check the rules and resources.`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "help") {
    return interaction.reply({
      ephemeral: true,
      content:
        "**Digital School Bot Commands**\n" +
        "`/resources` - programming links\n" +
        "`/classinfo` - class info\n" +
        "`/homework` - post homework\n" +
        "`/announce` - announcement\n" +
        "`/ticket` - ask for help\n" +
        "`/warn` - warn user\n" +
        "`/clear` - delete messages"
    });
  }

  if (interaction.commandName === "resources") {
    return interaction.reply(resources.join("\n"));
  }

  if (interaction.commandName === "classinfo") {
    const embed = new EmbedBuilder()
      .setTitle("Digital School Class Info")
      .setDescription("Welcome to Digital School programming class.")
      .addFields(
        { name: "Topics", value: "HTML, CSS, JavaScript, Python, Projects" },
        { name: "Rules", value: "Be respectful, ask questions, submit homework on time." }
      );

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "homework") {
    const title = interaction.options.getString("title");
    const task = interaction.options.getString("task");
    const deadline = interaction.options.getString("deadline") || "No deadline";

    const embed = new EmbedBuilder()
      .setTitle(`Homework: ${title}`)
      .setDescription(task)
      .addFields({ name: "Deadline", value: deadline })
      .setFooter({ text: `Posted by ${interaction.user.username}` });

    return interaction.reply({ embeds: [embed] });
  }

  if (interaction.commandName === "announce") {
    const message = interaction.options.getString("message");

    return interaction.reply({
      content: `📢 **Digital School Announcement**\n${message}`
    });
  }

  if (interaction.commandName === "ticket") {
    const channel = await interaction.guild.channels.create({
      name: `help-${interaction.user.username}`,
      type: ChannelType.GuildText,
      permissionOverwrites: [
        {
          id: interaction.guild.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages
          ]
        }
      ]
    });

    await channel.send(`Hello ${interaction.user}, explain your problem here.`);

    return interaction.reply({
      content: `Ticket created: ${channel}`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "clear") {
    const amount = interaction.options.getInteger("amount");

    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: "Choose a number from 1 to 100.",
        ephemeral: true
      });
    }

    await interaction.channel.bulkDelete(amount, true);

    return interaction.reply({
      content: `Deleted ${amount} messages.`,
      ephemeral: true
    });
  }

  if (interaction.commandName === "warn") {
    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason");

    return interaction.reply(
      `${user} has been warned.\nReason: ${reason}`
    );
  }
});

client.login(process.env.TOKEN);
