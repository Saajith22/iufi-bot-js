import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "cooldown",
  description: "Shows all your cooldowns.",
  aliases: ["cd"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const data = await client.db.collection("cooldown").findOne({
      userId: message.author.id,
    });

    const user = await client.getData(message.author.id);

    const getSend = (v) => {
      const find = data && data.cooldowns.find((c) => c.name === v);
      return find && find.time - Date.now() > 0
        ? client.ms(find.time).format
        : "Ready";
    };

    const conv = ["⚡ Spped", "🍀 Luck"];
    const potCooldowns =
      data &&
      data.cooldowns
        .filter((c) => ["luck", "speed"].includes(c.name))
        .map((s) => {
          return `${conv.find((c) =>
            c.toLowerCase().includes(s.name)
          )} ${"I".repeat(s.level)} : ${client.ms(s.time).format}`;
        });

    await message.reply({
      embeds: [
        client
          .createEmbed({
            title: `⏰ ${message.member.displayName}'s Cooldowns`,
            description: client.blocker(
              `🎲 Roll : ${getSend("roll")}\n📅 Daily: ${getSend(
                "daily"
              )}\n🃏 Match: ${getSend("game")}\n💯 Quiz : ${getSend(
                "quiz"
              )}\n🔔 Reminder: ${
                user && user.reminder ? "On" : "Off"
              }\n\nPotion Time Left:\n${
                potCooldowns?.length > 0
                  ? potCooldowns.join("\n")
                  : "No potions are activated."
              }`
            ),
          })
          .setThumbnail(message.author.avatarURL()),
      ],
    });
  },
};
