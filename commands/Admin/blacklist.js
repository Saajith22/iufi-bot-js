import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "blacklist",
  description: "Blacklist a member from using the command. **[ADMIN ONLY]**",
  usage: "<member>",
  aliases: ["bl"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first();
    if (!member)
      return await message.reply("Please provide the member to blacklist.");

    await client.db.collection("blacklist").insertOne({
      userId: member.id,
    });

    await message.reply("Successfully blacklisted member.");
  },
};
