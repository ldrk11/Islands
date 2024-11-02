import { SlashCommandBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder } from 'discord.js';
import { getIslandLocation } from '../../getIslandLocation';

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
            .addStringOption((group: any) => group
                .setName("name").setDescription("Name of member to remove").setRequired(true)
            )
        )
        .addSubcommand((group: any) => group
            .setName("list").setDescription("List all members on your island")
            .addStringOption((group: any) => group
                .setName("island").setDescription("Island name for information").setRequired(true)
            )
        )
        .addSubcommandGroup((group: any) => group
            .setName("edit").setDescription("Edit a member on your island")
            .addSubcommand((group: any) => group
                .setName("image").setDescription("Edit image of member")
                .addStringOption((group: any) => group
                    .setName("island").setDescription("Island name for information").setRequired(true)
                )
                .addStringOption((group: any) => group
                    .setName("name").setDescription("Name of member to set image for").setRequired(true)
                )
            )
        ),
	async execute(interaction: any) {
        var sub_command = interaction.options.getSubcommand();
        var sub_command_group = interaction.options.getSubcommandGroup();
        if (sub_command_group == null){
            if (sub_command == "list"){
                let island_json_location = getIslandLocation(interaction);
                var island_info = interaction.client.read_f(island_json_location, true);
                var island_members = island_info?.members ?? [];
                if (island_members.length == 0){
                    await interaction.reply("No members on your island!");
                } else {
                    var member_list = ""
                    for (var i = 0; i < island_members.length; i++){
                        var member = island_members[i];
                        member_list = member_list + `Name: ${member.name} \n`;
                    };
                    await interaction.reply(member_list);
                };
            } else if (sub_command == "add"){
                var island_name_input = new TextInputBuilder()
                    .setLabel("Island")
                    .setRequired(true)
                    .setCustomId("member_add_island_name")
                    .setStyle(1)
                    .setMaxLength(20);

                var name_input = new TextInputBuilder()
                    .setLabel("Name")
                    .setRequired(true)
                    .setCustomId("member_add_name")
                    .setStyle(1)
                    .setMaxLength(50);

                var colour_input = new TextInputBuilder()
                    .setLabel("Colour (Hex Code)")
                    .setRequired(true)
                    .setCustomId("member_add_colour")
                    .setStyle(1)
                    .setMaxLength(7)
                    .setValue("#ffffff");

                var island_name_input_action_row: any = new ActionRowBuilder().addComponents(island_name_input);
                var colour_input_action_row: any = new ActionRowBuilder().addComponents(colour_input);
                var name_input_action_row: any = new ActionRowBuilder().addComponents(name_input);

                var modal = new ModalBuilder()
                    .setCustomId("member_add_modal")
                    .setTitle("Add new Member")
                    .addComponents(island_name_input_action_row, name_input_action_row, colour_input_action_row);

                await interaction.showModal(modal);
            } else if (sub_command == "remove"){
                var member_name = interaction.options.getString("name");
                let island_json_location = getIslandLocation(interaction);
                var island_info = interaction.client.read_f(island_json_location, true);
                var i = 0;
                for (member of island_info.members || []){
                    if (member.name == member_name){
                        island_info.members.splice(i, 1);
                        interaction.client.write_f(island_json_location, island_info, true);
                        await interaction.reply("Member removed");
                        return;
                    };
                    i++;
                };
                await interaction.reply("Couldnt find that member");
            };
        } else if (sub_command_group == "edit"){
            if (sub_command == "image"){
                var island_name = interaction.options.getString("island");
                var member_name = interaction.options.getString("name");
                await interaction.reply(`Reply to this message with the image you want to use for ${member_name} on ${island_name}`); // CHANGING THIS WILL BREAK "member edit image" COMMAND
            };
        };
	},
    async member_add_modal(interaction: any){
        var member_new = {
            name: interaction.fields.getTextInputValue("member_add_name"),
            colour: interaction.fields.getTextInputValue("member_add_colour")
        };
        var island_name = interaction.fields.getTextInputValue("member_add_island_name");
        let island_json_location = getIslandLocation(interaction.user.id, island_name);
        var island_info = interaction.client.read_f(island_json_location, true);
        if (island_info.members == undefined){island_info.members = [];};
        island_info.members.push(member_new);
        interaction.client.write_f(island_json_location, island_info, true);
        await interaction.reply("New member added to island!");
    },
    async command_reply_received(reply: any, replyTo: any){
        if (reply.member.id == replyTo.interaction.user.id){
            var command_split = replyTo.interaction.commandName.split(" ");
            if (command_split[0] == "member" &&command_split[1] == "edit" && command_split[2] == "image"){
                var member_image = reply?.attachments.at(0);
                if (member_image == undefined){
                    await reply.reply("No attachment was added"); return;
                };
                if (member_image.contentType.startsWith("image/")){
                    var original_message_split = replyTo.content.split(" ");             // THIS RELIES ON THE TEXT FOR CHANGING THE IMAGE NOT TO BE CHANGED
                    var member_name = "";                                                //
                    for (var i = 12; !(original_message_split[i] == "on"); i++){         //
                        if (i == 12){                                                    //
                            member_name = original_message_split[i];                     //
                        } else {                                                         //
                            member_name = `${member_name} ${original_message_split[i]}`; //
                        };                                                               //
                    };                                                                   //
                    var island_name = "";                                                //
                    for (var i = 14; i < original_message_split.length; i++){            //
                        if (i == 14){                                                    //
                            island_name = original_message_split[i];                     //
                        } else {                                                         //
                            island_name = `${island_name} ${original_message_split[i]}`; //
                        };                                                               //
                    };                                                                   //
                    let island_json_location = getIslandLocation(reply.member.id, island_name);
                    var island_info = reply.client.read_f(island_json_location, true);
                    var member_index = undefined;
                    for (var i = 0; i < island_info.members.length; i++){
                        var member = island_info.members[i];
                        if (member.name == member_name){
                            member_index = i;
                            break;
                        };
                    };
                    if (member_index == undefined) {await reply.reply("No member with that name"); return;};
                    island_info.members[member_index].image_url = member_image.url;
                    reply.client.write_f(island_json_location, island_info, true);
                    await reply.reply("Image added!");
                } else {
                    await reply.reply("The attachment must be an image and be the first attachment"); return;
                };
            };
        };
        return;
    }
};