import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "settag",
  description: "Sets the photocard's tag.",
  aliases: ["st"],
  usage: "<card_id> <tag>",
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const cardId = args[0];
    if (!cardId)
      return await message.reply({
        embeds: [client.argError("settag", "card_id")],
      });

    const tag = args[1];
    if (!tag)
      return await message.reply({
        embeds: [client.argError("settag", "tag")],
      });

    if (tag.length > 10)
      return await message.reply(
        "Please shorten the tag name as it is too long. (No more than 10 chars)"
      );

    const data = await client.getData(message.author.id);
    if (!data) return await message.reply("You do not have any cards.");

    const cardIndex = data.cards.findIndex(
      (c) => parseInt(c.id) === parseInt(cardId)
    );
    if (cardIndex < 0) return await message.reply("You do not own this card.");

    const card = data.cards[cardIndex];
    card.tag = tag;

    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: {
          cards: data.cards,
        },
      }
    );

    await message.reply({
      embeds: [
        client.createEmbed({
          title: "🏷️ Set Tag",
          description: client.blocker(
            `🆔 ${client.conversions[card.type]} ${card.id} (${tag})\n🏷️ ${tag}`
          ),
        }),
      ],
    });
  },
};
