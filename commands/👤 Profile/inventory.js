import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "inventory",
  description: "Shows the items that you own.",
  aliases: ["in"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const user = await client.getData(message.author.id);
    if (!user)
      return await message.reply("Your inventory is empty at the moment!");

    await message.reply({
      embeds: [
        client
          .createEmbed({
            title: `🎒 ${message.member.displayName}'s Inventory`,
            description: client.blocker(
              `🍬 Starcandies        x${user.balance}\n${user.inventory
                ?.map((i) => {
                  const modify = `${
                    i.name.charAt(0).toUpperCase() + i.name.slice(1)
                  } Rolls`;

                  return `${client.conversions[i.name]} ${modify}${" ".repeat(
                    19 - modify.length
                  )}x${i.amount}`;
                })
                .join("\n")}\n\n\n🍶 Potions:\n${user.potions
                .map(
                  (p) =>
                    `${client.spacer(
                      `${client.title(p.name)} ${"I".repeat(p.level)} Potion`,
                      21
                    )} x${p.amount}`
                )
                .join("\n")}`
            ),
          })
          .setThumbnail(message.author.avatarURL()),
      ],
    });
  },
};
