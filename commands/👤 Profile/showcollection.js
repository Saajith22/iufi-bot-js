import {
  ActionRowBuilder,
  AttachmentBuilder,
  ComponentType,
  Message,
  StringSelectMenuBuilder,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import { createCanvas, loadImage } from "canvas";

export default {
  name: "showcollection",
  description:
    "Shows the given member's collection photocards. If not specified, shows your own.",
  usage: "[member]",
  aliases: ["f"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first() || message.member;

    const data = await client.getData(message.author.id);
    if (
      !data ||
      !data.collections ||
      data.collections.filter((e) => e).length < 1
    )
      return await message.reply(`${member} does not have any collections.`);

    const row = new ActionRowBuilder().setComponents(
      new StringSelectMenuBuilder()
        .setCustomId("collection")
        .setPlaceholder("Select a collection to view...")
        .setOptions(
          data.collections.map((c) => {
            return {
              label: client.title(c.name),
              value: c.name,
            };
          })
        )
    );

    const perform = async (name, msg) => {
      const coll = data.collections.find((c) => c.name === name);
      const canvas = createCanvas(710, 500);
      const ctx = canvas.getContext("2d");

      const mapped = await Promise.all(
        coll.cards.map(async (c, i) => {
          if (c) {
            const image = await loadImage(c.url);
            const h = 240;
            const w = 216;
            const pad = 15;
            const y = i >= 3 ? h + pad : 0;
            const x = i >= 3 ? (3 - i) * (w + pad) : i * (w + pad);

            if (c.frame) client.drawFrame(image, c.frame, ctx, x, y, w, h);
            else {
              ctx.save();
              ctx.roundRect(x, y, w, h, 10);
              ctx.clip();
              ctx.drawImage(image, x, y, w, h);
              ctx.restore();
            }

            return `🆔 ${c.id} 🏷️ ${c.tag || "-"}           🖼️ ${
              c.frame || "-"
            }  ⭐ ${c.stars} ${client.conversions[c.type]}`;
          } else return "\u200b";
        })
      );

      const attach = new AttachmentBuilder()
        .setFile(canvas.toBuffer())
        .setName("final.png");

      const messageData = {
        components: [row],
        files: [attach],
        embeds: [
          client
            .createEmbed({
              title: `❤️  Saajith's ${client.title(coll.name)} Collection`,
              description: client.blocker(mapped.join("\n")),
            })
            .setImage("attachment://final.png"),
        ],
      };

      if (!msg) return await message.reply(messageData);
      else await msg.edit(messageData);
    };

    const msg = await perform(data.collections[0].name);
    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      componentType: ComponentType.StringSelect,
      idle: 30000,
    });

    collector.on("collect", async (i) => {
      const nn = i.values[0];
      await perform(nn, msg);
    });
  },
};
