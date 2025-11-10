import fetch from "node-fetch";

const REQUEST_TIMEOUT_SEC = process.env.REQUEST_TIMEOUT_SEC

export async function callPipeline(prompt, pipeline, num, image_url) {
    const start_time = new Date();
    const backendUrl = process.env.BACKEND_ADDRESS + ":" + process.env.PORT;
    const response = await Promise.race([
        fetch("http://" + backendUrl + "/process", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt,
                pipeline,
                num,
                image_url,
            })
        }).then((response) => {
            if (!response.ok) {
                console.log("Error: " + response.statusText);
            }
            return response;
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), REQUEST_TIMEOUT_SEC))
    ]);

    const results = [];
    const jsonResponse = await response.json();
    
    for (const file of jsonResponse.generation) {
        results.push(file);
    }

    const end_time = new Date();
    console.log(`Query took ${end_time - start_time} ms`);
    return results;
}