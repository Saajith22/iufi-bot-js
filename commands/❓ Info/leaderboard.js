import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "leaderboard",
  description: "Shows the IUFI leaderboard.",
  aliases: ["l"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const users = await client.db
      .collection("users")
      .find()
      .sort({ xp: -1 })
      .toArray();

    const postions = ["🥇", "🥈", "🥉"];

    return await message.reply({
      embeds: [
        client
          .createEmbed({
            title: `🏆   IUFI Leaderboard`,
            description: client.blocker(
              users
                .map((u, i) => {
                  const member = message.guild.members.cache.get(u.userId);

                  return `${postions[i] || "🏅"} ${client.spacer(
                    member.displayName,
                    14
                  )} ${client.getLevel(u.xp).level} ⚔️`;
                })
                .join("\n")
            ),
          })
          .setThumbnail(message.guild.iconURL()),
      ],
    });
  },
};
