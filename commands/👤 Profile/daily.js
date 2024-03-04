import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "daily",
  description: "Claims your daily reward.",
  aliases: ["d"],
  cooldown: 24 * 60 * 60 * 1000,
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const streakRewards = ["50 🍬", "1 🌸", "100 🍬", "1 💎", "500 🍬", "1 👑"];
    const data = await client.getData(message.author.id);
    if (data) {
      if (data.streakReset && Date.now() > data.streakReset) {
        data.streak = 0;
      } else {
        if (data.streak) data.streak++;
        else data.streak = 1;
      }
    }

    let streak = data.streak || 0;
    const strk = await Promise.all(
      streakRewards.reverse().map(async (s, i) => {
        const won = streak >= (i + 1) * 5;
        if (!won || !data) await client.changeBalance(message.author.id, 5);
        else {
          const [amt, prize] = s.split(" ");
          console.log(amt, prize);
        }

        const repeats = streak > 0 ? (streak >= 5 ? 5 : 5 - streak) : 0;
        if (streak > 0) streak -= 5;

        return `${"🟥".repeat(repeats)}${"⬜".repeat(
          5 - repeats
        )}    ${client.spacer(s, 9, true)} ${won ? "✅" : "⬛"}`;
      })
    );

    if (data)
      await client.db.collection("users").updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            ...data,
          },
        }
      );

    await message.reply({
      embeds: [
        client
          .createEmbed({
            title: `📅 Daily Reward`,
            description: `Daily reward claimed! + 🍬 5`,
          })
          .setThumbnail(message.author.avatarURL())
          .addFields([
            {
              name: "Streak Rewards",
              value: client.blocker(strk.join("\n")),
            },
          ]),
      ],
    });
  },
};
