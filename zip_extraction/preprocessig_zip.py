
import os
import re
import win32com.client as win32
import pdfplumber
from email import policy
from email.parser import BytesParser

# === CLEANING FUNCTION ===
def clean_text(text):
    # Preserve line breaks, clean extra spaces inside lines
    lines = text.splitlines()
    cleaned_lines = [re.sub(r'\s+', ' ', line).strip() for line in lines if line.strip()]
    return '\n'.join(cleaned_lines)


# === FILE EXTRACTORS ===
def extract_text_from_doc(path):
    word = win32.gencache.EnsureDispatch('Word.Application')
    word.Visible = False
    doc = word.Documents.Open(path)
    text = doc.Content.Text
    doc.Close(False)
    word.Quit()
    return clean_text(text)

def extract_text_from_pdf(path):
    text = ""
    try:
        with pdfplumber.open(path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + "\n"
    except Exception as e:
        print(f"❌ PDF read error: {path} | {e}")
    return clean_text(text)

def extract_text_from_eml(path):
    with open(path, 'rb') as f:
        msg = BytesParser(policy=policy.default).parse(f)
    subject = msg['subject'] or ''
    body = msg.get_body(preferencelist=('plain'))
    body_text = body.get_content() if body else ''
    return clean_text(f"Subject: {subject}\n\n{body_text}")

# === MAIN PROCESSOR ===
def process_unzipped_folder(folder_path="unzipped_data", output_dir="cleaned_data"):
    os.makedirs(output_dir, exist_ok=True)
    for root, _, files in os.walk(folder_path):
        for file in files:
            path = os.path.join(root, file)
            ext = file.lower().split('.')[-1]
            text = ""

            try:
                if ext == 'doc':
                    text = extract_text_from_doc(path)
                elif ext == 'pdf':
                    text = extract_text_from_pdf(path)
                elif ext == 'eml':
                    text = extract_text_from_eml(path)
                else:
                    print(f"⚠️ Skipping unsupported file: {file}")
                    continue

                if text:
                    filename = os.path.splitext(file)[0] + "_cleaned.txt"
                    out_path = os.path.join(output_dir, filename)
                    with open(out_path, "w", encoding="utf-8") as f:
                        f.write(text)
                    print(f"✅ Cleaned & saved: {filename}")

            except Exception as e:
                print(f"❌ Error processing {file}: {e}")

# === RUN ===
if __name__ == "__main__":
    process_unzipped_folder()
