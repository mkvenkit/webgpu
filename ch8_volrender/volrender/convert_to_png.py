"""
convert_to_png.py

Convert TIF files in folder to PNG.

"""
import os
import sys
import json
from PIL import Image

def convert_folder(src_dir, dst_dir):
    os.makedirs(dst_dir, exist_ok=True)
    png_filenames = []

    for fname in sorted(os.listdir(src_dir)):
        if fname.lower().endswith(".tif") or fname.lower().endswith(".tiff"):
            src_path = os.path.join(src_dir, fname)
            base = os.path.splitext(fname)[0]
            dst_fname = base + ".png"
            dst_path = os.path.join(dst_dir, dst_fname)

            try:
                img = Image.open(src_path)
                img.save(dst_path)
                png_filenames.append(dst_fname)
                print(f"Converted: {fname} -> {dst_fname}")
            except Exception as e:
                print(f"Skipping {fname}: {e}")

    # Write list.json
    list_path = os.path.join(dst_dir, "list.json")
    with open(list_path, "w") as f:
        json.dump(png_filenames, f, indent=2)
    print(f"\nlist.json written to: {list_path}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python convert_tif_to_png.py <src_folder> [dst_folder]")
        sys.exit(1)

    src_folder = sys.argv[1]
    dst_folder = sys.argv[2] if len(sys.argv) > 2 else src_folder + "_png"

    convert_folder(src_folder, dst_folder)
