import modules.scripts as scripts
import gradio as gr
import subprocess
from modules import processing, shared, sd_samplers, images
from modules.processing import Processed
from modules.sd_samplers import samplers
from modules.shared import opts, cmd_opts, state
from scripts.parseq_core import Parseq
import logging

class Script(scripts.Script):

    def title(self):
        return "SD Parseq v0.01"  

    def show(self, is_img2img):
        return is_img2img

    def ui(self, is_img2img):
        input_path = gr.Textbox(label="Input file path", lines=1)
        output_path = gr.Textbox(label="Output file path", lines=1)
        param_script = gr.Textbox(label="Parameter Script", lines=10)

        return [input_path, output_path, param_script]

    def run(self, p, input_path, output_path, param_script):
        logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.DEBUG)

        ### DEBUG so I can test with blank fields
        if not input_path:
            input_path = "/home/rewbs_soal/20-eq-frames.mp4"
        if not output_path:
            output_path = "/home/rewbs_soal/out.mp4"
        if not param_script:
            param_script = open("/home/rewbs_soal/param_script.json", "r").read()

        # HACK - ideally scripts could opt in to hooks at various points in the processing loop including file saving.
        logging.info("Overriding color correction option to false in main processing, so that we can control color correction in the script loop.")
        old_cc_opt = opts.img2img_color_correction
        opts.img2img_color_correction = False
        p.color_corrections = None
        
        original_input_image_resized = images.resize_image(p.resize_mode, p.init_images[0], p.width, p.height) if p.init_images[0] else None
        try:
             [all_images, info] = Parseq().run(p, original_input_image_resized, input_path, output_path, param_script, 10, 1, processing)

             Processed(p, all_images, p.seed, info)
        finally:
            logging.info("Restoring CC option to: %s", old_cc_opt)
            opts.img2img_color_correction = old_cc_opt
            logging.basicConfig(format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', level=logging.WARNING)            