// IMPORTS
import { logoPrint } from './logoPrint';
logoPrint();
import dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, Routes, REST } from 'discord.js';
import { BOLD_RED_FOREGROUND, RESET_STYLE, Log } from './lib';

Log.prototype.log("Press Control+C to stop the bot");

// ENVIROMENT VARS
if (!fs.existsSync(".env")){
    Log.prototype.error(`No .env file is in the directory. Please add one`);
    process.exit();
};
const botToken = process.env.DISCORD_TOKEN;
if (botToken == undefined){
    Log.prototype.error(`The \"DISCORD_TOKEN\" wasn't found in the .env file.\nIt can be added with: \"DISCORD_TOKEN=mytokenhere\"`);
    process.exit();
};

// CREATE CLIENT & LOG IN
const client: any = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, (readyClient: any) => {
	Log.prototype.log(`Logged in as ${readyClient.user.tag}`);
    
    // REGISTER COMMANDS
    const rest = new REST().setToken(botToken);
    
    (async () => {
        try {
            Log.prototype.log(`Started refreshing ${commandsArray.length} application (/) commands.`);
            const data: any = await rest.put(
                Routes.applicationCommands(readyClient.user.id),
                { body: commandsArray },
            );
    
            Log.prototype.log(`Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            Log.prototype.error(`${error}`);
        };
    })();
});

Log.prototype.log("Logging in");
client.login(botToken);

// IMPORT COMMANDS
let commands: Collection<String, any> = new Collection();
let commandsArray : string[] = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
            Log.prototype.log(`"${command.data.name}" command was imported from ${filePath}`);
			commands.set(command.data.name, command);
			commandsArray.push(command.data.toJSON());
		} else {
			Log.prototype.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		};
	};
};

// RECEIVE COMMANDS
client.on(Events.InteractionCreate, async (interaction: any) => {
    try {
        if (interaction.isChatInputCommand()){
            const command: any = commands.get(interaction.commandName);

            if (!command) {
                Log.prototype.error(`No command matching ${interaction.commandName} was found.`);
                return;
            };
            await command.execute(interaction);
            return;
        };
        if (interaction.isModalSubmit()){
            for (let i = 0; i < commandsArray.length; i++){
                const commandData: any = commandsArray[i];
                const commandFull: any = commands.get(commandData.name);
                const commandFunc: any = Object.keys(commandFull).includes(interaction.customId);
                if (commandFunc){
                    await commandFull[interaction.customId](interaction);
                    break;
                };
            };
        };
    } catch (error) {
        Log.prototype.error(`${error}`);
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        };
    };
    return;
});

// MESSAGE REPLY EVENT RESPONSE
client.on(Events.MessageCreate, async (message: any) => {
    try {
        let repliedTo;
        try {
            repliedTo = await message.fetchReference();
        } catch (error: any){
            if (error.code === "MessageReferenceMissing"){
                return;
            }
            Log.prototype.error(`${error}`);
        }
        if (repliedTo.member.id == client.user.id && repliedTo.type == 20){ // 20 being the ChatInputCommand (Slash Command)
            const commandReplyFunc = commands.get(repliedTo.interaction.commandName.split(" ")[0])?.commandReplyReceived;
            if (commandReplyFunc){
                await commandReplyFunc(message, repliedTo);
            };
        };
    } catch (error) {
        Log.prototype.error(`${error}`);
        if (message.replied || message.deferred) {
            await message.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        };
    };
});