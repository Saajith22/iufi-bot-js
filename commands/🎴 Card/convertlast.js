import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "convertlast",
  description: "Converts the last photocard into starcandies.",
  aliases: ["cl"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const user = await client.getData(message.author.id);
    if (!user || !user.cards || user.cards.length < 1)
      return await message.reply("You do not have any cards.");

    const convert = {
      common: 1,
      rare: 10,
      epic: 40,
      legendary: 100,
      mystic: 250,
    };

    const final = [];
    let total = 0;

    const card = user.cards.at(-1);
    total += convert[card.type];
    final.push(`${client.conversions[card.type]} ${card.id}`);
    await client.removeCard(message.author.id, card.id);

    await client.changeBalance(message.author.id, total);
    await message.reply({
      embeds: [
        client.createEmbed({
          title: `✨ Convert`,
          description: client.blocker(`🆔 ${final.join(", ")}\n🍬 + ${total}`),
        }),
      ],
    });
  },
};
