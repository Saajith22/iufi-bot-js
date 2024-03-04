import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "settaglast",
  description: "Sets the tag of the last photocard in your collection.",
  aliases: ["stl"],
  usage: "<tag>",
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const tag = args[0];
    if (!tag)
      return await message.reply({
        embeds: [client.argError("settaglast", "tag")],
      });

    if (tag.length > 10)
      return await message.reply(
        "Please shorten the tag name as it is too long. (No more than 10 chars)"
      );

    const data = await client.getData(message.author.id);
    if (!data) return await message.reply("You do not have any cards.");

    const card = data.cards.reverse()[0];
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
