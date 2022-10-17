from  parseq_core import Parseq
import string
from PIL import Image, ImageDraw
import logging


class DummySDProcessing:

    def process_images(self, p):
         
        input_images = p.init_images
        output_images = []
        for image in input_images:
            draw = ImageDraw.Draw(image)
            draw.text((20, 70), f"SD[seed:{p.seed}; scale:{p.scale}; denoise:{p.denoising_strength}]")
            output_images.append(image)

        dummy_processed = type("", (), dict(
            seed = p.seed,
            images = output_images
        ))()

        return dummy_processed

class DummyP:
    width=1024
    height=512
    n_iter=1
    batch_size=1
    do_not_save_grid=True
    init_images = []
    seed=-1
    denoising_strength=0.8
    scale=7.5
    color_corrections = None

logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.DEBUG)

param_script_string = open("./param_script.json", "r").read()
Parseq().run(p=DummyP(), input_img=None, input_path='./prod-30s.mp4', output_path='./out.mp4', param_script_string=param_script_string, sd_processor=DummySDProcessing())

