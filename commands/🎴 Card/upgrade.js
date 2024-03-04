import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "upgrade",
  description: "Use cards of the same type to upgrade your card star.",
  usage: "<upgrade_card_id> <card_ids>",
  aliases: ["u"],
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
        embeds: [client.argError("upgrade", "upgrade_card_id")],
      });

    const others = args.slice(1);
    if (others.length < 1)
      return await message.reply({
        embeds: [client.argError("upgrade", "card_ids")],
      });

    const user = await client.getData(message.author.id);
    if (!user || !user.cards || user.cards.length < 1)
      return await message.reply("You do not have any cards.");

    const card = user.cards.find(
      (c) => parseInt(c.id) === parseInt(cardId) || c.tag === cardId
    );
    if (!card) return await message.reply("Card not found.");
    if (card.stars === 10)
      return await message.reply(
        "Your card has reached the maximum number of stars."
      );

    const filter = others
      .map((o) => {
        return user.cards.findIndex(
          (c) => parseInt(c.id) === parseInt(o) && c.type === card.type
        );
      })
      .filter((e) => e > -1);

    const prev = card.stars;

    const mapped = await Promise.all(
      filter.map(async (cc) => {
        if (card.stars === 10) return "";
        card.stars++;

        const c = user.cards[cc];
        user.cards.splice(cc, 1);

        return `${client.conversions[c.type]} ${c.id}`;
      })
    );

    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: {
          cards: user.cards,
        },
      }
    );

    return await message.reply({
      embeds: [
        client.createEmbed({
          title: "🆙 Upgraded",
          description: client.blocker(
            `🆔 ${client.conversions[card.type]} ${card.id} ${
              card.tag ? `(${card.tag})` : ""
            } <- ${mapped.join(" , ")}\n⭐ ${card.stars} <- ${prev}`
          ),
        }),
      ],
    });
  },
};
