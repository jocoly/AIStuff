import {} from "dotenv/config";
import {Client, Events, GatewayIntentBits} from 'discord.js';

// models

import {turbo} from "./commands/turbo.js";

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

export var queue = [];

const CONTAIN_BOT = process.env.CONTAIN_BOT === 'true';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const SD_TURBO = process.env.SD_TURBO === 'true';

let isReply, refMsg, isCommand, isMention;

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

client.on(Events.MessageCreate, async msg => {
    let msgContent = msg.content;
    let msgAuthorId = msg.author.id;

    if(msgAuthorId === botUserId && msg.content.substring(0,1) !== ('!')) return;
    if(CONTAIN_BOT && msg.channel.id !== DISCORD_CHANNEL_ID) return;

    // all bot commands start with '!'
    isCommand = Array.from(msgContent)[0] === '!' || Array.from(msgContent)[0];
    // ignore messages that start with a tag of a user
    isMention = Array.from(msgContent)[0] === '<';
    // if unable to find referenced message, returns an error and sets isReply to false
    try{
        refMsg = await msg.fetchReference();
        isReply = true;
        try{
            let refMsgAuthorId = refMsg.author.id;
        } catch (error) {
            console.log("Error getting reference message author ID: " + error);
        }
    } catch(error){
        isReply = false;
    }

    if(msgContent.substring(0,1) === '^') {
        msgContent = msgContent.replace('^', '');
    }

    if(msgContent.substring(0,5) === ("!test")) {
        await msg.reply("Hello world!");
    }

    if(isReply && !isCommand && !isMention && refMsgAuthorId === clientUserId) {
        await chat(msg);
    }

    if(msgContent.substring(0,6) === ("!turbo") && SD_TURBO) {
        await turbo(msg);
    }
})

await client.login(process.env.DISCORD_TOKEN)
const botUserId = client.user.id;