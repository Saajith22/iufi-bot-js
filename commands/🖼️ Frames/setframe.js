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
  name: "setframe",
  description: "Sets the frame for the photocard.",
  usage: "<card_id>",
  aliases: ["sf"],
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
        embeds: [client.argError("setframe", "card_id")],
      });

    const user = await client.getData(message.author.id);
    const card = user?.cards?.find((c) => parseInt(c.id) === parseInt(cardId));
    if (!user || !card)
      return await message.reply(
        "Please verify that the card is yours and exists."
      );

    if (card.stars < 5)
      return await message.reply("Card must have 5 stars to apply frame.");

    const cost = {
      signed: 60,
      lovepoem: 60,
      hearts: 20,
      uaena: 40,
      cheer: 60,
      smoon: 60,
      dandelions: 40,
      celebrity: 20,
      shine: 60,
    };

    const frames = fs
      .readdirSync("./frames")
      .filter((e) => !e.includes("-"))
      .map((f) => {
        const change = f.replace(".png", "");
        return {
          label: client.title(change),
          value: change,
          emoji: client.frameConv[change],
          description: `🍬 ${cost[change]}`,
          path: `./frames/${f}`,
        };
      });

    const row = new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("frame")
        .setPlaceholder("Select a frame to view...")
        .setOptions(frames)
    );

    const row2 = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId("apply")
        .setLabel("Apply")
        .setStyle("Success")
    );

    const attach = new AttachmentBuilder()
      .setFile(card.url)
      .setName("card.png");

    let name = "";
    let amount = 0;

    const makeEmbed = () =>
      client
        .createEmbed({
          title: `🖼️  Frame Preview`,
          description: client.blocker(
            `🆔 ${client.conversions[card.type]} ${
              card.id
            }\n🖼️ ${name}\n🍬 ${amount}`
          ),
        })
        .setImage("attachment://card.png");

    const msg = await message.reply({
      components: [row, row2],
      files: [attach],
      embeds: [makeEmbed()],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      idle: 30000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "apply") {
        if (amount > user.balance)
          return await i.reply({
            content: `You don't have enough candies! You only have \`${user.balance}\` candies`,
          });

        await client.changeBalance(message.author.id, amount, true);

        card.frame = client.frameConv[name.toLowerCase()];
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

        return i.reply({
          embeds: [
            client.createEmbed({
              title: "🖼️  Set Frame",
              description: client.blocker(
                `🆔 ${client.conversions[card.type]} ${card.id}\n🖼️ ${
                  client.frameConv[name.toLowerCase()]
                }`
              ),
            }),
          ],
        });
      }

      await i.deferUpdate();
      const value = i.values[0];
      const frame = frames.find((f) => f.value === value);
      const canvas = await client.framer(frame.path, card);

      const final = new AttachmentBuilder()
        .setFile(canvas.toBuffer())
        .setName("card.png");

      name = client.title(value);
      amount = cost[value];

      await msg.edit({
        files: [final],
        embeds: [makeEmbed()],
      });
    });
  },
};
