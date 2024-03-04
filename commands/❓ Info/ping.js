import { Message } from "discord.js";
import ExtendedClient from "../../ExtendedClient.js";

export default {
  name: "ping",
  description: "Displays the bot's latency.",
  /**
   *
   * @param {ExtendedClient} client
   * @param {Message} message
   * @param {String[]} args
   */
  run: async (client, message, args) => {
    await message.reply({
      content: `Pong! ${client.ws.ping}ms.`,
    });
  },
};
