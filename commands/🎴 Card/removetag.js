import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "removetag",
  description: "Removes the photocard's tag.",
  aliases: ["rt"],
  usage: "<card_id>",
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
        embeds: [client.argError("removetag", "card_id")],
      });

    const data = await client.getData(message.author.id);
    if (!data) return await message.reply("You do not have any cards.");

    const cardIndex = data.cards.findIndex(
      (c) => parseInt(c.id) === parseInt(cardId)
    );
    if (cardIndex < 0) return await message.reply("You do not own this card.");

    const card = data.cards[cardIndex];
    delete card.tag;

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
            `🆔 ${client.conversions[card.type]} ${card.id}\n🏷️ -`
          ),
        }),
      ],
    });
  },
};
