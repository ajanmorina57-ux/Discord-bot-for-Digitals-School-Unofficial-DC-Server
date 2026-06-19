import "dotenv/config";
import http from "http";
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

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Digital School Bot is running");
}).listen(process.env.PORT || 3000);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Show all commands"),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask Digital School AI")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("code-review")
    .setDescription("AI reviews your code")
    .addStringOption(o =>
      o.setName("code")
        .setDescription("Paste code")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("roadmap")
    .setDescription("Get learning roadmap")
    .addStringOption(o =>
      o.setName("topic")
        .setDescription("frontend, python, ai, linux")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("Get coding challenge")
    .addStringOption(o =>
      o.setName("topic")
        .setDescription("html, css, js, python")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("quiz")
    .setDescription("Get quiz question")
    .addStringOption(o =>
      o.setName("topic")
        .setDescription("Topic")
        .setRequired(true)
    ),
    new SlashCommandBuilder()
    .setName("resources")
    .setDescription("Show programming resources"),

  new SlashCommandBuilder()
    .setName("classinfo")
    .setDescription("Show class info"),

  new SlashCommandBuilder()
    .setName("homework")
    .setDescription("Post homework")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("title").setDescription("Title").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("task").setDescription("Task").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("deadline").setDescription("Deadline")
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send announcement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("message").setDescription("Message").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Open help ticket"),

  new SlashCommandBuilder()
    .setName("close")
    .setDescription("Close current ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

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
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason")
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason")
    ),
    new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes").setDescription("Minutes").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason")
    ),

  new SlashCommandBuilder()
    .setName("lock")
    .setDescription("Lock current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("unlock")
    .setDescription("Unlock current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder()
    .setName("slowmode")
    .setDescription("Set slowmode")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o =>
      o.setName("seconds").setDescription("Seconds").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll")
    .addStringOption(o =>
      o.setName("question").setDescription("Poll question").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Send a suggestion")
    .addStringOption(o =>
      o.setName("idea").setDescription("Your idea").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user")
    .addUserOption(o =>
      o.setName("user").setDescription("User").setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason").setDescription("Reason").setRequired(true)
    )
].map(c => c.toJSON());

async function askAI(prompt) {
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content:
              "You are Digital School AI. Help students with programming, HTML, CSS, JavaScript, Python, Linux, GitHub, AI, homework, and projects. Keep answers short and clear."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("GROQ ERROR:", data);
      return "AI service error. Check Render logs.";
    }

    return data.choices?.[0]?.message?.content || "No AI response.";
  } catch (err) {
    console.error("AI FETCH ERROR:", err);
    return "AI connection problem. Try again later.";
  }
}
client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    { body: commands }
  );

  console.log("Digital School commands loaded.");
});
client.on("guildMemberAdd", async member => {
  const channel = member.guild.systemChannel;
  if (channel) channel.send(`Welcome ${member} to Digital School!`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  try {
    const cmd = interaction.commandName;

    if (cmd === "help") {
      return interaction.reply({
        ephemeral: true,
        content:
          "**Digital School Bot Commands**\n\n" +
          "**AI:** `/ask`, `/code-review`, `/roadmap`, `/challenge`, `/quiz`\n" +
          "**School:** `/resources`, `/classinfo`, `/homework`, `/announce`\n" +
          "**Support:** `/ticket`, `/close`, `/report`, `/suggest`\n" +
          "**Moderation:** `/warn`, `/kick`, `/ban`, `/timeout`, `/clear`, `/lock`, `/unlock`, `/slowmode`, `/poll`"
      });
    }

    if (cmd === "ask") {
      await interaction.deferReply();
      const q = interaction.options.getString("question");
      const answer = await askAI(q);
      return interaction.editReply(answer.slice(0, 1900));
    }

    return interaction.reply({
      content: "Command not implemented yet.",
      ephemeral: true
    });

  } catch (err) {
    console.error(err);

    if (interaction.deferred) {
      return interaction.editReply("Something went wrong.");
    }

    return interaction.reply({
      content: "Something went wrong.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
