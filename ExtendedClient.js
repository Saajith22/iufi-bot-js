import { createCanvas, loadImage } from "canvas";
import chalk from "chalk";
import { Client, Collection, EmbedBuilder } from "discord.js";
import { readdirSync } from "fs";
import { MongoClient } from "mongodb";

export default class ExtendedClient extends Client {
  /**
   *
   * @param {import("discord.js").ClientOptions} options
   */
  constructor(options) {
    super(options);

    this.cards = new Collection();
    this.commands = new Collection();
    this.local_sep = () => console.log(chalk.black.bold("-".repeat(30)));
    this.blocker = (s) => `\`\`\`${s}\`\`\``;
    this.timer = (t) => `<t:${Math.floor(t / 1000)}:R>`;
    this.spacer = (s, n, r) =>
      r ? `${" ".repeat(n - s.length)}${s}` : `${s}${" ".repeat(n - s.length)}`;

    this.title = (change) => change.charAt(0).toUpperCase() + change.slice(1);
    this.ms = (t) => {
      const time = (Math.abs(t - Date.now()) / 60000).toFixed(2);
      const mapper = (arr) => arr.map((n) => Number(n));
      let [minutes, seconds] = mapper(time.split("."));
      const conv = seconds / 60;
      if (conv >= 1) {
        const spcov = mapper(conv.toFixed(2).split("."));
        minutes = spcov[0] + minutes;
        seconds = spcov[1];
      }

      return {
        minutes,
        seconds,
        format: `${minutes}m ${seconds}s`,
      };
    };

    this.conversions = {
      common: "🥬",
      rare: "🌸",
      epic: "💎",
      legendary: "👑",
      mystic: "🦄",
      cellestial: "💫",
    };

    this.frameConv = {
      signed: "✍️",
      lovepoem: "💠",
      hearts: "💕",
      uaena: "💌",
      cheer: "🎤",
      smoon: "🍓",
      dandelions: "🌷",
      celebrity: "🌟",
      shine: "✨",
    };

    this.ranks = {
      milk: {
        icon: "🥛",
        range: [0, 30],
      },
      bronze: {
        icon: "🥉",
        range: [30, 80],
      },
      silver: {
        icon: "🥈",
        range: [80, 130],
      },
      gold: {
        icon: "🥇",
        range: [130, 160],
      },
      platinum: {
        icon: "💠",
        range: [160, 190],
      },
      diamond: {
        icon: "💎",
        range: [190, 220],
      },
      master: {
        icon: "🎖",
        range: [220, 250],
      },
      challenger: {
        icon: "🏆",
        range: [250, 500],
      },
    };

    const mongo = new MongoClient(process.env.mongoUrl);
    mongo
      .connect()
      .then(() => console.log(chalk.yellow.bgBlack("CONNECTED TO MONGODB")));

    this.db = mongo.db("Choco");

    //handler
    this.loadCommands();
  }

  //database
  async getData(userId) {
    return await this.db.collection("users").findOne({
      userId,
    });
  }

  getLevel(xp) {
    let start = 0;
    let level = 0;

    const XP = xp || 0;
    while (XP >= start) {
      start += 100 + 10 * level;
      level += 1;
    }

    return { start, level };
  }

  async drawFrame(image, fname, ctx, x, y, w, h) {
    const frname = Object.entries(this.frameConv).find(
      ([_, v]) => v === fname
    )[0];
    const frame = await loadImage(`./frames/${frname}.png`);
    const padding = 7;

    ctx.save();
    ctx.roundRect(x + padding, y + padding, w - padding, h - padding, 10);
    ctx.clip();
    ctx.drawImage(image, x + padding, y + padding, w - padding, h - padding);
    ctx.restore();

    ctx.save();
    ctx.drawImage(frame, x, y, w, h);
    ctx.restore();

    return ctx;
  }

