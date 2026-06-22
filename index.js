import "dotenv/config";
import http from "http";
import { createClient } from "@supabase/supabase-js";
import {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  PermissionFlagsBits,
  ChannelType,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const matches = new Map();

function getMaxPlayers(mode) {
  return {
    "1v1": 2,
    "2v2": 4,
    "3v3": 6,
    "5v5": 10
  }[mode];
}

async function getXP(userId) {
  const { data, error } = await supabase
    .from("xp")
    .select("amount")
    .eq("user_id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("GET XP ERROR:", error);
  }

  return data?.amount || 0;
}

async function addXP(userId, amount) {
  const current = await getXP(userId);

  const { error } = await supabase
    .from("xp")
    .upsert({
      user_id: userId,
      amount: current + amount
    });

  if (error) {
    console.error("ADD XP ERROR:", error);
  }

  return current + amount;
}

async function saveSubmission(userTag, homework, link) {
  const { error } = await supabase
    .from("submissions")
    .insert({
      user_tag: userTag,
      homework,
      link
    });

  if (error) {
    console.error("SUBMISSION ERROR:", error);
  }
}



const commands = [
    new SlashCommandBuilder().setName("help").setDescription("Show all commands"),

    new SlashCommandBuilder()
    .setName("match-create")
    .setDescription("Create a gaming matchmaking lobby")
    .addStringOption(o =>
    o.setName("game").setDescription("Game name").setRequired(true)
    )
    .addStringOption(o =>
    o.setName("mode")
    .setDescription("Match mode")
    .setRequired(true)
    .addChoices(
      { name: "1v1", value: "1v1" },
      { name: "2v2", value: "2v2" },
      { name: "3v3", value: "3v3" },
      { name: "5v5", value: "5v5" }
    )
    ),

  new SlashCommandBuilder()
    .setName("ask")
    .setDescription("Ask Digital School AI")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("python")
    .setDescription("Ask Python AI")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("html")
    .setDescription("Ask HTML AI")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("css")
    .setDescription("Ask CSS AI")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("javascript")
    .setDescription("Ask JavaScript AI")
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
        .setDescription("Topic")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("challenge")
    .setDescription("Get coding challenge")
    .addStringOption(o =>
      o.setName("topic")
        .setDescription("Topic")
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
    .setName("rank")
    .setDescription("Show your XP"),

  new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Show XP leaderboard"),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify as Student"),

  new SlashCommandBuilder()
    .setName("submit")
    .setDescription("Submit homework")
    .addStringOption(o =>
      o.setName("homework")
        .setDescription("Homework name")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("link")
        .setDescription("GitHub/file link")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("homework")
    .setDescription("Post homework")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("title")
        .setDescription("Title")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("task")
        .setDescription("Task")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("deadline")
        .setDescription("Deadline")
    ),

  new SlashCommandBuilder()
    .setName("announce")
    .setDescription("Send announcement")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(o =>
      o.setName("message")
        .setDescription("Message")
        .setRequired(true)
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
      o.setName("amount")
        .setDescription("1-100")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a student")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user")
        .setDescription("Student")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("Reason")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user")
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addIntegerOption(o =>
      o.setName("minutes")
        .setDescription("Minutes")
        .setRequired(true)
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
      o.setName("seconds")
        .setDescription("Seconds")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("poll")
    .setDescription("Create a poll")
    .addStringOption(o =>
      o.setName("question")
        .setDescription("Question")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Send a suggestion")
    .addStringOption(o =>
      o.setName("idea")
        .setDescription("Idea")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("report")
    .setDescription("Report a user")
    .addUserOption(o =>
      o.setName("user")
        .setDescription("User")
        .setRequired(true)
    )
    .addStringOption(o =>
      o.setName("reason")
        .setDescription("Reason")
        .setRequired(true)
    )

].map(c => c.toJSON());
async function askAI(prompt) {
  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
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
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("GROQ ERROR:", data);
      return "AI service error.";
    }

    return data.choices?.[0]?.message?.content || "No AI response.";
  } catch (err) {
    console.error("AI FETCH ERROR:", err);
    return "AI connection problem.";
  }
}

client.once("clientReady", async () => {
  console.log(`Logged in as ${client.user.tag}`);

  const rest = new REST({
    version: "10"
  }).setToken(process.env.TOKEN);

  await rest.put(
    Routes.applicationGuildCommands(
      process.env.CLIENT_ID,
      process.env.GUILD_ID
    ),
    {
      body: commands
    }
  );

  console.log("Digital School commands loaded.");
});

client.on("guildMemberAdd", async member => {
  const channel = member.guild.systemChannel;

  if (channel) {
    channel.send(
      `🎉 Welcome ${member} to Digital School!`
    );
  }
});
client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() && !interaction.isButton()) return;

  try {
    if (interaction.isButton()) {
      const match = matches.get(interaction.message.id);

      if (!match) {
        return interaction.reply({
          content: "This match no longer exists.",
          ephemeral: true
        });
      }

      if (interaction.customId === "match_join") {
        if (match.players.includes(interaction.user.id)) {
          return interaction.reply({
            content: "You already joined.",
            ephemeral: true
          });
        }

        if (match.players.length >= match.maxPlayers) {
          return interaction.reply({
            content: "Match is already full.",
            ephemeral: true
          });
        }

        match.players.push(interaction.user.id);
      }

      if (interaction.customId === "match_leave") {
        match.players = match.players.filter(id => id !== interaction.user.id);
      }

      if (interaction.customId === "match_cancel") {
        if (interaction.user.id !== match.creator) {
          return interaction.reply({
            content: "Only the creator can cancel this match.",
            ephemeral: true
          });
        }

        matches.delete(interaction.message.id);

        return interaction.update({
          content: "❌ Match cancelled.",
          embeds: [],
          components: []
        });
      }

      const half = match.maxPlayers / 2;
      const teamA = match.players.slice(0, half);
      const teamB = match.players.slice(half);
      const isFull = match.players.length >= match.maxPlayers;

      const embed = new EmbedBuilder()
      .setTitle(isFull ? "✅ Match Ready" : "🎮 Matchmaking")
      .setDescription(
        `**Game:** ${match.game}\n` +
        `**Mode:** ${match.mode}\n` +
        `**Players:** ${match.players.length}/${match.maxPlayers}\n\n` +
        `**Team A**\n${teamA.map(id => `👤 <@${id}>`).join("\n") || "Waiting..."}\n\n` +
        `**Team B**\n${teamB.map(id => `👤 <@${id}>`).join("\n") || "Waiting..."}`
      );

      return interaction.update({
        embeds: [embed]
      });
    }

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

    if (cmd === "rank") {
      const userXp = await getXP(interaction.user.id);
      return interaction.reply(`${interaction.user} has **${userXp} XP**.`);
    }

    if (cmd === "leaderboard") {
      const { data: top, error } = await supabase
        .from("xp")
        .select("user_id, amount")
        .order("amount", { ascending: false })
        .limit(10);

      if (error) {
        console.error("LEADERBOARD ERROR:", error);
        return interaction.reply("Could not load leaderboard.");
      }

      if (!top || top.length === 0) {
        return interaction.reply("No XP yet.");
      }

      const text = top
        .map((x, i) => `${i + 1}. <@${x.user_id}> — ${x.amount} XP`)
        .join("\n");

      return interaction.reply(`🏆 **Leaderboard**\n${text}`);
    }

    if (cmd === "submit") {
      const homework = interaction.options.getString("homework");
      const link = interaction.options.getString("link");

      await saveSubmission(interaction.user.tag, homework, link);
      await addXP(interaction.user.id, 25);

      return interaction.reply(
        `✅ Homework submitted!\n**Homework:** ${homework}\n**Link:** ${link}\n+25 XP`
      );
    }

    if (cmd === "verify") {
      const role = interaction.guild.roles.cache.find(r => r.name === "Student");

      if (!role) {
        return interaction.reply({
          content: "Create a role named `Student` first.",
          ephemeral: true
        });
      }

      await interaction.member.roles.add(role);

      return interaction.reply({
        content: "✅ You are now verified as Student.",
        ephemeral: true
      });
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

    if (cmd === "match-create") {
      const game = interaction.options.getString("game");
      const mode = interaction.options.getString("mode");
      const maxPlayers = getMaxPlayers(mode);

      const embed = new EmbedBuilder()
      .setTitle("🎮 Matchmaking")
      .setDescription(
        `**Game:** ${game}\n` +
        `**Mode:** ${mode}\n` +
        `**Players:** 1/${maxPlayers}\n\n` +
        `👤 ${interaction.user}`
      );

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
        .setCustomId("match_join")
        .setLabel("Join")
        .setStyle(ButtonStyle.Success),
                                                       new ButtonBuilder()
                                                       .setCustomId("match_leave")
                                                       .setLabel("Leave")
                                                       .setStyle(ButtonStyle.Secondary),
                                                       new ButtonBuilder()
                                                       .setCustomId("match_cancel")
                                                       .setLabel("Cancel")
                                                       .setStyle(ButtonStyle.Danger)
      );

      const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
      });

      matches.set(msg.id, {
        creator: interaction.user.id,
        game,
        mode,
        maxPlayers,
        players: [interaction.user.id]
      });

      return;
    }

    if (cmd === "classinfo") {
      const embed = new EmbedBuilder()
        .setTitle("Digital School Class Info")
        .setDescription("Programming, web development, Python, AI, and projects.")
        .addFields(
          {
            name: "Topics",
            value: "HTML, CSS, JavaScript, Python, GitHub, Linux, AI"
          },
          {
            name: "Rules",
            value: "Be respectful. No spam. Ask questions. Submit homework on time."
          }
        );

      return interaction.reply({ embeds: [embed] });
    }

    if (cmd === "homework") {
      const title = interaction.options.getString("title");
      const task = interaction.options.getString("task");
      const deadline = interaction.options.getString("deadline") || "No deadline";

      const embed = new EmbedBuilder()
        .setTitle(`📚 Homework: ${title}`)
        .setDescription(task)
        .addFields({
          name: "Deadline",
          value: deadline
        })
        .setFooter({
          text: `Posted by ${interaction.user.username}`
        });

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

    if (cmd === "close") {
      if (!interaction.channel.name.startsWith("help-")) {
        return interaction.reply({
          content: "This is not a ticket channel.",
          ephemeral: true
        });
      }

      await interaction.reply("Closing ticket...");
      setTimeout(() => interaction.channel.delete().catch(() => {}), 2000);
      return;
    }

    if (cmd === "clear") {
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

    if (cmd === "warn") {
      const user = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason");

      return interaction.reply(
        `⚠️ ${user} has been warned.\nReason: ${reason}`
      );
    }

    if (cmd === "kick") {
      const member = interaction.options.getMember("user");

      if (!member) {
        return interaction.reply({
          content: "User not found.",
          ephemeral: true
        });
      }

      await member.kick("Kicked by Digital School bot");

      return interaction.reply(`👢 ${member.user.tag} was kicked.`);
    }

    if (cmd === "ban") {
      const member = interaction.options.getMember("user");

      if (!member) {
        return interaction.reply({
          content: "User not found.",
          ephemeral: true
        });
      }

      await member.ban({
        reason: "Banned by Digital School bot"
      });

      return interaction.reply(`🔨 ${member.user.tag} was banned.`);
    }

    if (cmd === "timeout") {
      const member = interaction.options.getMember("user");
      const minutes = interaction.options.getInteger("minutes");

      if (!member) {
        return interaction.reply({
          content: "User not found.",
          ephemeral: true
        });
      }

      await member.timeout(minutes * 60 * 1000, "Timed out by Digital School bot");

      return interaction.reply(
        `⏱️ ${member.user.tag} timed out for ${minutes} minutes.`
      );
    }

    if (cmd === "lock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: false
      });

      return interaction.reply("🔒 Channel locked.");
    }

    if (cmd === "unlock") {
      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: true
      });

      return interaction.reply("🔓 Channel unlocked.");
    }

    if (cmd === "slowmode") {
      const seconds = interaction.options.getInteger("seconds");
      await interaction.channel.setRateLimitPerUser(seconds);

      return interaction.reply(`🐢 Slowmode set to ${seconds} seconds.`);
    }

    if (cmd === "poll") {
      const question = interaction.options.getString("question");

      const msg = await interaction.reply({
        content: `📊 **Poll**\n${question}`,
        fetchReply: true
      });

      await msg.react("👍");
      await msg.react("👎");
      return;
    }

    if (cmd === "suggest") {
      const idea = interaction.options.getString("idea");

      const msg = await interaction.reply({
        content: `💡 **Suggestion from ${interaction.user}**\n${idea}`,
        fetchReply: true
      });

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

    return interaction.reply({
      content: "Something went wrong.",
      ephemeral: true
    });
  }
});

client.login(process.env.TOKEN);
