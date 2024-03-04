import { ActionRowBuilder, ButtonBuilder, Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import fs from "fs";

export default {
  name: "help",
  description: "Displays the list of all commands sorted to their categories.",
  aliases: ["h"],
  usage: "[command_name]",
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const arg = args[0];
    if (arg) {
      const larg = arg.toLowerCase();
      const findArg = client.commands.find(
        (c) => c.name === larg || c.aliases.includes(larg)
      );

      return await message.reply({
        embeds: [client.argError(findArg.name)],
      });
    }

    const categories = fs.readdirSync("./commands");
    const final = categories.map((c) => {
      const cmds = client.commands
        .filter((cmd) => cmd.category === c)
        .map((cmd) => `${process.env.prefix}${cmd.name}`);

      return {
        name: `${c}: [${cmds.length}]`,
        value: client.blocker(`${cmds.join(", ")}`),
      };
    });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("Beginner Guide")
        .setStyle("Link")
        .setEmoji("📗")
        .setURL(
          "https://docs.google.com/document/d/1VAD20wZQ56S_wDeMJlwIKn_jImIPuxh2lgy1fn17z0c/edit"
        )
    );

    await message.reply({
      components: [row],
      embeds: [
        client
          .createEmbed({
            title: "🌼 Welcome to IUFI!",
          })
          .addFields(final)
          .setThumbnail(client.user.avatarURL()),
      ],
    });
  },
};
