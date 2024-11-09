import { SlashCommandBuilder, User } from 'discord.js';
import { canIslandNameBeUsed, checkIfIslandExists, getIslandLocation, readFile, Log } from '../../lib';
import fs from 'node:fs';
import path from 'node:path';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('bal')
		.setDescription('Get balance of you or another user')
        .addStringOption((option:any) => option.setName("island").setDescription("Island to get from (If none all will be shown)").setRequired(false))
        .addUserOption((option:any) => option.setName("user").setDescription("User to get balance of (If none you will be used)").setRequired(false)),
	async execute(interaction: any) {
        const user: User = (interaction.options.getUser("user") || interaction.user);
        let islands: string[] = [];
        const foldersPath = path.join(__dirname, `../../../data/users/${user.id}`);
        let reply: string = "";
        if (interaction.options.getString("island") == undefined){
            islands = fs.readdirSync(foldersPath).filter((file: string) => file.endsWith('.json'));
        } else {
            if (!checkIfIslandExists(user.id, interaction.options.getString("island"))){
                await interaction.reply("Island doesn't exist");
                return;
            };
            islands.push(interaction.options.getString("island") + ".json");
        };
        
        for (const island of islands) {
            const islandPath = path.join(foldersPath, island);
            const islandData = readFile(islandPath, true);
            reply = `${reply}${island.replace(".json", "")}: $${(islandData.balance || 0.00)}\n`;
        };
        await interaction.reply(reply);
	},
};