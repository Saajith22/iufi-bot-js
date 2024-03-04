import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  Message,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "trade",
  description: "Trades your card with a member.",
  usage: "<member> <card_id> <candies>",
  aliases: ["t"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const member = message.mentions.members.first();
    if (!member)
      return await message.reply({
        embeds: [client.argError("trade", "member")],
      });

    const cardId = args[1];
    if (!cardId)
      return await message.reply({
        embeds: [client.argError("trade", "card_id")],
      });

    const candies = args[2];
    if (!candies)
      return await message.reply({
        embeds: [client.argError("trade", "candies")],
      });

    if (member.id === message.author.id || member.user.bot)
      return await message.reply("You can not trade with yourself or a bot.");

    const data = await client.getData(message.author.id);
    const card =
      data && data.cards.find((c) => parseInt(c.id) === parseInt(cardId));
    if (!data || !card) return await message.reply("You do not own that card.");

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
      content: `${member}, ${message.author} wants to trade with you.`,
      components: [row],
      files: [attach],
      embeds: [
        client
          .createEmbed({
            title: `⤵️ Trade`,
            description: client.blocker(
              `Seller: ${
                message.member.displayName
              }\nBuyer: -\nCandies: 🍬 ${candies}\n\n🆔 ${card.id}\n🏷️ ${
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
      filter: (i) => [member.id, message.author.id].includes(i.user.id),
      time: 60000,
    });

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

        await client.changeBalance(message.author.id, amount);
        await client.changeBalance(member.id, amount, true);
        await client.addCard(member.id, card);
        await client.removeCard(message.author.id, card.id);

        await i.reply({
          content: `${message.author}, ${member} has made a trade with you for the card!`,
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
        "Buyer: -",
        `Buyer: ${member.displayName}`
      );

      await msg.edit({
        components: [row],
        embeds: [embed],
        files: [attach],
      });
    });
  },
};
