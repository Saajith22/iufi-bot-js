import client from "../index.js";
import fs from "fs";

client.on("messageCreate", async (message) => {
  if (message.content.startsWith(process.env.prefix)) {
    const args = message.content.split(" ");
    const command = args.shift().replace(process.env.prefix, "");
    const cmd =
      client.commands.get(command) ||
      client.commands.find((cmd) => cmd.aliases.includes(command));

    if (cmd) {
      if (cmd.name !== "verify") {
        const verified = await client.db.collection("verify").findOne({
          userId: message.author.id,
        });

        if (!verified)
          return await message.reply(
            "## You are not verified. Please use `qverify` to get verified."
          );
      }

      const blacklist = await client.db.collection("blacklist").findOne({
        userId: message.author.id,
      });

      if (blacklist)
        return await message.reply(
          "## You are blacklisted and can not use the bot."
        );

      const adminCommands = fs
        .readdirSync("./commands/Admin")
        .map((c) => c.replace(".js", ""));

      if (adminCommands.includes(cmd.name))
        if (!message.member.permissions.has("Administrator")) return;

      const db = client.db.collection("cooldown");
      const initData = {
        userId: message.author.id,
      };

      if (cmd.cooldown) {
        const data = await db.findOne(initData);
        const speed = data?.cooldowns?.find((p) => p.name === "speed");
        if (speed) {
          cmd.cooldown = 2 * speed.level * 60 * 1000;
        }

        const setterData = {
          name: cmd.name,
          time: Date.now() + cmd.cooldown,
        };

        if (data) {
          const cd = data.cooldowns.findIndex((c) => c.name === cmd.name);
          if (cd > -1) {
            const cooldown = data.cooldowns[cd];
            if (Date.now() <= cooldown.time)
              return await message.reply(
                `You can use this command again <t:${Math.floor(
                  cooldown.time / 1000
                )}:R>`
              );
            else {
              data.cooldowns.splice(cd, 1);
              if (cmd.name === "daily")
                data.streakReset = Date.now() + 24 * 60 * 60 * 1000;

              await db.updateOne(initData, {
                $set: {
                  cooldowns: data.cooldowns,
                },
              });
            }
          } else {
            await db.updateOne(initData, {
              $set: {
                cooldowns: [...data.cooldowns, setterData],
              },
            });
          }
        } else {
          await db.insertOne({
            ...initData,
            cooldowns: [setterData],
          });
        }
      }

      await client.giveXP(message.author.id, 10);
      await cmd.run(client, message, args);
    }
  }
});
