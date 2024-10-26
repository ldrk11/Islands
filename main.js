console.log("Press Control+C to stop the bot")

// IMPORTS
require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Routes, REST } = require('discord.js');

// ENVIROMENT VARS
const bot_token = process.env.DISCORD_TOKEN
const client_id = process.env.CLIENT_ID

// CREATE CLIENT & LOG IN
const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.once(Events.ClientReady, readyClient => {
	console.log(`[INFO] Logged in as ${readyClient.user.tag}`);
});

console.log("[INFO] Logging in")
client.login(bot_token);

// IMPORT COMMANDS
var commands = new Collection();
var commands_array = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
            console.log(`[INFO] ${command.data.name} command was imported from ${filePath}`)
			commands.set(command.data.name, command);
			commands_array.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

// REGISTER COMMANDS
const rest = new REST().setToken(bot_token);

(async () => {
	try {
		console.log(`[INFO] Started refreshing ${commands_array.length} application (/) commands.`);
		const data = await rest.put(
			Routes.applicationCommands(client_id),
			{ body: commands_array },
		);

		console.log(`[INFO] Successfully reloaded ${data.length} application (/) commands.`);
	} catch (error) {
		console.error(error);
	}
})();

// RECEIVE COMMANDS
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});