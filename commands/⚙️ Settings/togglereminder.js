import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "togglereminder",
  description:
    "Turns reminders on for your cooldowns. Make sure you are not blocking DMs.",
  aliases: ["tr"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first() || message.member;
    const data = await client.getData(member.id);
    const db = client.db.collection("users");

    if (!data) {
      await db.insertOne(
        {
          userId: message.author.id,
        },
        {
          reminder: true,
        }
      );

      await message.reply({
        embeds: [
          client.createEmbed({
            title: `🔔 Reminder On`,
            description: client.blocker(`Reminders have been turned On`),
          }),
        ],
      });
    } else {
      await db.updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            reminder: !data.reminder,
          },
        }
      );

      const res = data.reminder === true ? "Off" : "On";
      await message.reply({
        embeds: [
          client.createEmbed({
            title: `🔔 Reminder ${res}`,
            description: client.blocker(`Reminders have been turned ${res}`),
          }),
        ],
      });
    }
  },
};
