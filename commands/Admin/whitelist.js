import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "whitelist",
  description: "Whitelist a blacklisted member. **[ADMIN ONLY]**",
  usage: "<member>",
  aliases: ["wl"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first();
    if (!member)
      return await message.reply("Please provide the member to whitelist.");

    const db = client.db.collection("blacklist");
    const data = await db.findOne({
      userId: member.id,
    });

    if (!data) return message.reply("Member is not blacklisted.");

    await db.deleteOne({
      userId: member.id,
    });

    await message.reply("Successfully whitelisted member.");
  },
};
