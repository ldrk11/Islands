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
        var subCommand = interaction.options.getSubcommand();
        var subCommandGroup = interaction.options.getSubcommandGroup();
        if (subCommandGroup == null){
            if (subCommand == "list"){
                let islandJsonLocation = getIslandLocation(interaction);
                var islandInfo = interaction.client.readFile(islandJsonLocation, true);
                var islandMembers = islandInfo?.members ?? [];
                if (islandMembers.length == 0){
                    await interaction.reply("No members on your island!");
                } else {
                    var memberList = ""
                    for (var i = 0; i < islandMembers.length; i++){
                        var member = islandMembers[i];
                        memberList = memberList + `Name: ${member.name} \n`;
                    };
                    await interaction.reply(memberList);
                };
            } else if (subCommand == "add"){
                var islandNameInput = new TextInputBuilder()
                    .setLabel("Island")
                    .setRequired(true)
                    .setCustomId("memberAddIslandName")
                    .setStyle(1)
                    .setMaxLength(20);

                var nameInput = new TextInputBuilder()
                    .setLabel("Name")
                    .setRequired(true)
                    .setCustomId("memberAddName")
                    .setStyle(1)
                    .setMaxLength(50);

                var colourInput = new TextInputBuilder()
                    .setLabel("Colour (Hex Code)")
                    .setRequired(true)
                    .setCustomId("memberAddColour")
                    .setStyle(1)
                    .setMaxLength(7)
                    .setValue("#ffffff");

                var islandNameInputActionRow: any = new ActionRowBuilder().addComponents(islandNameInput);
                var colourInputActionRow: any = new ActionRowBuilder().addComponents(colourInput);
                var nameInputActionRow: any = new ActionRowBuilder().addComponents(nameInput);

                var modal = new ModalBuilder()
                    .setCustomId("memberAddModal")
                    .setTitle("Add new Member")
                    .addComponents(islandNameInputActionRow, nameInputActionRow, colourInputActionRow);

                await interaction.showModal(modal);
            } else if (subCommand == "remove"){
                var memberName = interaction.options.getString("name");
                let islandJsonLocation = getIslandLocation(interaction);
                var islandInfo = interaction.client.readFile(islandJsonLocation, true);
                var i = 0;
                for (member of islandInfo.members || []){
                    if (member.name == memberName){
                        islandInfo.members.splice(i, 1);
                        interaction.client.writeFile(islandJsonLocation, islandInfo, true);
                        await interaction.reply("Member removed");
                        return;
                    };
                    i++;
                };
                await interaction.reply("Couldnt find that member");
            };
        } else if (subCommandGroup == "edit"){
            if (subCommand == "image"){
                var islandName = interaction.options.getString("island");
                var memberName = interaction.options.getString("name");
                await interaction.reply(`Reply to this message with the image you want to use for ${memberName} on ${islandName}`); // CHANGING THIS WILL BREAK "member edit image" COMMAND
            };
        };
	},
    async memberAddModal(interaction: any){
        var memberNew = {
            name: interaction.fields.getTextInputValue("memberAddName"),
            colour: interaction.fields.getTextInputValue("memberAddColour")
        };
        var islandName = interaction.fields.getTextInputValue("memberAddIslandName");
        let islandJsonLocation = getIslandLocation(interaction.user.id, islandName);
        var islandInfo = interaction.client.readFile(islandJsonLocation, true);
        if (islandInfo.members == undefined){islandInfo.members = [];};
        islandInfo.members.push(memberNew);
        interaction.client.writeFile(islandJsonLocation, islandInfo, true);
        await interaction.reply("New member added to island!");
    },
    async commandReplyReceived(reply: any, replyTo: any){
        if (reply.member.id == replyTo.interaction.user.id){
            var commandSplit = replyTo.interaction.commandName.split(" ");
            if (commandSplit[0] == "member" &&commandSplit[1] == "edit" && commandSplit[2] == "image"){
                var memberImage = reply?.attachments.at(0);
                if (memberImage == undefined){
                    await reply.reply("No attachment was added"); return;
                };
                if (memberImage.contentType.startsWith("image/")){
                    var originalMessageSplit = replyTo.content.split(" ");             // THIS RELIES ON THE TEXT FOR CHANGING THE IMAGE NOT TO BE CHANGED
                    var memberName = "";                                                //
                    for (var i = 12; !(originalMessageSplit[i] == "on"); i++){         //
                        if (i == 12){                                                    //
                            memberName = originalMessageSplit[i];                     //
                        } else {                                                         //
                            memberName = `${memberName} ${originalMessageSplit[i]}`; //
                        };                                                               //
                    };                                                                   //
                    var islandName = "";                                                //
                    for (var i = 14; i < originalMessageSplit.length; i++){            //
                        if (i == 14){                                                    //
                            islandName = originalMessageSplit[i];                     //
                        } else {                                                         //
                            islandName = `${islandName} ${originalMessageSplit[i]}`; //
                        };                                                               //
                    };                                                                   //
                    let islandJsonLocation = getIslandLocation(reply.member.id, islandName);
                    var islandInfo = reply.client.readFile(islandJsonLocation, true);
                    var memberIndex = undefined;
                    for (var i = 0; i < islandInfo.members.length; i++){
                        var member = islandInfo.members[i];
                        if (member.name == memberName){
                            memberIndex = i;
                            break;
                        };
                    };
                    if (memberIndex == undefined) {await reply.reply("No member with that name"); return;};
                    islandInfo.members[memberIndex].imageUrl = memberImage.url;
                    reply.client.writeFile(islandJsonLocation, islandInfo, true);
                    await reply.reply("Image added!");
                } else {
                    await reply.reply("The attachment must be an image and be the first attachment"); return;
                };
            };
        };
        return;
    }
};