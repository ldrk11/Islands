var {SlashCommandBuilder} = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('member')
        .setDescription("Manage island members")
        .addSubcommand((group: any) => group
            .setName("add").setDescription("Add new member to your island")
            .addStringOption((group: any) => group
                .setName("island").setDescription("Island name for information").setRequired(true)
            )
        )
        .addSubcommand((group: any) => group
            .setName("remove").setDescription("Remove a member from your island")
            .addStringOption((group: any) => group
                .setName("island").setDescription("Island name for information").setRequired(true)
            )
        )
        .addSubcommand((group: any) => group
            .setName("list").setDescription("List all members on your island")
            .addStringOption((group: any) => group
                .setName("island").setDescription("Island name for information").setRequired(true)
            )
        ),
	async execute(interaction: any) {
        var sub_command = interaction.options.getSubcommand()
        var island_name = interaction.options.getString("island")
        var island_json_location = `./data/users/${interaction.user.id}/${island_name}.json`
        var island_info = interaction.client.read_f(island_json_location, true)
        var island_members = island_info?.members ?? []
        if (sub_command == "list"){
            if (island_members.length == 0){
		        await interaction.reply("No members on your island!");
            } else {
                var member_list = ""
                for (var i = 0; i < island_members.length; i++){
                    var member = island_members[i]
                    member_list = member_list + `Name: ${member.name} \n`
                }
		        await interaction.reply(member_list);
            }
        } else {
            await interaction.reply("oops didnt add this yet")
        }
	},
};
