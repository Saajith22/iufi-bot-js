import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ComponentType,
  Message,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import Canvas from "canvas";

export default {
  name: "roll",
  description: "IUFI Matching Game",
  usage: "[roll]",
  aliases: ["r"],
  cooldown: 10 * 60 * 1000,
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const rarity = args[0];
    if (rarity) {
      const lower = rarity.toLowerCase();
      const available = ["legendary", "epic", "rare"];
      if (!available.includes(lower))
        return await message.reply(
          `Unknown Roll! Please use one of ${available
            .map((e) => `\`${e}\``)
            .join(", ")}`
        );

      const data = await client.getData(message.author.id);
      const rIndex = data.inventory.findIndex((r) => r.name === lower);
      const getRoll = data.inventory[rIndex];
      if (!data || !getRoll || getRoll.amount < 1)
        return await message.reply(
          `You've used up all your \`${lower}\` rolls for now.`
        );

      getRoll.amount--;
      await client.db.collection("users").updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            inventory: data.inventory,
          },
        }
      );
    }

    const pot = await client.db
      .collection("cooldown")
      .findOne({ userId: message.author.id });

    const neededPot = pot && pot.cooldowns.find((p) => p.name === "luck");
    const inc = neededPot ? neededPot.level + 3 : 1;

    const dropChances = {
      rare: 50000,
      epic: 3000,
      legendary: 800,
      mystic: 100,
      celestial: 5,
    };

    const canvas = Canvas.createCanvas(620, 355);
    const ctx = canvas.getContext("2d");
    const row = new ActionRowBuilder();
    const width = 198;
    const roll = [];

    const randomPos = Math.floor(Math.random() * 3);

    for (let i = 0; i < 3; i++) {
      let type = "common";
      if (i === randomPos && rarity) type = rarity;
      else {
        const random = Math.floor(Math.random() * 1000000);
        const find = Object.entries(dropChances).find(
          ([_, v]) => random <= v * inc
        );
        if (find) type = find[0];
      }

      const filtered = await Promise.all(
        [...client.cards.filter((c) => c.type === type).values()].filter(
          async (card) => {
            const { id } = card;
            const users = await client.db.collection("users").find().toArray();
            return users.find((user) => user.cards.find((c) => c.id === id));
          }
        )
      );

      if (type !== "common") console.log("WOW", type);
      const randomCard = filtered[Math.floor(Math.random() * filtered.length)];
      const image = await Canvas.loadImage(randomCard.url);

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(i.toString())
          .setEmoji(client.conversions[type])
          .setStyle("Primary")
      );

      const x = i * width + i * 12;
      ctx.save();
      ctx.roundRect(x, 0, width, canvas.height, 10);
      ctx.clip();
      ctx.drawImage(image, x, 0, width, canvas.height);
      ctx.restore();

      roll.push(randomCard);
    }

    const time = 60000;
    const msg = await message.channel.send({
      content: `${
        message.author
      } **This is your roll!** (Ends: in <t:${Math.floor(
        (Date.now() + time) / 1000
      )}:R>)`,
      files: [
        new AttachmentBuilder().setName("roll.png").setFile(canvas.toBuffer()),
      ],
      components: [row],
    });

    const users = [];
    const collector = msg.createMessageComponentCollector({
      filter: async (i) => {
        if (users.includes(i.user.id))
          await i.reply({
            content: "Oops! You have already claimed a card in this roll",
            ephemeral: true,
          });

        return !users.includes(i.user.id);
      },
      time,
      max: 3,
      componentType: ComponentType.Button,
    });

    collector.on("collect", async (i) => {
      await i.deferUpdate();
      users.push(i.user.id);

      const n = Number(i.customId);
      const card = roll[n];
      const stars = Math.floor(Math.random() * 5) + 1;
      await msg.reply(
        `${i.user} has claimed \` ${n + 1} | 🆔 ${card.id} | ${
          client.conversions[card.type]
        } | ⭐ ${stars} \``
      );

      await client.addCard(message.author.id, {
        ...card,
        stars,
      });

      row.components
        .find((cm) => cm.data.custom_id === i.customId)
        .setDisabled(true);
      await msg.edit({
        components: [row],
      });
    });

    collector.on("end", async () => {
      await msg.edit({
        content: `🕟 _This roll has expired_`,
      });
    });
  },
};
