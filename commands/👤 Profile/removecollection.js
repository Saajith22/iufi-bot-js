import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "removecollection",
  description: "Removes the collection.",
  usage: "<name>",
  aliases: ["rc"],
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
        embeds: [client.argError("removecollection", "name")],
      });

    const data = await client.getData(message.author.id);
    if (
      !data ||
      !data.collections ||
      data.collections.filter((e) => e).length < 1
    )
      return await message.reply(`You do not have any collections.`);

    const find = data.collections.findIndex(
      (c) => c.name === name.toLowerCase()
    );
    if (find < 0)
      return await message.reply(
        `Collection with name \`${client.title(name)}\` does not exist.`
      );

    data.collections.splice(find, 1);

    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: data.collections,
      }
    );

    await message.reply(
      `${
        message.author
      } collection successfully removed with the name **${client.title(
        name
      )}**.`
    );
  },
};
