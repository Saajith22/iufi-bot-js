import {
  ActionRowBuilder,
  ButtonBuilder,
  Message,
  ModalBuilder,
  TextInputBuilder,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";
import quiz from "../../data/quiz.json" assert { type: "json" };

export default {
  name: "quiz",
  description: "IUFI Quiz.",
  aliases: ["q"],
  cooldown: 10 * 60 * 1000,
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const questions = [];
    const getRand = () => {
      const r = quiz[Math.floor(Math.random() * quiz.length)];
      if (questions.find((q) => q.question === r.question)) return getRand();
      else return r;
    };

    for (let i = 0; i < 5; i++) {
      const random = getRand();
      questions.push(random);
    }

    const start = Date.now();
    const time = 2 * 60 * 1000;

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("answer")
        .setLabel("Answer")
        .setStyle("Success"),
      new ButtonBuilder()
        .setCustomId("skip")
        .setLabel("Skip")
        .setStyle("Danger")
    );

    let cs = Date.now();
    let curr = 0;
    let t = 20000;

    const makeEmbed = () =>
      client
        .createEmbed({
          title: `Question ${curr + 1} out of 5`,
          description: `Answer Time: ${client.timer(
            cs + t
          )}\nBest Record: None (5.3s)\n${client.blocker(
            questions[curr].question
          )}`,
        })
        .setImage(questions[curr].scene)
        .setFooter({
          text: "0% Correct | 0% Wrong",
        });

    const msg = await message.reply({
      content: `**This game ends ${client.timer(start + time)}**`,
      components: [row],
      embeds: [makeEmbed()],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      time,
    });

    const next = async () => {
      if (curr === 4) return collector.stop();
      else {
        curr++;
        setTimeout(async () => {
          if (collector.ended) return;

          cs = Date.now();
          await msg.edit({
            embeds: [makeEmbed()],
          });
        }, 3000);
      }
    };

    const answers = new Array(5).fill(undefined);
    const times = new Array(5).fill(0);

    collector.on("collect", async (i) => {
      if (Date.now() > cs + t) {
        await i.reply({
          ephemeral: true,
          content: "Time Up. Moving to next question in `3 seconds`.",
        });

        return await next();
      }

      if (i.customId === "answer") {
        const modal = new ModalBuilder()
          .setCustomId("answer-modal")
          .setTitle("Answer")
          .setComponents(
            new ActionRowBuilder().setComponents(
              new TextInputBuilder()
                .setCustomId("answer-text")
                .setLabel("Enter your answer here:")
                .setRequired(true)
                .setStyle("Short")
            )
          );

        await i.showModal(modal);

        try {
          const answered = await i.awaitModalSubmit({
            filter: (i) => i.user.id === message.author.id,
            time: t,
          });

          const ans = answered.fields.getField("answer-text").value;
          const { answer } = questions[curr];
          const isCorrect =
            ans?.toLowerCase() === questions[curr].answer.toLowerCase();

          await answered.reply({
            ephemeral: true,
            content: isCorrect
              ? "Correct Answer! Next question coming in `3 seconds`."
              : `Wrong Answer! The correct answer is **${answer}**. Let's move to the next question coming in \`3 seconds\``,
          });

          if (isCorrect) answers[curr] = true;
          else answers[curr] = false;

          times[curr] = client.ms(cs + t - Date.now()).seconds;
          await next();
        } catch (e) {}
      } else {
        await i.reply({
          content: "Skipping to next question in `3 seconds`.",
          ephemeral: true,
        });

        await next();
      }
    });

    collector.on("end", async (i) => {
      const avgTime = times.reduce((prev, curr) => prev + curr) / times.length;
      const points = answers.reduce((prev, curr) => {
        return curr === false
          ? prev - 1
          : curr === true
          ? prev + 1
          : prev - 0.5;
      }, 0);

      const data = await client.getData(message.author.id);
      if (!data || !data.points) data.points = points;
      else data.points += points;

      await client.db.collection("users").updateOne(
        {
          userId: message.author.id,
        },
        {
          $set: {
            points: data.points,
            averageTime: avgTime,
          },
        },
        {
          upsert: true,
        }
      );

      await msg.edit({
        content: "This game has expired.",
        components: [],
        embeds: [
          client.createEmbed({
            title: "Quiz Result",
            description: `${client.blocker(
              answers
                .map((a) =>
                  a === false ? "❌" : a === undefined ? "⬛" : "✅"
                )
                .join(" ")
            )}\n${client.blocker(
              `🕔 Time Used: ${client.ms(start).format}\n🕘 Avg Time:  ${
                avgTime / 10
              }s ${avgTime > data.averageTime ? "🔺" : "🔻"}\n🔥 Points:    ${
                data.points
              } (${points})`
            )}`,
          }),
        ],
      });
    });
  },
};
