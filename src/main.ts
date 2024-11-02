console.log("Press Control+C to stop the bot");

// IMPORTS
import dotenv from 'dotenv';
dotenv.config();
import fs from 'node:fs';
import path from 'node:path';
import { Client, Collection, Events, GatewayIntentBits, Routes, REST } from 'discord.js';

// ENVIROMENT VARS
if (!fs.existsSync(".env")){
    console.error("[ERROR] No .env file is in the directory. Please add one");
    process.exit();
};
const botToken = process.env.DISCORD_TOKEN;
if (botToken == undefined){
    console.error("[ERROR] The \"DISCORD_TOKEN\" wasn't found in the .env file.\nIt can be added with: \"DISCORD_TOKEN=mytokenhere\"");
    process.exit();
};

// CREATE CLIENT & LOG IN
const client: any = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, (readyClient: any) => {
	console.log(`[INFO] Logged in as ${readyClient.user.tag}`);
    
    // REGISTER COMMANDS
    const rest = new REST().setToken(botToken);
    
    (async () => {
        try {
            console.log(`[INFO] Started refreshing ${commandsArray.length} application (/) commands.`);
            const data: any = await rest.put(
                Routes.applicationCommands(readyClient.user.id),
                { body: commandsArray },
            );
    
            console.log(`[INFO] Successfully reloaded ${data.length} application (/) commands.`);
        } catch (error) {
            console.error(`[ERROR] ${error}`);
        };
    })();
});

console.log("[INFO] Logging in");
client.login(botToken);

// CLIENT FUNCTIONS
function writeFile(filename: string, data: string, parseJson: boolean=true) {
    var lockFilename = `${filename}_lock`;
    var folderOnlyFilename = filename.substring(0, filename.lastIndexOf("/"));
    if (!fs.existsSync(folderOnlyFilename)){
        fs.mkdirSync(folderOnlyFilename, { recursive: true });
    };
    if (!fs.existsSync(lockFilename)){
        fs.writeFileSync(lockFilename, "");
        if (parseJson) {data = JSON.stringify(data);};
        fs.writeFileSync(filename, data);
        fs.unlinkSync(lockFilename);
        return true;
    };
    return false;
};
  
function readFile(filename: string, parseJson: boolean=true) {
    var lockFilename = `${filename}_lock`;
    if (!fs.existsSync(lockFilename)){
        fs.writeFileSync(lockFilename, "");
        var fileF = fs.readFileSync(filename).toString();
        if (parseJson){fileF = JSON.parse(fileF);};
        fs.unlinkSync(lockFilename);
        return fileF;
    };
    return null;
};

client.writeFile = writeFile;
client.readFile = readFile;

// IMPORT COMMANDS
var commands: Collection<String, any> = new Collection();
var commandsArray : string[] = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
            console.log(`[INFO] ${command.data.name} command was imported from ${filePath}`);
			commands.set(command.data.name, command);
			commandsArray.push(command.data.toJSON());
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		};
	};
};

// RECEIVE COMMANDS
client.on(Events.InteractionCreate, async (interaction: any) => {
    try {
        if (interaction.isChatInputCommand()){
            const command: any = commands.get(interaction.commandName);

            if (!command) {
                console.error(`No command matching ${interaction.commandName} was found.`);
                return;
            };
            await command.execute(interaction);
            return;
        };
        if (interaction.isModalSubmit()){
            for (var i = 0; i < commandsArray.length; i++){
                var commandData: any = commandsArray[i];
                var commandFull: any = commands.get(commandData.name);
                var commandFunc: any = Object.keys(commandFull).includes(interaction.customId);
                if (commandFunc){
                    await commandFull[interaction.customId](interaction);
                    break;
                };
            };
        };
    } catch (error) {
        console.error(error);
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
        try {
            var repliedTo = await message.fetchReference();
        } catch {
            return;
        };
        if (repliedTo.member.id == client.user.id && repliedTo.type == 20){ // 20 being the ChatInputCommand (Slash Command)
            var commandReplyFunc = commands.get(repliedTo.interaction.commandName.split(" ")[0])?.commandReplyReceived;
            if (commandReplyFunc){
                await commandReplyFunc(message, repliedTo);
            };
        };
    } catch (error) {
        console.error(error);
        if (message.replied || message.deferred) {
            await message.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
        } else {
            await message.reply({ content: 'There was an error while executing this command!', ephemeral: true });
        };
    };
});