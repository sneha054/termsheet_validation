
import json
import re

def extract_cleaned_data_from_zip_file(filepath):
    with open(filepath,'r',encoding='utf-8') as f:
        cleaned_text=f.readlines()

    sections=parse_sections(cleaned_text)
    exhibit=parse_exhibit_table_data(cleaned_text)

    return {"sections":sections,"exhibit_a":exhibit} 

def parse_sections(text)->dict:
    
    #we have to detect headings first before exhibit A
    #exhibit A is not the main data it is extra information for our data

    #document has basically 1]headings and paragraphs 2]field value
    #we have to build dictionary

    data={}
    current_section=None #current section

    data_under_section=[] #to collect lines under current section

    for line in text:
        line=line.strip() #we use strip() to remove whitespace/newlines

        if line =="*EXHIBIT A*":
            break
        if line.startswith("*") and  ":" in line:
            
           if current_section:
              data[current_section]="".join(data_under_section).strip().strip("*")
           #check if it's a heading
           #remove * ,splits at : converts to lowercaseand replace spaces with underscore
           key=line.strip("* ").split(":",1)[0].strip().lower().replace(" ","_")

           current_section=key

           data_under_section=[line.split(":",1)   [1].strip()] #text after colon

        elif line.startswith("*") and not ":"in line:

           if current_section:
              data[current_section]="".join(data_under_section).strip()
           #check if it's a heading
           #remove * ,splits at : converts to lowercaseand replace spaces with underscore
           key=line.strip("* ").strip().lower().replace(" ","_")

           current_section=key

           data_under_section=[] #text after colon
        
        else:
            data_under_section.append(line)
 
    if current_section:
              data[current_section]="".join(data_under_section).strip().strip("*")

    return data
        
def parse_exhibit_table_data(cleaned_text)->dict:

    exhibit={}
    split_index=cleaned_text.index("*EXHIBIT A*\n")

    lines_under_table=cleaned_text[split_index+1:]

    pre_index=lines_under_table.index("*Pre-Financing*\n")

    post_index=lines_under_table.index('*Post-Financing*\n')

    pre_financing_lines=lines_under_table[pre_index+1:post_index]

    post_financing_lines=lines_under_table[post_index+1:]

    exhibit["pre_financing"]=parse_rows_of_the_table(pre_financing_lines)

    exhibit["post_financing"]=parse_rows_of_the_table(post_financing_lines)

    return exhibit

def parse_rows_of_the_table(lines):
    
    headers=[]

    data_rows=[]

    i=0

    #read headers(lines starting with *)
    while i< len(lines):
        
        line  =lines[i].strip()

        if line.startswith("*"):
            headers.append(
                line.strip("* ").strip().lower().replace(" ","_")
            )

            i+=1
        
        else:
            break

    #parse data in chunks matching header length

    def is_number(value):
        return re.match(r"^-?\d*\.?\d+$",value) #^-start of string ,- for negative numbers \d:one or more digits ,then decimal points $:end of string


    while i + len(headers)<=len(lines):

        chunk=lines[i:i+ len(headers)]

        row={}

        for j,header in enumerate(headers):

            value=chunk[j].strip().replace("#","")

            if "%" in value:
                value=float(value.replace("%",""))

            elif header.endswith("number_of_units") and is_number(value):
                 value=float(value)
            else:
                value=value.strip()
            
            row[header]=value

        data_rows.append(row)
        i+=len(headers)

    return data_rows


if __name__=="__main__":
    output=extract_cleaned_data_from_zip_file("TERM SHEET FOR FINANCING OF COMPANY, LLC_cleaned.txt")

    with open("structureddatafortextfile.json","w",encoding="utf-8") as f:
        json.dump(output,f,indent=2)

#deafult windows encoding-cp1252    


            






   






    

