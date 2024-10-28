var { SlashCommandBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('member')
        .setDescription("Manage island members")
        .addSubcommand((group: any) => group
            .setName("add").setDescription("Add new member to your island")
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
        if (sub_command == "list"){
            var island_name = interaction.options.getString("island")
            var island_json_location = `./data/users/${interaction.user.id}/${island_name}.json`
            var island_info = interaction.client.read_f(island_json_location, true)
            var island_members = island_info?.members ?? []
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
        } else if (sub_command == "add"){
            var island_name_input = new TextInputBuilder()
                .setLabel("Island")
                .setRequired(true)
                .setCustomId("member_add_island_name")
                .setStyle(1)
                .setMaxLength(20)

            var name_input = new TextInputBuilder()
                .setLabel("Name")
                .setRequired(true)
                .setCustomId("member_add_name")
                .setStyle(1)
                .setMaxLength(50)

            var colour_input = new TextInputBuilder()
                .setLabel("Colour (Hex Code)")
                .setRequired(true)
                .setCustomId("member_add_colour")
                .setStyle(1)
                .setMaxLength(7)
                .setValue("#ffffff")

            var island_name_input_action_row = new ActionRowBuilder().addComponents(island_name_input)
            var colour_input_action_row = new ActionRowBuilder().addComponents(colour_input)
            var name_input_action_row = new ActionRowBuilder().addComponents(name_input)

            var modal = new ModalBuilder()
                .setCustomId("member_add_modal")
                .setTitle("Add new Member")
                .addComponents(island_name_input_action_row, name_input_action_row, colour_input_action_row)

            await interaction.showModal(modal);
        }
	},
    async member_add_modal(interaction: any){
        var member_new = {
            name: interaction.fields.getTextInputValue("member_add_name"),
            colour: interaction.fields.getTextInputValue("member_add_colour")
        };

        var island_name = interaction.fields.getTextInputValue("member_add_island_name")
        var island_json_location = `./data/users/${interaction.user.id}/${island_name}.json`
        var island_info = interaction.client.read_f(island_json_location, true)
        if (island_info.members == undefined){island_info.members = []}
        island_info.members.push(member_new)
        interaction.client.write_f(island_json_location, island_info, true)
        await interaction.reply("New member added to island!")
    }
};
