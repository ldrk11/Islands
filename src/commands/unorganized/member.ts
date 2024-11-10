import { SlashCommandBuilder, TextInputBuilder, ModalBuilder, ActionRowBuilder, EmbedBuilder } from 'discord.js';
import { getIslandLocation, checkIfIslandExists, getMemberIndex, readFile, writeFile, Island } from '../../lib';

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
        .addSubcommand((group: any) => group
            .setName("view").setDescription("View a member on your island")
            .addStringOption((group: any) => group
                .setName("island").setDescription("Island name for information").setRequired(true)
            )
            .addStringOption((group: any) => group
                .setName("name").setDescription("Member name").setRequired(true)
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
                let island: Island = new Island();
                if (!island.getDataByInteraction(interaction)){ interaction.reply("Island doesn't exist."); return; };
                if ((island.data.members || []).length == 0){
                    await interaction.reply("No members on your island!");
                } else {
                    let reply = "";
                    island.data.members.forEach((member: any, index: any) => {
                        reply = `${reply}Name: ${member.name} \n`;
                    });
                    await interaction.reply(reply);
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
                let island: Island = new Island();
                if (!island.getDataByInteraction(interaction)){ interaction.reply("Island doesn't exist."); return; };
                let memberIndex = island.getMemberIndex(interaction.options.getString("name"));
                if (!(memberIndex == undefined)){
                    island.data.members.splice(memberIndex, 1);
                    island.save();
                    await interaction.reply("Member removed");
                    return;
                };
                await interaction.reply("Member doesn't exist.");
            } else if (subCommand == "view"){
                let islandName = interaction.options.getString("island");
                let memberName = interaction.options.getString("name");
                let island: Island = new Island();
                if (!island.getDataByInteraction(interaction)) { await interaction.reply("Island doesn't exist"); return; };
                const memberIndex = island.getMemberIndex(memberName);
                if (memberIndex == undefined) { await interaction.reply("Member doesn't exist"); return; };
                let embed = new EmbedBuilder()
                    .setTitle(memberName)
                    .addFields(
                        {
                        name: "colour",
                        value: island.data.members[memberIndex].colour,
                        inline: false
                        },
                    )
                    .setColor(island.data.members[memberIndex].colour)
                    .setFooter({
                        text: islandName,
                    });
                if (island.data.members[memberIndex].imageUrl) { embed.setThumbnail(island.data.members[memberIndex].imageUrl) };
                await interaction.reply({embeds: [embed]});
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
        let island: Island = new Island();
        if (!island.getDataByNameAndMemberId(interaction.user.id, islandName)){ await interaction.reply("Island doesn't exist."); return; };
        if (!island.getMemberIndex(memberNew.name) === undefined) { await interaction.reply("Member already exists."); return; };
        if (island.data.members == undefined){ island.data.members = []; };
        island.data.members.push(memberNew);
        island.save()
        await interaction.reply("New member added to island!");
    },
    async commandReplyReceived(reply: any, replyTo: any){
        if (reply.member.id == replyTo.interaction.user.id){
            const commandSplit = replyTo.interaction.commandName.split(" ");
            if (commandSplit[0] == "member" &&commandSplit[1] == "edit" && commandSplit[2] == "image"){
                const memberImage = reply?.attachments.at(0);
                // Time limit to respond
                const maxTimeToRespondMs = 5 * 60 * 1000; // 5 minutes in milliseconds
                let dateNow = new Date();
                let timeDifference = dateNow.getTime() - replyTo.createdAt.getTime();
                if (timeDifference >= maxTimeToRespondMs) { return; }
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
                    let island: Island = new Island();
                    if (!island.getDataByNameAndMemberId(reply.member.id, islandName)){ reply.reply("Island doesn't exist."); return; };
                    let memberIndex: any = island.getMemberIndex(memberName);
                    if (!(memberIndex == undefined)) {
                        island.data.members[memberIndex].imageUrl = memberImage.url;
                        island.save();
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