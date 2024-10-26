const {SlashCommandBuilder} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('start')
		.setDescription('Start your island'),
	async execute(interaction) {
        interaction.client.write_f("./data/users/test.txt", "hello")
		await interaction.reply(interaction.client.read_f("./data/users/test.txt"));
	},
};
