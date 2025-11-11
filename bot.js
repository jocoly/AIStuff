import {} from "dotenv/config";
import {Client, Events, GatewayIntentBits} from 'discord.js';

// models

import {handleTurbo} from "./commands/turbo.js";

// scryfall

import {handleScryfall} from "./commands/scryfall.js"

export const client = new Client({intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]});

export var queue = [];

const CONTAIN_BOT = process.env.CONTAIN_BOT === 'true';
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

const SCRYFALL = process.env.SCRYFALL === 'true';
const SD_TURBO = process.env.SD_TURBO === 'true';

let isReply, refMsg, isCommand, isMention;

client.once(Events.ClientReady, c => {
    console.log(`Logged in as ${client.user.tag}.`);
});

client.on(Events.MessageCreate, async msg => {
    let msgContent = msg.content;
    let msgAuthorId = msg.author.id;

    if(msgAuthorId === botUserId) return;
    if(CONTAIN_BOT && msg.channel.id !== DISCORD_CHANNEL_ID) return;

    // bot commands start with '!'
    isCommand = Array.from(msgContent)[0] === '!' || Array.from(msgContent)[0];

    if (SCRYFALL && await handleScryfall(msg)) return;
    if (SD_TURBO && await handleTurbo(msg)) return;
    // if unable to find referenced message, returns an error and sets isReply to false
    

    if(msgContent.startsWith("!test")) {
        await msg.reply("Hello world!");
    }

})

await client.login(process.env.DISCORD_TOKEN)
const botUserId = client.user.id;