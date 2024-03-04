import { AttachmentBuilder, Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "setcollection",
  description:
    "Sets a photocard in the given slot [1 to 6] as your collection. Card can be identified by its ID or given tag.",
  usage: "<name> <slot> [card_id]",
  aliases: ["sc"],
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
        embeds: [client.argError("setcollection", "name")],
      });

    const slot = Number(args[1]);
    if (!slot)
      return await message.reply({
        embeds: [client.argError("setcollection", "slot")],
      });

    if (slot > 6 || slot < 1)
      return await message.reply(
        "The slot number must be between `1` and `6`."
      );

    const id = args[2];

    const data = await client.getData(message.author.id);
    const find = data?.collections?.find((c) => c.name === name.toLowerCase());
    if (
      !data ||
      !data.collections ||
      data.collections.filter((e) => e).length < 1 ||
      !find
    )
      return await message.reply(
        `Collection with name \`${client.title(name)}\` does not exist.`
      );

    const card = id
      ? data.cards?.find((c) => parseInt(c.id) === parseInt(id) || c.tag === id)
      : "None";

    if (!card) return await message.reply(`Provided card not found.`);

    find.cards[slot - 1] = card === "None" ? null : card;
    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: {
          collections: data.collections,
        },
      }
    );

    await message.reply({
      embeds: [
        client.createEmbed({
          title: "💕 Collection Set",
          description: client.blocker(
            `📮 ${client.title(name)}\n🆔 ${card?.id || card}\n🎰 ${slot}`
          ),
        }),
      ],
    });
  },
};
