import {} from "dotenv/config";
import {getNumImages} from "./getNumImages.js";
import {callPipeline} from "./API.js";
import {getPrompt} from "./getPrompt.js";
import fs from "fs";
import {queue} from "../bot.js";

const DELETE_AFTER_SENDING = process.env.DELETE_AFTER_SENDING;

export async function processQueue() {
    let msg = queue[0].msg;
    let prompt, refMsg, numImages, imageUrl, results, enqueueMessage, confirmationMessage, isReply;
    // imageUrl can be set up to pass an image. right now it passes nothing
    imageUrl = "";
    try {
        enqueueMessage = await msg.channel.messages.fetch(queue[0].enqueueMessageId);
    } catch (error) {
        console.log("Error fetching queue message: " + error);
    }
    try {
        await enqueueMessage.delete();
    } catch (error) {
        console.log("Error deleting enqueue message: " + error);
    }

    // send confirmation message
    confirmationMessage = await msg.reply('Processing your request...');
    try {
        refMsg = await msg.fetchReference();
        isReply = true;
    } catch (error) {
        isReply = false;
    }

    prompt = await getPrompt(msg);
    numImages = await getNumImages(msg);
    try {
        console.log(prompt);
        results = await callPipeline(prompt, queue[0].pipeline, numImages, imageUrl);
    } catch (error) {
        console.log("Error calling backend pipeline: " + error);
    }

    // send generation in a reply
    try {
        await msg.reply({files: results, content: await getPrompt(msg)});
    } catch (error) {
        console.log("Error sending reply: " + error);
        await msg.reply("Internal server error. Try again later.");
    }

    // delete confirmation message
    try {
        await confirmationMessage.delete();
    } catch (error) {
        console.log("Error deleting confirmation message: " + error)
    }

    // delete generation
    try {
        if(DELETE_AFTER_SENDING === 'true') {
            for(const result of results) {
                fs.unlinkSync(result);
            }
        }
    } catch (error) {
        console.log("Error deleting file(s): " + error);
    }

    queue.shift();
}