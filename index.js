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
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const xp = new Map();
const submissions = [];

const commands = [
  new SlashCommandBuilder().setName("help").setDescription("Show all commands"),

  new SlashCommandBuilder().setName("ask").setDescription("Ask Digital School AI")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("python").setDescription("Ask Python AI")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("html").setDescription("Ask HTML AI")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("css").setDescription("Ask CSS AI")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("javascript").setDescription("Ask JavaScript AI")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("code-review").setDescription("AI reviews your code")
    .addStringOption(o => o.setName("code").setDescription("Paste code").setRequired(true)),

  new SlashCommandBuilder().setName("roadmap").setDescription("Get learning roadmap")
    .addStringOption(o => o.setName("topic").setDescription("Topic").setRequired(true)),

  new SlashCommandBuilder().setName("challenge").setDescription("Get coding challenge")
    .addStringOption(o => o.setName("topic").setDescription("Topic").setRequired(true)),

  new SlashCommandBuilder().setName("quiz").setDescription("Get quiz question")
    .addStringOption(o => o.setName("topic").setDescription("Topic").setRequired(true)),

  new SlashCommandBuilder().setName("resources").setDescription("Show programming resources"),
  new SlashCommandBuilder().setName("classinfo").setDescription("Show class info"),
  new SlashCommandBuilder().setName("rank").setDescription("Show your XP"),
  new SlashCommandBuilder().setName("leaderboard").setDescription("Show XP leaderboard"),
  new SlashCommandBuilder().setName("verify").setDescription("Verify as Student"),

  new SlashCommandBuilder().setName("submit").setDescription("Submit homework")
    .addStringOption(o => o.setName("homework").setDescription("Homework name").setRequired(true))
    .addStringOption(o => o.setName("link").setDescription("GitHub/file link").setRequired(true)),

  new SlashCommandBuilder().setName("homework").setDescription("Post homework")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName("title").setDescription("Title").setRequired(true))
    .addStringOption(o => o.setName("task").setDescription("Task").setRequired(true))
    .addStringOption(o => o.setName("deadline").setDescription("Deadline")),

  new SlashCommandBuilder().setName("announce").setDescription("Send announcement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o => o.setName("message").setDescription("Message").setRequired(true)),

  new SlashCommandBuilder().setName("ticket").setDescription("Open help ticket"),

  new SlashCommandBuilder().setName("close").setDescription("Close current ticket")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName("clear").setDescription("Delete messages")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption(o => o.setName("amount").setDescription("1-100").setRequired(true)),

  new SlashCommandBuilder().setName("warn").setDescription("Warn a student")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("Student").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true)),

  new SlashCommandBuilder().setName("kick").setDescription("Kick a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder().setName("ban").setDescription("Ban a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder().setName("timeout").setDescription("Timeout a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addIntegerOption(o => o.setName("minutes").setDescription("Minutes").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason")),

  new SlashCommandBuilder().setName("lock").setDescription("Lock current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName("unlock").setDescription("Unlock current channel")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  new SlashCommandBuilder().setName("slowmode").setDescription("Set slowmode")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption(o => o.setName("seconds").setDescription("Seconds").setRequired(true)),

  new SlashCommandBuilder().setName("poll").setDescription("Create a poll")
    .addStringOption(o => o.setName("question").setDescription("Question").setRequired(true)),

  new SlashCommandBuilder().setName("suggest").setDescription("Send a suggestion")
    .addStringOption(o => o.setName("idea").setDescription("Idea").setRequired(true)),

  new SlashCommandBuilder().setName("report").setDescription("Report a user")
    .addUserOption(o => o.setName("user").setDescription("User").setRequired(true))
    .addStringOption(o => o.setName("reason").setDescription("Reason").setRequired(true))
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
            content: "You are Digital School AI. Help students with programming, HTML, CSS, JavaScript, Python, Linux, GitHub, AI, homework, and projects. Keep answers short and clear."
          },
          { role: "user", content: prompt }
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
    Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
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
          "**AI:** `/ask`, `/python`, `/html`, `/css`, `/javascript`, `/code-review`, `/roadmap`, `/challenge`, `/quiz`\n" +
          "**School:** `/resources`, `/classinfo`, `/homework`, `/announce`, `/submit`\n" +
          "**Student:** `/rank`, `/leaderboard`, `/verify`\n" +
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

    if (["python", "html", "css", "javascript"].includes(cmd)) {
      await interaction.deferReply();
      const q = interaction.options.getString("question");
      const answer = await askAI(`Explain this ${cmd} question: ${q}`);
      return interaction.editReply(answer.slice(0, 1900));
    }

    if (cmd === "code-review") {
      await interaction.deferReply();
      const code = interaction.options.getString("code");
      const answer = await askAI(`Review this code and explain problems:\n\n${code}`);
      return interaction.editReply(answer.slice(0, 1900));
    }

    if (cmd === "roadmap") {
      await interaction.deferReply();
      const topic = interaction.options.getString("topic");
      const answer = await askAI(`Make a beginner roadmap for ${topic}.`);
      return interaction.editReply(answer.slice(0, 1900));
    }

    if (cmd === "challenge") {
      await interaction.deferReply();
      const topic = interaction.options.getString("topic");
      const answer = await askAI(`Give one beginner coding challenge for ${topic}.`);
      return interaction.editReply(answer.slice(0, 1900));
    }

    if (cmd === "quiz") {
      await interaction.deferReply();
      const topic = interaction.options.getString("topic");
      const answer = await askAI(`Give one quiz question about ${topic} with the answer.`);
      return interaction.editReply(answer.slice(0, 1900));
    }

    if (cmd === "resources") {
      return interaction.reply(
        "**Programming Resources**\n" +
        "HTML: https://developer.mozilla.org/en-US/docs/Web/HTML\n" +
        "CSS: https://developer.mozilla.org/en-US/docs/Web/CSS\n" +
        "JavaScript: https://developer.mozilla.org/en-US/docs/Web/JavaScript\n" +
        "Python: https://docs.python.org/3/\n" +
        "GitHub: https://github.com\n" +
        "Linux: https://linuxjourney.com/"
      );
    }

    if (cmd === "classinfo") {
      const embed = new EmbedBuilder()
        .setTitle("Digital School Class Info")
        .setDescription("Programming, web development, Python, AI, and projects.")
        .addFields(
          { name: "Topics", value: "HTML, CSS, JavaScript, Python, GitHub, Linux, AI" },
          { name: "Rules", value: "Be respectful. No spam. Ask questions. Submit homework on time." }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (cmd === "rank") {
      const userXp = xp.get(interaction.user.id) || 0;
      return interaction.reply(`${interaction.user} has **${userXp} XP**.`);
    }

    if (cmd === "leaderboard") {
      const top = [...xp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
      if (top.length === 0) return interaction.reply("No XP yet.");

      const text = top.map((x, i) => `${i + 1}. <@${x[0]}> — ${x[1]} XP`).join("\n");
      return interaction.reply(`🏆 **Leaderboard**\n${text}`);
    }

    if (cmd === "submit") {
      const homework = interaction.options.getString("homework");
      const link = interaction.options.getString("link");

      submissions.push({ user: interaction.user.tag, homework, link });
      xp.set(interaction.user.id, (xp.get(interaction.user.id) || 0) + 25);

      return interaction.reply(`✅ Homework submitted!\n**Homework:** ${homework}\n**Link:** ${link}\n+25 XP`);
    }

    if (cmd === "verify") {
      const role = interaction.guild.roles.cache.find(r => r.name === "Student");
      if (!role) return interaction.reply({ content: "Create a role named `Student` first.", ephemeral: true });

      await interaction.member.roles.add(role);
      return interaction.reply({ content: "✅ You are now verified as Student.", ephemeral: true });
    }

    if (cmd === "homework") {
      const title = interaction.options.getString("title");
      const task = interaction.options.getString("task");
      const deadline = interaction.options.getString("deadline") || "No deadline";

      const embed = new EmbedBuilder()
        .setTitle(`📚 Homework: ${title}`)
        .setDescription(task)
        .addFields({ name: "Deadline", value: deadline })
        .setFooter({ text: `Posted by ${interaction.user.username}` });

      return interaction.reply({ embeds: [embed] });
    }

    if (cmd === "announce") {
      const msg = interaction.options.getString("message");
      return interaction.reply(`📢 **Digital School Announcement**\n${msg}`);
    }

    if (cmd === "ticket") {
      const channel = await interaction.guild.channels.create({
        name: `help-${interaction.user.username}`,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] }
        ]
      });

      await channel.send(`Hello ${interaction.user}, explain your problem here.`);
      return interaction.reply({ content: `Ticket created: ${channel}`, ephemeral: true });
    }

    if (cmd === "close") {
      if (!interaction.channel.name.startsWith("help-")) {
        return interaction.reply({ content: "This is not a ticket channel.", ephemeral: true });
      }

      await interaction.reply("Closing ticket...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
      return;
    }

    if (cmd === "clear") {
      const amount = interaction.options.getInteger("amount");
      if (amount < 1 || amount > 100) return interaction.reply({ content: "Choose 1-100.", ephemeral: true });

      await interaction.channel.bulkDelete(amount, true);
      return interaction.reply({ content: `Deleted ${amount} messages.`, ephemeral: true });
    }

    if (cmd === "warn") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");
      return interaction.reply(`⚠️ ${user} has been warned.\nReason: ${reason}`);
    }

    if (cmd === "kick") {
      const member = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") || "No reason";
      if (!member) return interaction.reply({ content: "User not found.", ephemeral: true });

      await member.kick(reason);
      return interaction.reply(`👢 ${member.user.tag} was kicked. Reason: ${reason}`);
    }

    if (cmd === "ban") {
      const member = interaction.options.getMember("user");
      const reason = interaction.options.getString("reason") || "No reason";
      if (!member) return interaction.reply({ content: "User not found.", ephemeral: true });

      await member.ban({ reason });
      return interaction.reply(`🔨 ${member.user.tag} was banned. Reason: ${reason}`);
    }

    if (cmd === "timeout") {
      const member = interaction.options.getMember("user");
      const minutes = interaction.options.getInteger("minutes");
      const reason = interaction.options.getString("reason") || "No reason";
      if (!member) return interaction.reply({ content: "User not found.", ephemeral: true });

      await member.timeout(minutes * 60 * 1000, reason);
      return interaction.reply(`⏱️ ${member.user.tag} timed out for ${minutes} minutes.`);
    }

    if (cmd === "lock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });
      return interaction.reply("🔒 Channel locked.");
    }

    if (cmd === "unlock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
      return interaction.reply("🔓 Channel unlocked.");
    }

    if (cmd === "slowmode") {
      const seconds = interaction.options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);
      return interaction.reply(`🐢 Slowmode set to ${seconds} seconds.`);
    }

    if (cmd === "poll") {
      const question = interaction.options.getString("question");
      const msg = await interaction.reply({ content: `📊 **Poll**\n${question}`, fetchReply: true });
      await msg.react("👍");
      await msg.react("👎");
      return;
    }

    if (cmd === "suggest") {
      const idea = interaction.options.getString("idea");
      const msg = await interaction.reply({ content: `💡 **Suggestion from ${interaction.user}**\n${idea}`, fetchReply: true });
      await msg.react("✅");
      await msg.react("❌");
      return;
    }

    if (cmd === "report") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");

      return interaction.reply({
        content: `🚨 Report submitted.\nUser: ${user}\nReason: ${reason}`,
        ephemeral: true
      });
    }
  } catch (err) {
    console.error(err);

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply("Something went wrong.");
    }

    return interaction.reply({ content: "Something went wrong.", ephemeral: true });
  }
});

client.login(process.env.TOKEN);
