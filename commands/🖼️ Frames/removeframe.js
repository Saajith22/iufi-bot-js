import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import fs from "fs";
import { createCanvas, loadImage } from "canvas";

export default {
  name: "removeframe",
  description:
    "Removes the frame from the photocard. Card can be identified by its ID or given tag.",
  usage: "<card_id>",
  aliases: ["rf"],
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
        embeds: [client.argError("removeframe", "card_id")],
      });

    const user = await client.getData(message.author.id);
    const card = user?.cards?.find((c) => parseInt(c.id) === parseInt(cardId));
    if (!user || !card)
      return await message.reply(
        "Please verify that the card is yours and exists."
      );

    if (!card.frame) return await message.reply("Card does not have a frame.");
    card.frame = null;
    
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

    await message.reply({
      embeds: [
        client.createEmbed({
          title: "🖼️  Set Frame",
          description: client.blocker(
            `🆔 ${client.conversions[card.type]} ${card.id}\n🖼️ -`
          ),
        }),
      ],
    });
  },
};
