import { AttachmentBuilder, Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "cardinfo",
  description: "Shows details of a card.",
  usage: "<id>",
  aliases: ["i"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const id = args[0];
    if (!id)
      return await message.reply({
        embeds: [client.argError("cardinfo", "id")],
      });

    const card = client.cards.find((cd) => parseInt(cd.id) === parseInt(id));
    if (!card)
      return await message.reply("The card was not found. Please try again.");

    const finder = (c) => c?.find((cc) => parseInt(cc.id) === parseInt(id));
    const user = (await client.db.collection("users").find().toArray()).find(
      (u) => finder(u.cards)
    );

    const attach = new AttachmentBuilder().setName("card.png");
    const findCard = finder(user?.cards);
    if (findCard?.frame) {
      const frame = Object.entries(client.frameConv).find(
        ([_, v]) => v === findCard.frame
      )[0];

      const canvas = await client.framer(`./frames/${frame}.png`, findCard);
      attach.setFile(canvas.toBuffer());
    } else attach.setFile(card.url);

    await message.reply({
      files: [attach],
      embeds: [
        client
          .createEmbed({
            title: "ℹ️ Card Info",
            description: `${client.blocker(
              `🆔 ${card.id}\n🏷️ ${findCard?.tag || "-"}\n🖼️ ${
                findCard?.frame || "-"
              }\n${client.conversions[card.type]} ${card.type}\n${
                findCard?.stars && findCard.stars >= 5 ? "🌟" : "⭐"
              } ${findCard?.stars || "-"}`
            )}\n**Owned By:** ${user ? `<@${user.userId}>` : "None"}`,
          })
          .setImage("attachment://card.png"),
      ],
    });
  },
};
