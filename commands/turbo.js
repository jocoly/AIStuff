import {getNumImages} from "../tools/getNumImages.js";
import {queue} from "../bot.js";
import {processQueue} from "../tools/processQueue.js";

const MAX_NUM_IMAGES = process.env.MAX_NUM_IMAGES;

export async function handleTurbo(msg) {
    const content = msg.content.trim();
    if (!content.startsWith("!turbo")) return false;

    const enqueueMessage = await msg.reply("Request added to the queue. There are " + queue.length + " requests ahead of you.");
    const numImages = await getNumImages(msg);
    if (numImages > MAX_NUM_IMAGES){
        await msg.reply("That's too many images. Try requesting " + MAX_NUM_IMAGES + " or fewer.");
        return true;
    } else {
        queue.push({
            msg,
            pipeline: 'SD_TURBO',
            enqueueMessageId: enqueueMessage.id
        });
    }
    if (queue.length === 1) {
        await processQueue();
    }
    return true;
}