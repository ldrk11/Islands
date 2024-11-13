import { SlashCommandBuilder, User } from 'discord.js';
import { Island } from '../../lib';
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
            if (!Island.checkIfIslandExists(user.id, interaction.options.getString("island"))){
                await interaction.reply("Island doesn't exist");
                return;
            };
            islands.push(interaction.options.getString("island") + ".json");
        };
        
        for (const islandName of islands) {
            const islandPath = path.join(foldersPath, islandName);
            let island: Island = new Island();
            island.getDataByLocation(islandPath);
            reply = `${reply}${island.name}: $${(island.data.balance || 0.00)}\n`;
        };
        await interaction.reply(reply);
	},
};