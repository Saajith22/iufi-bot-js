import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  Message,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "tradeeveryonelast",
  description: "Trades your last card with everyone.",
  usage: "<candies>",
  aliases: ["tel"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const candies = args[0];
    if (!candies)
      return await message.reply({
        embeds: [client.argError("trade", "candies")],
      });

    const data = await client.getData(message.author.id);
    const card = data && data.cards.at(-1);
    if (!data || !card) return await message.reply("You do not have any card.");

    const row = new ActionRowBuilder().setComponents(
      new ButtonBuilder()
        .setCustomId("accept")
        .setStyle("Success")
        .setLabel("Trade Now"),
      new ButtonBuilder()
        .setCustomId("cancel")
        .setStyle("Danger")
        .setLabel("Cancel")
    );

    const attach = new AttachmentBuilder()
      .setName("trade.png")
      .setFile(card.url);

    const msg = await message.reply({
      content: `${message.author} wants to trade.`,
      components: [row],
      files: [attach],
      embeds: [
        client
          .createEmbed({
            title: `⤵️ Trade`,
            description: client.blocker(
              `Seller: ${
                message.member.displayName
              }\nBuyer: Anyone\nCandies: 🍬 ${candies}\n\n🆔 ${card.id}\n🏷️ ${
                card.tag || "-"
              }\n🖼️ ${card.frame || "-"}\n${
                client.conversions[card.type]
              } ${client.title(card.type)}\n⭐ ${card.stars}`
            ),
          })
          .setImage("attachment://trade.png"),
      ],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => !i.user.bot,
      time: 60000,
    });

    let buyer = "";

    collector.on("collect", async (i) => {
      if (i.customId === "accept") {
        if (i.user.id === message.author.id)
          return await i.reply({
            content: "You can not accept your own trade.",
            ephemeral: true,
          });

        const data = await client.getData(i.user.id);
        const amount = Number(candies);
        if (data.balance < amount)
          return await i.reply({
            content: "You do not have enough balance.",
            ephemeral: true,
          });

        await client.changeBalance(message.author.id, Number(candies));
        await client.changeBalance(i.user.id, Number(candies), true);
        await client.addCard(i.user.id, card);
        await client.removeCard(message.author.id, card.id);

        buyer = i.member.displayName;
        await i.reply({
          content: `${message.author}, ${i.user} has made a trade with you for the card!`,
          embeds: [
            client.createEmbed({
              title: `✅ Traded`,
              description: client.blocker(`🆔 ${card.id}\n🍬 - ${candies}`),
            }),
          ],
        });
      }

      collector.stop();
    });

    collector.on("end", async () => {
      row.components.forEach((c) => c.setDisabled(true));
      const embed = msg.embeds[0];
      embed.data.description = embed.description.replace(
        "Buyer: Anyone",
        `Buyer: ${buyer}`
      );

      await msg.edit({
        components: [row],
        embeds: [embed],
        files: [attach],
      });
    });
  },
};
