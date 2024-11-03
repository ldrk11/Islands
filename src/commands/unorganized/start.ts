import { SlashCommandBuilder } from 'discord.js';

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
        interaction.client.writeFile(`./data/users/${interaction.user.id}/${islandName}.json`, {}, true);
		await interaction.reply(`${islandName} was created!`);
	},
};
