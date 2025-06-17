import pypdf #extracting text
import pdfplumber #extracting tables
import fitz #for pymupdf
import pytesseract as pt
from pdf2image import convert_from_path

def extract_text_from_pdf(pdf_file:str)  -> str:
    pdf_text=""
    with open (pdf_file,'rb') as pdf:
        reader=pypdf.PdfReader(pdf,strict=False)

        for page in reader.pages:
            content=page.extract_text()
            pdf_text+=content

    return pdf_text

# -----> Extracting text using pytessearct

def extract_text_ocr(pdf_path:str,dpi=300)->str:
    pages=convert_from_path(pdf_path,dpi=300)
    text_all_pages=""
    for page_num,page_image in enumerate(pages):
        text=pt.image_to_string(page_image)
        text_all_pages+=text+"\n"

    return text_all_pages


def extract_tables_from_pdf(file_path:str)->str:
    tables=[]
    with pdfplumber.open(file_path) as f:
        for i in f.pages:
            tables_in_page=i.extract_tables()
            tables.extend(tables_in_page)
    return tables

def extract_pdf_metadata_and_links(file_path:str):
     doc=fitz.open(file_path)
     print(doc.page_count)
     metadata=doc.metadata
     links=[]
     
     for i in range(len(doc)):
         page=doc.load_page(i)
         links.extend(page.get_links())

     return metadata,links

def save_text_to_file(text:str,filename,mode):
    with open(filename,mode,encoding="utf-8") as f:
        f.write(text)

if __name__ == '__main__':
    pdf_path='TERM_SHEET_EQUITY.pdf'
    scanned_pdf_path='scansmpl.pdf'
    extracted_text=extract_text_from_pdf(pdf_path)
    extracted_text_from_ocr=extract_text_ocr(scanned_pdf_path)
    output_txt_path="text_output.txt"

    print("Extracted text: \n",extracted_text)
    save_text_to_file(extracted_text,output_txt_path,'w')
    print("\n Extracted text using ocr: \n",extracted_text_from_ocr)
    save_text_to_file(extracted_text_from_ocr,output_txt_path,'a')
    
    tables=extract_tables_from_pdf(pdf_path)
    print(f"\n Tables extracted: {len(tables)}")

    metadata,links=extract_pdf_metadata_and_links(pdf_path)
    print("\n Metadata:",metadata)
    print("Links:",links)



