import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  Message,
  StringSelectMenuBuilder,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import { Canvas, createCanvas, loadImage } from "canvas";

export default {
  name: "view",
  description: "View your photocard collection.",
  aliases: ["v"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const user = await client.getData(message.author.id);
    if (!user || user.cards.length < 1)
      return await message.reply("You do not have any cards at the moment!");

    const limit = 8;
    const pages = [];
    let curr = [];
    user.cards.forEach((c, i) => {
      if ((i + 1) % limit === 0 || i === user.cards.length - 1) {
        curr.push(c);
        pages.push(curr);
        curr = [];
      } else curr.push(c);
    });

    const buttons = [
      {
        name: "<<",
        style: "Secondary",
      },
      {
        name: "Back",
        style: "Primary",
      },
      {
        name: "Next",
        style: "Primary",
      },
      {
        name: ">>",
        style: "Secondary",
      },
      {
        name: "📄",
        style: "Success",
      },
    ];

    const row = new ActionRowBuilder();
    buttons.forEach((b) =>
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(b.name.toLowerCase())
          .setLabel(b.name)
          .setStyle(b.style)
      )
    );

    let page = 0;
    const row2 = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("view")
        .setPlaceholder("Select a card to view...")
    );

    const setOptions = () =>
      row2.components[0].setOptions(
        pages[page].map((l) => {
          return {
            label: l.id,
            emoji: client.conversions[l.type],
            description: `🏷️ ${l.tag || "-"}`,
            value: l.id,
          };
        })
      );

    setOptions();

    const getDescription = () =>
      client.blocker(
        `${pages[page]
          .map(
            (p) =>
              `🆔 ${p.id} 🏷️ ${client.spacer(p.tag || "-", 10)} 🖼️ ${
                p.frame || "-  "
              }  ${p.stars >= 5 ? "🌟" : "⭐"} ${p.stars} ${
                client.conversions[p.type]
              }`
          )
          .join("\n")}`
      );

    const makeEmbed = () =>
      client
        .createEmbed({
          title: `📖 ${message.member.displayName}'s Photocards`,
          description: `📙 Collection size: \`${
            user.cards.length
          }/100\`\n${getDescription()}`,
        })
        .setThumbnail(message.author.avatarURL())
        .setFooter({
          text: `Page ${page + 1}/${pages.length}`,
        });

    const msg = await message.reply({
      components: [row, row2],
      embeds: [makeEmbed()],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      idle: 150000,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();

      switch (i.customId) {
        case "view": {
          const id = i.values[0];
          return await client.commands.get("cardinfo").run(client, msg, [id]);
        }

        case "<<": {
          page = 0;
          break;
        }

        case "back": {
          if (page - 1 >= 0) page--;
          break;
        }

        case "next": {
          if (page + 1 < pages.length) page++;
          break;
        }

        case ">>": {
          page = pages.length - 1;
          break;
        }

        default: {
          const gpage = pages[page];
          const canvas = createCanvas(
            830,
            355 * (gpage.length / 4 > 1 ? 2 : 1)
          );
          const ctx = canvas.getContext("2d");
          const width = 190;
          const height = 345;

          for (let i = 0; i < gpage.length; i++) {
            const card = gpage[i];
            const image = await loadImage(card.url);
            const p = i >= 4 ? i - 4 : i;
            const x = p * width + p * 12;
            const y = i >= 4 ? 355 : 0;

            if (card.frame)
              client.drawFrame(image, card.frame, ctx, x, y, width, height);
            else {
              ctx.save();
              ctx.roundRect(x, y, width, height, 10);
              ctx.clip();
              ctx.drawImage(image, x, y, width, height);
              ctx.restore();
            }
          }

          return await msg.reply({
            files: [
              new AttachmentBuilder()
                .setFile(canvas.toBuffer())
                .setName("show.png"),
            ],
            embeds: [
              client
                .createEmbed({
                  title: "ℹ️ Card Info",
                  description: getDescription(),
                })
                .setImage("attachment://show.png"),
            ],
          });
        }
      }

      setOptions();
      await msg.edit({
        components: [row, row2],
        embeds: [makeEmbed()],
      });
    });
  },
};
