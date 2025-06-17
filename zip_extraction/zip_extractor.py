import zipfile
import os

# Step 1: Set file paths
zip_path = "data.zip"             # Your ZIP file
extract_to = "unzipped_data"      # Folder to extract contents

# Step 2: Unzip the file
with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_to)

print(f"✅ Files extracted to: {extract_to}")

texts = []

# Loop through all extracted files
for root, dirs, files in os.walk(extract_to):
    for file in files:
        if file.endswith((".txt", ".eml", ".md", ".log")):
            file_path = os.path.join(root, file)
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                texts.append({
                    "filename": file,
                    "content": content
                })

print(f"🧾 Total files loaded: {len(texts)}")

# Example: print first 300 chars of first file
print("Sample content:\n", texts[0]['content'][:300])
