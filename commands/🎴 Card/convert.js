import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "convert",
  description:
    "Converts the photocards into starcandies. Card can be identified by its ID or given tag. The amount of starcandies received is dependent on the card's rarity.",
  usage: "<card_ids>",
  aliases: ["c"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    if (args.length < 1)
      return await message.reply({
        embeds: [client.argError("convert", "card_ids")],
      });

    const user = await client.getData(message.author.id);
    if (!user) return await message.reply("You do not have any cards.");

    const convert = {
      common: 1,
      rare: 10,
      epic: 40,
      legendary: 100,
      mystic: 250,
    };

    const final = [];
    let total = 0;

    args.forEach(async (id) => {
      const card = user.cards.find(
        (c) => parseInt(c.id) === parseInt(id) || c.tag === id
      );

      if (card) {
        total += convert[card.type];
        final.push(`${client.conversions[card.type]} ${card.id}`);
        await client.removeCard(message.author.id, card.id);
      }
    });

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
