import sys
import subprocess

def run_script(script_name,file_path):
  
  result=subprocess.run(
        ['C:\\tools\\Anaconda3\\python.exe',script_name,file_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding='utf-8'
      )

       
  if result.returncode !=0:
        print(f"Error: {result.stderr}",file=sys.stderr)
        sys.exit(1)
    
  print(result.stdout.strip())

if __name__ == '__main__':
    if len(sys.argv) <2:
        print("no path provided ",file=sys.stderr)
        sys.exit(1)


    script_names={
         ".pdf":'D:\\termsheet_validation\\pdf_extraction\\pdf_extractor.py',
         ".xlsx":'D:\\termsheet_validation\\xls_extraction\\excelsheet_extractor.py',
         ".csv":'D:\\termsheet_validation\\xls_extraction\\excelsheet_extractor.py',
         ".docx":'D:\\termsheet_validation\\docx_extraction\\worddocextractor.py',
         ".eml":'D:\\termsheet_validation\\zip_extraction\\zipfiledatatojson.py'
    }

    file_path=sys.argv[1]
    extension=sys.argv[2]

    if extension not in script_names:
        print(f"Unspported file exntension:{extension}",file=sys.stderr)
        sys.exit(1)


    run_script(script_names[extension],file_path)
    print("Script run succesful.")