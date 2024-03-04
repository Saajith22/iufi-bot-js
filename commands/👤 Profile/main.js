import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "main",
  description: "Sets the photocard as your profile display.",
  usage: "[card_id]",
  aliases: ["m"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const id = args[0];
    const data = await client.getData(message.author.id);

    if (id) {
      const card =
        data && data.cards.find((card) => parseInt(card.id) === parseInt(id));

      if (!card)
        return await message.reply("You are not the owner of this card.");

      await client.db.collection("users").updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            main: card,
          },
        }
      );

      await message.reply({
        embeds: [
          client.createEmbed({
            title: `👤 Set Main`,
            description: client.blocker(
              `${client.conversions[card.type]} ${
                card.id
              } has been set as profile card.`
            ),
          }),
        ],
      });
    } else {
      await client.db.collection("users").updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            main: null,
          },
        },
        {
          upsert: true,
        }
      );

      await message.reply({
        embeds: [
          client.createEmbed({
            title: `👤 Set Main`,
            description: client.blocker(`Your profile card has been cleared`),
          }),
        ],
      });
    }
  },
};
