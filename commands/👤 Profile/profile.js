import { AttachmentBuilder, Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "profile",
  description: "View your profile.",
  usage: "[member]",
  aliases: ["p"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first() || message.member;
    const data = await client.getData(member.id);
    if (!data) return await message.reply("User has no data.");

    const attach = new AttachmentBuilder()
      .setFile(data.main?.url)
      .setName("main.png");

    const { start, level } = client.getLevel(data.xp);

    const converts = ["🟩", "🟦", "🟪"];
    const match = converts.map((c, i) => {
      const details = data.games && data.games[i + 1];

      return `${c} **Level ${i + 1}**: ${
        details
          ? `🃏 \`${details.matches}\` 🕒 \`${
              client.ms(details.time + Date.now()).format
            }\``
          : "Not attempted yet"
      }`;
    });

    const rank = client.getRank(data.points || 0);

    await message.reply({
      files: [attach],
      embeds: [
        client
          .createEmbed({
            title: `👤 ${member.displayName}'s Profile`,
            description: client.blocker(
              `📙 Photocards: ${
                data.cards ? data.cards.length : 0
              }/100\n⚔️ Level: ${level} (${
                data.xp > 0 ? ((data.xp * 100) / start).toFixed(1) : "0.0"
              }%)`
            ),
          })
          .setThumbnail("attachment://main.png")
          .addFields([
            {
              name: "Ranked Stats",
              value: `>>> ${rank[1].icon} ${client.title(rank[0])} (\`${
                data.points || 0
              }\`)
              🎯 K/DA: \`0\` (C: \`0\` | W: \`0\`)
              🕒 Average Time: \`${(data.averageTime
                ? data.averageTime / 10
                : 0
              ).toFixed(1)}s\``,
              inline: true,
            },
            {
              name: "Card Match Stats",
              value: `>>> ${match.join("\n")}`,
              inline: true,
            },
          ]),
      ],
    });
  },
};