  async framer(framePath, card) {
    const padding = 7;
    const canvas = createCanvas(360 + padding, 640 + padding);
    const ctx = canvas.getContext("2d");
    const image = await loadImage(framePath);
    const main = await loadImage(card.url);

    ctx.roundRect(0, 0, canvas.width, canvas.height, 35);
    ctx.clip();
    ctx.drawImage(
      main,
      padding,
      padding,
      canvas.width - padding - 15,
      canvas.height - padding * 2
    );

    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas;
  }

  async changeBalance(userId, amount, remove) {
    await this.db.collection("users").updateOne(
      {
        userId,
      },
      {
        $inc: {
          balance: remove ? -amount : amount,
        },
      }
    );
  }

  async giveXP(userId, amount) {
    await this.db.collection("users").updateOne(
      {
        userId,
      },
      {
        $inc: {
          xp: amount,
        },
      }
    );
  }

  async addCard(userId, data) {
    const user = await this.getData(userId);
    const users = this.db.collection("users");
    const baseData = {
      userId,
      balance: 0,
      level: 0,
      main: null,
      cardMatch: [],
      inventory: [],
      cards: [data],
    };

    if (!user) return await users.insertOne(baseData);
    else {
      user.cards.push(data);
      await users.updateOne(
        {
          userId,
        },
        {
          $set: {
            ...user,
          },
        }
      );
    }
  }

  async removeCard(userId, cardId) {
    const user = await this.getData(userId);
    const card = user.cards.findIndex(
      (c) => parseInt(c.id) === parseInt(cardId)
    );

    if (card < 0) return;
    user.cards.splice(card, 1);
    await this.db.collection("users").updateOne(
      {
        userId,
      },
      {
        $set: {
          cards: user.cards,
        },
      }
    );
  }

  createEmbed({ title, description, color }) {
    return new EmbedBuilder()
      .setTitle(title || null)
      .setDescription(description || null)
      .setColor(color || "Random");
  }

  argError(commandName, arg) {
    const cmd = this.commands.get(commandName);
    const init = `${process.env.prefix}${cmd.name} `;

    const embed = this.createEmbed({
      title: "Usage:",
      description: this.blocker(`${init}${cmd.usage || ""}`),
      color: "Green",
    })
      .addFields([
        {
          name: "Aliases",
          value:
            cmd.aliases.length > 0
              ? cmd.aliases
                  .map((a) => `\`${process.env.prefix}${a}\``)
                  .join(", ")
              : "None",
        },
        {
          name: "Description",
          value: cmd.description,
        },
      ])
      .setFooter({
        text: "More Help: Ask the staff!",
        iconURL: this.user.avatarURL(),
      });

    if (arg) {
      const split = cmd.usage.split(" ");
      const curr = split.findIndex((s) => s.includes(arg));
      const before = split.slice(0, curr);

      embed.setTitle("Correct Usage:");
      embed.setDescription(
        this.blocker(
          `${init}${cmd.usage || ""}\n${" ".repeat(
            init.length + before.join(" ").length + before.length + 1
          )}${"^".repeat(arg.length)}`
        )
      );
    }

    return embed;
  }

  async loadEvents() {
    await Promise.all(
      readdirSync("./events").map(async (e) => {
        console.log(
          chalk.yellow.bold(`Loaded event - ${e.replace(".js", "")}`)
        );

        await import(`./events/${e}`);
      })
    );

    this.local_sep();
  }

  async loadCommands() {
    this.local_sep();

    await Promise.all(
      readdirSync("./commands").map(async (dir) => {
        return await Promise.all(
          readdirSync(`./commands/${dir}`).map(async (f) => {
            const file = (await import(`./commands/${dir}/${f}`)).default;
            if (!file.aliases) file.aliases = [];
            file.category = dir;

            this.commands.set(file.name, file);
            console.log(chalk.blue.bold(`Loaded Command - ${file.name}`));
          })
        );
      })
    );

    this.local_sep();
    await this.loadEvents();
  }
}
