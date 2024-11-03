import { SlashCommandBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder } from 'discord.js';
import { getIslandLocation, checkIfIslandExists, getMemberIndex } from '../../lib';

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
        const subCommand = interaction.options.getSubcommand();
        const subCommandGroup = interaction.options.getSubcommandGroup();
        if (subCommandGroup == null){
            if (subCommand == "list"){
                if (checkIfIslandExists(interaction) == false){ interaction.reply("Island doesn't exist."); return; };
                let islandJsonLocation = getIslandLocation(interaction);
                let islandInfo = interaction.client.readFile(islandJsonLocation, true);
                let islandMembers = islandInfo?.members ?? [];
                if (islandMembers.length == 0){
                    await interaction.reply("No members on your island!");
                } else {
                    let memberList = ""
                    for (let i = 0; i < islandMembers.length; i++){
                        let member = islandMembers[i];
                        memberList = memberList + `Name: ${member.name} \n`;
                    };
                    await interaction.reply(memberList);
                };
            } else if (subCommand == "add"){
                const islandNameInput = new TextInputBuilder()
                    .setLabel("Island")
                    .setRequired(true)
                    .setCustomId("memberAddIslandName")
                    .setStyle(1)
                    .setMaxLength(20);

                const nameInput = new TextInputBuilder()
                    .setLabel("Name")
                    .setRequired(true)
                    .setCustomId("memberAddName")
                    .setStyle(1)
                    .setMaxLength(50);

                const colourInput = new TextInputBuilder()
                    .setLabel("Colour (Hex Code)")
                    .setRequired(true)
                    .setCustomId("memberAddColour")
                    .setStyle(1)
                    .setMaxLength(7)
                    .setValue("#ffffff");

                const islandNameInputActionRow: any = new ActionRowBuilder().addComponents(islandNameInput);
                const colourInputActionRow: any = new ActionRowBuilder().addComponents(colourInput);
                const nameInputActionRow: any = new ActionRowBuilder().addComponents(nameInput);

                const modal = new ModalBuilder()
                    .setCustomId("memberAddModal")
                    .setTitle("Add new Member")
                    .addComponents(islandNameInputActionRow, nameInputActionRow, colourInputActionRow);

                await interaction.showModal(modal);
            } else if (subCommand == "remove"){
                let memberName = interaction.options.getString("name");
                if (checkIfIslandExists(interaction) == false){ interaction.reply("Island doesn't exist."); return; };
                let islandJsonLocation = getIslandLocation(interaction);
                let islandInfo = interaction.client.readFile(islandJsonLocation, true);
                let memberIndex = getMemberIndex(islandInfo, memberName);
                if (!(memberIndex == undefined)){
                    islandInfo.members.splice(memberIndex, 1);
                    interaction.client.writeFile(islandJsonLocation, islandInfo, true);
                    await interaction.reply("Member removed");
                    return;
                };
                await interaction.reply("Member doesn't exist.");
            };
        } else if (subCommandGroup == "edit"){
            if (subCommand == "image"){
                let islandName = interaction.options.getString("island");
                let memberName = interaction.options.getString("name");
                await interaction.reply(`Reply to this message with the image you want to use for ${memberName} on ${islandName}`); // CHANGING THIS WILL BREAK "member edit image" COMMAND
            };
        };
	},
    async memberAddModal(interaction: any){
        let memberNew = {
            name: interaction.fields.getTextInputValue("memberAddName"),
            colour: interaction.fields.getTextInputValue("memberAddColour")
        };
        let islandName = interaction.fields.getTextInputValue("memberAddIslandName");
        if (checkIfIslandExists(interaction.user.id, islandName) == false){ interaction.reply("Island doesn't exist."); return; };
        let islandJsonLocation = getIslandLocation(interaction.user.id, islandName);
        let islandInfo = interaction.client.readFile(islandJsonLocation, true);
        if (islandInfo.members == undefined){islandInfo.members = [];};
        islandInfo.members.push(memberNew);
        interaction.client.writeFile(islandJsonLocation, islandInfo, true);
        await interaction.reply("New member added to island!");
    },
    async commandReplyReceived(reply: any, replyTo: any){
        if (reply.member.id == replyTo.interaction.user.id){
            const commandSplit = replyTo.interaction.commandName.split(" ");
            if (commandSplit[0] == "member" &&commandSplit[1] == "edit" && commandSplit[2] == "image"){
                const memberImage = reply?.attachments.at(0);
                if (memberImage == undefined){
                    await reply.reply("No attachment was added"); return;
                };
                if (memberImage.contentType.startsWith("image/")){
                    const originalMessageSplit = replyTo.content.split(" "); // THIS RELIES ON THE TEXT FOR CHANGING THE IMAGE NOT TO BE CHANGED
                    let memberName = "";
                    for (let i = 12; !(originalMessageSplit[i] == "on"); i++){
                        if (i == 12){
                            memberName = originalMessageSplit[i];
                        } else {
                            memberName = `${memberName} ${originalMessageSplit[i]}`;
                        };
                    };
                    let islandName = "";                                             
                    for (let i = 14; i < originalMessageSplit.length; i++){          
                        if (i == 14){                                                
                            islandName = originalMessageSplit[i];                    
                        } else {                                                     
                            islandName = `${islandName} ${originalMessageSplit[i]}`; 
                        };                                                           
                    };                                                               
                    if (checkIfIslandExists(reply.member.id, islandName) == false){ reply.reply("Island doesn't exist."); return; };
                    let islandJsonLocation = getIslandLocation(reply.member.id, islandName);
                    let islandInfo = reply.client.readFile(islandJsonLocation, true);
                    let memberIndex: any = getMemberIndex(islandInfo, memberName);
                    if (!(memberIndex == undefined)) {                     
                        islandInfo.members[memberIndex].imageUrl = memberImage.url;
                        reply.client.writeFile(islandJsonLocation, islandInfo, true);
                        await reply.reply("Image added!");
                        return;
                    };
                    await reply.reply("Member doesn't exist."); 
                } else {
                    await reply.reply("The attachment must be an image and be the first attachment"); return;
                };
            };
        };
        return;
    }
};