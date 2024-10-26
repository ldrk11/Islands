const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start your island'),
	async execute(interaction) {
        console.log("hi")
		await interaction.reply(`implement this...`);
	},
};
