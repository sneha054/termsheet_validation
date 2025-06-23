import pandas as pd
import json
def preprocess_and_clean_excel(path):
    try:
        xls = pd.ExcelFile(path)
        cleaned_data = {}

        for sheet in xls.sheet_names:
            print(f"\n Processing Sheet: {sheet}")
            df = xls.parse(sheet)

            df.dropna(how='all', inplace=True)
            df.dropna(axis=1, how='all', inplace=True)

            df.fillna("", inplace=True)

            df.columns = df.columns.str.strip()

            df = df.applymap(lambda x: str(x).strip() if pd.notnull(x) else x)


            df.drop_duplicates(inplace=True)

            cleaned_data[sheet] = df

            print(df.head())

        return cleaned_data

    except FileNotFoundError as f:
        print("File Not Found Error: ",f)
        return None
    
    except Exception as e:
        print("Error:", e)
        return None
    
def convert_excel_data_to_json(cleaned_data):
    json_data={}

    for sheet_name,df in cleaned_data.items():
        json_data[sheet_name]=df.to_dict(orient='records') 

    try:
        with open('excelDatatojson.json','w',encoding='utf-8') as f:
            json.dump(json_data,f,indent=2)

    except Exception as e:
        print(f' Unable to write data to json',e)


if __name__ == '__main__':
    excel_path = 'Termsheet.xlsx' 

    cleaned_sheets = preprocess_and_clean_excel(excel_path)
    if cleaned_sheets:
        convert_excel_data_to_json(cleaned_sheets)
