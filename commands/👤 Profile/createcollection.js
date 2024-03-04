import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "createcollection",
  description: "Creates a collection.",
  usage: "<name>",
  aliases: ["cc"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const name = args[0];
    if (!name)
      return await message.reply({
        embeds: [client.argError("createcollection", "name")],
      });

    const data = await client.getData(message.author.id);
    const final = {};

    const setData = {
      name: name.toLowerCase(),
      cards: Array.from(new Array(6), undefined),
    };

    if (data && data.collections) {
      if (data.collections.find((c) => c.name === name))
        return await message.reply(
          "A collection with that name already exists!"
        );

      data.collections.push(setData);
      final.collections = data.collections;
    } else final.collections = [setData];

    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: final,
      },
      {
        upsert: true,
      }
    );

    await message.reply(
      `${
        message.author
      } collection successfully created with the name **${client.title(
        name
      )}**. You can now use \`qsetcollection\` to edit your collection.`
    );
  },
};
