console.log("Press Control+C to stop the bot")

require('dotenv').config()

const { Client, Events, GatewayIntentBits } = require('discord.js');
const bot_token = process.env.DISCORD_TOKEN

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.once(Events.ClientReady, readyClient => {
	console.log(`Logged in as ${readyClient.user.tag}`);
});

console.log("Logging in")
client.login(bot_token);