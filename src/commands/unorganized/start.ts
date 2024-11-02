import { SlashCommandBuilder } from 'discord.js';

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start your island')
        .addStringOption((option:any) => option.setName("name").setDescription("Enter the name of your new island!").setRequired(true)),
	async execute(interaction: any) {
        var island_name = interaction.options.getString("name");
        if (island_name.length > 20){
		    await interaction.reply("Island name can't be more than 20 characters");
            return;
        }
        if (island_name.includes("/") || island_name.includes("\\") || island_name.includes(".")){
            await interaction.reply("Island name can't contain any of the following characters: / \\ .");
            return;
        }
        interaction.client.write_f(`./data/users/${interaction.user.id}/${island_name}.json`, {}, true);
		await interaction.reply(`${island_name} was created!`);
	},
};
