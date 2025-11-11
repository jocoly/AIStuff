# Imports
from dotenv import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS
from torch import torch
import os
import random
import time
from pathlib import Path
import threading
import uuid

# Models
from diffusers import AutoPipelineForText2Image

# Startup
load_dotenv('./.env')
app = Flask(__name__)
CORS(app)
print("--> Starting the server. This may take some time")

# Environment variables (models need to be enabled by setting the corresponding environment variable to TRUE)
DEV_MODE = os.getenv("DEV_MODE") == "true"

OUTPUT_DIR = os.getenv("OUTPUT_DIR")
MAX_NUM_IMAGES=os.getenv("MAX_NUM_IMAGES")
NEGATIVE_PROMPT = os.getenv("NEGATIVE_PROMPT")

SD_TURBO = os.getenv("SD_TURBO") == "true"
if(SD_TURBO):
    SD_TURBO_INFERENCE_STEPS = os.getenv("SD_TURBO_INFERENCE_STEPS")
    SD_TURBO_WIDTH = os.getenv("SD_TURBO_WIDTH")
    SD_TURBO_HEIGHT = os.getenv("SD_TURBO_HEIGHT")

# Check for CUDA-enabled GPU
cudaAvailable = torch.cuda.is_available()
print("CUDA-enabled GPU detected: " + str(cudaAvailable))
if cudaAvailable:
    device = torch.device('cuda:0')
else:
    device = torch.device('cpu')

if not DEV_MODE:
    print("--> Loading Stable Diffusion Turbo pipeline...")
    sdTurboPipe = AutoPipelineForText2Image.from_pretrained(
        "stabilityai/sd-turbo",
        torch_dtype=torch.float16,
        variant="fp16"
    )
    sdTurboPipe.to(device)
else:
    print("--> DEV_MODE is true: Skipping model loading")
    sdTurboPipe = None

processing_lock = threading.Lock()

def process(prompt: str, pipeline: str, num: int, img_url: str):
    if DEV_MODE:
        print(f"[DEV_MODE] Pretending to generate {num} image(s) for prompt: '{prompt}'")
        return [f"fake_image_{uuid.uuid4()}.png" for _ in range(num)]
    start_time = time.time()
    seed = random.randint(0, 100000)
    if cudaAvailable:
        generator = torch.Generator(device=device).manual_seed(seed)
    else:
        generator = None
    generation_output = []
    match pipeline:
        case "SD_TURBO":
            if(SD_TURBO):
                images_array = sdTurboPipe(
                    prompt=prompt,
                    num_inference_steps=int(SD_TURBO_INFERENCE_STEPS),
                    guidance_scale=0.0,
                    width=int(SD_TURBO_WIDTH),
                    height=int(SD_TURBO_HEIGHT),
                    generator=generator
                ).images
                Path(OUTPUT_DIR).mkdir(parents=True, exist_ok=True)
                for index in range(num):
                    image_path = save_image(images_array[index], OUTPUT_DIR)
                    generation_output.append(image_path)
            else:
                print("SD_TURBO is disabled.")
    gen_time = '%.3f'%(time.time() - start_time)
    print(f"Created generation in {gen_time} seconds")
    return generation_output

@app.route("/process", methods=["POST"])
def process_api():
    json_data = request.get_json(force=True)
    prompt = json_data["prompt"]
    pipeline = json_data["pipeline"]
    num = int(json_data["num"])
    image_url = json_data["image_url"]
    with processing_lock:
        generation = process(prompt, pipeline, num, image_url)
    response = {'generation': generation}
    return jsonify(response)

@app.route("/", methods=["GET"])
def health_check():
    return jsonify(success=True)

def save_image(image, output_dir):
    file_name = str(uuid.uuid4()) + '.png'
    image_path = os.path.join(output_dir, file_name)
    image.save(image_path, format='png')
    return image_path

if DEV_MODE:
    if __name__ == "__main__":
        app.run(
            host=os.getenv("BACKEND_ADDRESS"),
            port=(os.getenv("PORT")),
            debug=True,
            use_reloader=True)
else:
    if __name__ == "__main__":
        app.run(
            host=os.getenv("BACKEND_ADDRESS"),
            port=(os.getenv("PORT")),
            )