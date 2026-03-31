import json

from toon import encode
import os

# for each file in /data/processed_json, encode it and create a new file in /data/encoded with the same name but with .toon extension

def encode_files(input_dir, output_dir):
    for filename in os.listdir(input_dir):
        if filename.endswith(".json"):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, filename.replace(".json", ".toon"))
            with open(input_path, "r") as f:
                data = json.load(f)
            encoded_data = encode(data)
            with open(output_path, "w") as f:
                f.write(encoded_data)
            if filename == "ABORTION.json":
                print(f"encoded {filename}: {encoded_data}")

if __name__ == "__main__":
      encode_files("data/processed_json", "data/encoded")