import { SlashCommandBuilder } from 'discord.js';
import { checkIfIslandExists, getIslandLocation, writeFile } from '../../lib';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start your island')
        .addStringOption((option:any) => option.setName("name").setDescription("Enter the name of your new island!").setRequired(true)),
	async execute(interaction: any) {
        const islandName = interaction.options.getString("name");
        if (islandName.length > 20){
		    await interaction.reply("Island name can't be more than 20 characters");
            return;
        }
        if (islandName.includes("/") || islandName.includes("\\") || islandName.includes(".")){
            await interaction.reply("Island name can't contain any of the following characters: / \\ .");
            return;
        }
        if (checkIfIslandExists(interaction)){
            await interaction.reply("Island already exists.");
            return;
        };
        writeFile(getIslandLocation(interaction), {}, true);
		await interaction.reply(`${islandName} was created!`);
	},
};
