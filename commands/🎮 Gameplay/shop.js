import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ComponentType,
  Message,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
} from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "shop",
  description: "Brings up the IUFI shop.",
  aliases: ["s"],
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    const user = await client.getData(message.author.id);

    const rolls = [
      {
        name: "Rare",
        price: 30,
      },
      {
        name: "Epic",
        price: 100,
      },
      {
        name: "Legendary",
        price: 250,
      },
    ];

    const select = new StringSelectMenuBuilder().setCustomId("shop");
    const mapped = rolls.map((r) => {
      select.addOptions({
        label: `${client.conversions[r.name.toLowerCase()]} ${r.name} Roll`,
        value: r.name,
      });

      return `${
        client.conversions[r.name.toLowerCase()]
      } ${r.name.toUpperCase()} ROLL${" ".repeat(
        21 - r.name.length + 3 - r.price.toString().length
      )}${r.price} 🍬`;
    });

    const row = new ActionRowBuilder().addComponents(select);
    const balance = user?.balance || 0;
    const msg = await message.reply({
      components: [row],
      embeds: [
        client
          .createEmbed({
            title: "🛒 IUFI Shop",
            description: `🍬 Starcandies: \`${balance}\`\n${client.blocker(
              mapped.join("\n")
            )}`,
          })
          .setImage("attachment://card.png"),
      ],
    });

    const collector = msg.createMessageComponentCollector({
      filter: (i) => i.user.id === message.author.id,
      idle: 10000,
      componentType: ComponentType.StringSelect,
    });

    collector.on("collect", async (i) => {
      const name = i.values[0];

      const modal = new ModalBuilder()
        .setTitle("Enter your quantity")
        .setCustomId("amount-modal")
        .setComponents(
          new ActionRowBuilder().setComponents(
            new TextInputBuilder()
              .setCustomId("amount")
              .setLabel("Quantity")
              .setPlaceholder("Enter a number E.g. 10")
              .setRequired(true)
              .setStyle("Short")
          )
        );

      await i.showModal(modal);
      const amount = await i
        .awaitModalSubmit({
          filter: (i) => i.user.id === message.author.id,
          time: 15000,
        })
        .catch((e) => null);

      if (amount) {
        const amt = amount.fields.getField("amount").value;
        const namt = Number(amt);
        if (isNaN(namt))
          return await amount.reply({
            content: "Please provide a number.",
            ephemeral: true,
          });

        const find = rolls.find((r) => r.name === name);
        const total = find.price * namt;

        if (balance < total)
          return await amount.reply({
            content: `You don't have enough candies! You only have \`${balance}\` candies`,
            ephemeral: true,
          });

        const inventory = user?.inventory || [];
        const old = inventory.find((e) => e.name === name.toLowerCase());
        if (old) old.amount += namt;
        else
          inventory.push({
            name: name.toLowerCase(),
            amount: namt,
          });

        await client.db.collection("users").updateOne(
          {
            userId: message.author.id,
          },
          {
            $set: {
              balance: balance - total,
              inventory,
            },
          },
          {
            upsert: true,
          }
        );

        await amount.reply({
          embeds: [
            client.createEmbed({
              title: "🛒 Shop Purchase",
              description: client.blocker(
                `${
                  client.conversions[name.toLowerCase()]
                } + ${amt}\n🍬 - ${total}`
              ),
            }),
          ],
        });
      }
    });
  },
};
