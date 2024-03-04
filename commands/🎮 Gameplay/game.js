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
  name: "game",
  description: "IUFI Matching Game",
  usage: "<level>",
  aliases: ["mg"],
  cooldown: 60 * 60 * 1000,
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const levelArg = args[0];
    if (!levelArg)
      return await message.reply({
        embeds: [client.argError("game", "level")],
      });

    const level = Number(levelArg);
    if (![1, 2, 3].includes(level))
      return await message.reply(
        "Invalid level selection! Please select a valid level: `1, 2, 3`"
      );

    const rower = (arr) =>
      new ActionRowBuilder().addComponents(
        arr.map((n) => {
          return new ButtonBuilder()
            .setCustomId(`${n}`)
            .setLabel(n.toString())
            .setStyle("Secondary");
        })
      );

    const cards = [...client.cards.values()];
    const gameConfig = {
      1: {
        rewards: [
          [1, "⚔️ Exp", 15],
          [2, "🍬 Candies", 5],
          [3, "🍬 Candies", 10],
        ],
        time: 2 * 60 * 1000,
        size: [3, 2],
        imageSize: [400, 710],
        clicks: 8,
      },
      2: {
        rewards: [
          [1, "⚔️ Exp", 15],
          [2, "🍬 Candies", 5],
          [4, "🍬 Candies", 10],
          [5, "⚡ Speed II Potion", 1],
          [6, "🍬 Candies", 15],
        ],
        time: 4 * 60 * 1000,
        size: [4, 3],
        imageSize: [295, 465],
        clicks: 16,
      },
      3: {
        rewards: [
          [1, "⚔️ Exp", 20],
          [2, "🍬 Candies", 10],
          [4, "🍬 Candies", 15],
          [6, "🍀 Luck II Potion", 1],
          [8, "🍬 Candies", 20],
          [9, "🍀 Luck III Potion", 1],
          [10, "🍬 Candies", 100],
        ],
        time: 6 * 60 * 1000,
        size: [5, 4],
        imageSize: [230, 340],
        clicks: 26,
      },
    };

    const config = gameConfig[level];
    const random = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const noCards = config.size[0] * config.size[1];
    const randomCards = [...new Array(noCards / 2)].map(() => random(cards));

    const spots = [...new Array(noCards)].map((_, i) => i + 1);
    const layout = randomCards.map(() => {
      const sps = [];
      for (let i = 0; i < 2; i++) {
        const ran = random(spots);
        sps.push(ran);
        spots.splice(
          spots.findIndex((n) => n === ran),
          1
        );
      }

      return sps;
    });

    const [width, height] = config.imageSize;
    const canvas = Canvas.createCanvas(1250, 1450);
    const ctx = canvas.getContext("2d");
    const rows = [];

    const makeBoard = async (visibles, init) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < config.size[1]; i++) {
        const row = [];
        for (let j = 0; j < config.size[0]; j++) {
          if (init) row.push(j + i * (2 + level * 1) + 1);

          const spot = (2 + level * 1) * i + j + 1;
          const radius = 35;
          let [x, y] = [
            j * width + (j % config.size[0] !== 0 ? j * 25 : 0),
            i * (height + 28),
          ];

          if (!visibles.includes(spot)) {
            // ctx.save();
            ctx.beginPath();
            ctx.roundRect(x, y, width, height, radius);
            ctx.fillStyle = "#623d9c";
            ctx.fill();
            ctx.closePath();

            //border
            const spa = 30;
            ctx.beginPath();
            ctx.roundRect(
              x + spa,
              y + spa,
              width - spa * 2,
              height - spa * 2,
              radius
            );
            ctx.strokeStyle = "white";
            ctx.lineWidth = 15;
            ctx.stroke();
            ctx.closePath();
          } else {
            const find = randomCards[layout.findIndex((l) => l.includes(spot))];
            const img = await Canvas.loadImage(find.url).catch((e) => null);
            if (!img) return;

            ctx.save();
            ctx.roundRect(x, y, width, height, radius);
            ctx.clip();
            ctx.drawImage(img, x, y, width, height);
            ctx.restore();
          }
        }

        if (init) rows.push(rower(row));
      }
    };

    const time = config.time;
    let clicks = config.clicks;
    let matched = 0;
    const view = [];

    await makeBoard(view, true);

    const makeEmbed = (color) =>
      client
        .createEmbed({
          description: client.blocker(
            `⚔️ Level:          ${level}\n👆 Click left:     ${clicks}\n🃏 Card Matched:   ${matched}`
          ),
          color: color || "Random",
        })
        .setImage("attachment://game.png");

    const makeAttach = () =>
      new AttachmentBuilder().setName("game.png").setFile(canvas.toBuffer());

    const embed = makeEmbed();
    const color = embed.data.color;

    const start = Date.now();
    const msg = await message.channel.send({
      content: `**This game ends <t:${Math.floor((start + time) / 1000)}:R>**`,
      components: rows,
      files: [makeAttach()],
      embeds: [embed],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time,
      max: clicks,
      componentType: ComponentType.Button,
    });

    let finds = [];
    collector.on("collect", async (i) => {
      await i.deferUpdate();
      clicks -= 1;

      const spot = Number(i.customId);
      finds.push(spot);

      const findButton = (n) => {
        const nn = config.size[0];
        let rn = Math.floor(n % nn === 0 ? (n - 1) / nn : n / nn);
        return rows[rn].components.find(
          (c) => c.data.custom_id === n.toString()
        );
      };

      const button = findButton(spot);
      button.setDisabled(true);

      await makeBoard([...finds, ...view]);

      await msg.edit({
        files: [makeAttach()],
        embeds: [makeEmbed(color)],
        components: rows,
      });

      if (finds.length === 2) {
        const initial = finds[0];
        const other = layout
          .find((l) => l.includes(spot))
          .find((l) => l !== spot);

        if (other === initial) {
          view.push(...finds);
          matched += 1;
        } else {
          const initialButton = findButton(initial);
          initialButton.setDisabled(false);

          const currentButton = findButton(spot);
          currentButton.setDisabled(false);
        }

        finds = [];
        await makeBoard(view);

        setTimeout(async () => {
          await msg.edit({
            files: [makeAttach()],
            embeds: [makeEmbed(color)],
            components: rows,
          });
        }, 2000);
      }
    });

    collector.on("end", async (c, r) => {
      setTimeout(async () => {
        await msg.edit({
          content: "This game has expired.",
        });

        const data = (await client.getData(message.author.id)) || {};
        const info = {
          time: Date.now() - start,
          matches: matched,
        };

        const mappedRewards = await Promise.all(
          config.rewards.map(async ([need, rwd, amt]) => {
            const got = matched >= need;
            if (got) {
              if (rwd.includes("Exp")) client.giveXP(message.author.id, amt);
              else if (rwd.includes("Candies"))
                client.changeBalance(message.author.id, amt);
              else {
                const details = rwd.toLowerCase().split(" ");
                const potion = details[1];
                const level = details[2].length;

                const potDetails = {
                  name: potion,
                  level: Number(level),
                  amount: amt,
                };

                if (data.potions) {
                  const getPot = data.potions.find(
                    (p) => p.name === potion && p.level === potDetails.level
                  );
                  if (getPot) getPot.amount++;
                  else data.potions.push(potDetails);
                } else data.potions = [potDetails];
              }
            }

            return `${got ? "✅" : "⬛"}  ${need}     ${rwd}${" ".repeat(
              18 - rwd.length
            )}x${amt}`;
          })
        );

        if (data.games) data.games[level] = info;
        else
          data.games = {
            [level]: info,
          };

        await client.db.collection("users").updateOne(
          {
            userId: message.author.id,
          },
          {
            $set: {
              ...data,
            },
          },
          {
            upsert: true,
          }
        );

        await message.reply({
          content: message.author.toString(),
          embeds: [
            client.createEmbed({
              title: "Game Ended (Rewards)",
              description:
                client.blocker(
                  `🕔 Time Used:    ${
                    client.ms(start).format
                  }\n🃏 Matched:      ${matched}`
                ) +
                "\n\n" +
                client.blocker(
                  `    Pairs  Rewards\n${mappedRewards.join("\n")}`
                ),
            }),
          ],
        });
      }, 5000);
    });
  },
};
