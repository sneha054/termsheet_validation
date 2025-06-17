import pandas as pd

def preprocess_and_clean_excel(path):
    try:
        # Load the Excel file
        xls = pd.ExcelFile(path)
        cleaned_data = {}

        for sheet in xls.sheet_names:
            print(f"\n📄 Processing Sheet: {sheet}")
            df = xls.parse(sheet)

            # Drop completely empty rows and columns
            df.dropna(how='all', inplace=True)
            df.dropna(axis=1, how='all', inplace=True)

            # Fill NaNs with empty strings
            df.fillna("", inplace=True)

            # Strip whitespace from column names
            df.columns = df.columns.str.strip()

            # Convert all cell values to strings and strip whitespace
            df = df.applymap(lambda x: str(x).strip() if pd.notnull(x) else x)

            # Remove duplicate rows if any
            df.drop_duplicates(inplace=True)

            cleaned_data[sheet] = df

            # Preview cleaned data
            print(df.head())

        return cleaned_data

    except Exception as e:
        print("❌ Error:", e)
        return None

# Optional: Export cleaned data to a new Excel file
def export_cleaned_data(cleaned_data, output_path):
    with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
        for sheet, df in cleaned_data.items():
            df.to_excel(writer, sheet_name=sheet, index=False)
    print(f"\n✅ Cleaned data exported to: {output_path}")

if __name__ == '__main__':
    excel_path = 'Termsheet.xlsx'  # Original Excel file
    output_path = 'Cleaned_Termsheet.xlsx'  # Output file for cleaned data

    cleaned_sheets = preprocess_and_clean_excel(excel_path)
    if cleaned_sheets:
        export_cleaned_data(cleaned_sheets, output_path)
