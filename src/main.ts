console.log("Press Control+C to stop the bot")

// IMPORTS
require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, Routes, REST, Intents } = require('discord.js');

// ENVIROMENT VARS
if (!fs.existsSync(".env")){
    console.error("[ERROR] No .env file is in the directory. Please add one");
    process.exit();
}
const bot_token = process.env.DISCORD_TOKEN
const client_id = process.env.CLIENT_ID
if (client_id == undefined || bot_token == undefined){
    console.error("[ERROR] The \"DISCORD_TOKEN\" or \"CLIENT_ID\" wasn't found in the .env file.\nIt can be added with: \"DISCORD_TOKEN=mytokenhere\"");
    process.exit();
}

// CREATE CLIENT & LOG IN
const client = new Client({intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
]});

client.once(Events.ClientReady, (readyClient: any) => {
	console.log(`[INFO] Logged in as ${readyClient.user.tag}`);
});

console.log("[INFO] Logging in")
client.login(bot_token);

// CLIENT FUNCTIONS
function write_f(filename: string, data: string, parse_json: boolean=true) {
    var lock_filename = `${filename}_lock`;
    var folder_only_filename = filename.substring(0, filename.lastIndexOf("/"));
    if (!fs.existsSync(folder_only_filename)){
        fs.mkdirSync(folder_only_filename, { recursive: true });
    }
    if (!fs.existsSync(lock_filename)){
        fs.writeFileSync(lock_filename, "");
        if (parse_json) { data = JSON.stringify(data)}
        fs.writeFileSync(filename, data);
        fs.unlinkSync(lock_filename);
        return true;
    }
    return false;
}
  
function read_f(filename: string, parse_json: boolean=true) {
    var lock_filename = `${filename}_lock`;
    if (!fs.existsSync(lock_filename)){
        fs.writeFileSync(lock_filename, "");
        var file_f = fs.readFileSync(filename).toString();
        if (parse_json){ file_f = JSON.parse(file_f); }
        fs.unlinkSync(lock_filename);
        return file_f;
    }
    return null;
}

client.write_f = write_f
client.read_f = read_f

// IMPORT COMMANDS
var commands = new Collection();
var commands_array : string[] = [];

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath)

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter((file: string) => file.endsWith('.js'));
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
client.on(Events.InteractionCreate, async (interaction: any) => {
	if (interaction.isChatInputCommand()){
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
        return;
    };
    if (interaction.isModalSubmit()){
        for (var i = 0; i < commands_array.length; i++){
            var command_data: any = commands_array[i];
            var command_full: any = commands.get(command_data.name);
            var command_func: any = Object.keys(command_full).includes(interaction.customId)
            if (command_func){
                command_full[interaction.customId](interaction)
                break;
            }
        }
    };
    return;
});

// MESSAGE REPLY EVENT RESPONSE
client.on(Events.MessageCreate, async (message: any) => {
    try {
        var repliedTo = await message.fetchReference()
    } catch {
        return;
    }
    if (repliedTo.member.id == client.user.id && repliedTo.type == 20){ // 20 being the ChatInputCommand (Slash Command)
        var command_reply_func = commands.get(repliedTo.interaction.commandName.split(" ")[0])?.command_reply_received
        if (command_reply_func){
            command_reply_func(message, repliedTo)
        }
    }
})