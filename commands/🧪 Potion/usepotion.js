import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "usepotion",
  description: "Use a potion on the user.",
  usage: "<potion_name> <level>",
  aliases: ["up"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const name = args[0];
    if (!name)
      return await message.reply({
        embeds: [client.argError("usepotion", "potion_name")],
      });

    const level = args[1];
    if (!level)
      return await message.reply({
        embeds: [client.argError("usepotion", "level")],
      });

    if (level > 3 || level < 1)
      return await message.reply("Level must be `1`, `2`, or `3`");

    const user = await client.getData(message.author.id);
    if (!user) return await message.reply("You don't have this potion.");

    const pot = user.potions.findIndex(
      (p) => p.name === name.toLowerCase() && p.level === Number(level)
    );
    if (pot < 0) return await message.reply("You don't have this potion.");

    const pott = user.potions[pot];
    const cooldowns = await client.db
      .collection("cooldown")
      .findOne({ userId: message.author.id });

    if (cooldowns && cooldowns.find((c) => c.name === pott.name))
      return await message.reply(
        "You already have a potion of this type active."
      );

    user.potions.splice(pot, 1);
    await client.db.collection("users").updateOne(
      {
        userId: message.author.id,
      },
      {
        $set: {
          potions: user.potions,
        },
      }
    );

    const time = Date.now() + 30 * 60 * 1000;
    await client.db.collection("cooldown").updateOne(
      {
        userId: message.author.id,
      },
      {
        $push: {
          cooldowns: {
            name: pott.name,
            level: pott.level,
            time,
          },
        },
      }
    );

    await message.reply(
      `You have used a ${name.toLowerCase()} potion. It will expire in ${client.timer(
        time
      )}`
    );
  },
};
