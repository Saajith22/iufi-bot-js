import ExtendedClient from "./ExtendedClient.js";
import "dotenv/config";

const client = new ExtendedClient({
  intents: ["Guilds", "GuildMembers", "MessageContent", "GuildMessages"],
});

export default client;
client.login(process.env.token);
