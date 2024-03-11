import { AttachmentBuilder, Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import { Captcha } from "captcha-canvas";

export default {
  name: "verify",
  description: "Verify yourself to use the bot.",
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const db = client.db.collection("verify");
    const data = await db.findOne({
      userId: message.author.id,
    });

    if (data) return message.reply("You are already verified.");

    const captcha = new Captcha();
    captcha.drawCaptcha();

    const attach = new AttachmentBuilder(await captcha.png).setName(
      "captcha.png"
    );

    const time = 30000;
    await message.reply({
      files: [attach],
      embeds: [
        client
          .createEmbed({
            title: "Verification Captcha",
            description: `Type the text in the image.\nTime ends ${client.timer(
              Date.now() + time
            )}`,
          })
          .setImage("attachment://captcha.png"),
      ],
    });

    const collector = message.channel.createMessageCollector({
      filter: (m) => m.author.id === message.author.id,
      max: 1,
      time,
    });

    collector.on("collect", async (m) => {
      console.log(m.content, captcha.text);
      if (m.content.trim() !== captcha.text)
        await message.reply("Invalid Captcha. Please try again later.");

      await db.insertOne({
        userId: message.author.id,
      });

      await m.reply("Successfully Verified.");
    });
  },
};
