import pandas as pd
import json
import os
import sys

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'src', 'data')
EXCEL_PATH = os.path.join(BASE_DIR, 'prices.xlsx')

FILES_MAP = {
    'Control': 'control.json',
    'Traction_1_1': 'traction.json',
    'Traction_2_1': 'traction_2_1.json',
    'Misc': 'misc.json'
}

def json_to_excel():
    print(f"Generating Excel file from JSON data...")
    try:
        with pd.ExcelWriter(EXCEL_PATH, engine='openpyxl') as writer:
            for sheet_name, json_file in FILES_MAP.items():
                json_path = os.path.join(DATA_DIR, json_file)
                if os.path.exists(json_path):
                    print(f"  Reading {json_file} -> Sheet '{sheet_name}'")
                    with open(json_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    df = pd.DataFrame(data)
                    df.to_excel(writer, sheet_name=sheet_name, index=False)
                else:
                    print(f"  Warning: {json_file} not found.")
        print(f"\nSuccess! Created: {EXCEL_PATH}")
        print("You can now edit this Excel file directly.")
    except Exception as e:
        print(f"Error creating Excel: {e}")

def excel_to_json():
    print(f"Updating JSON data from Excel file...")
    if not os.path.exists(EXCEL_PATH):
        print(f"Error: {EXCEL_PATH} not found.")
        return

    try:
        # Read all sheets
        xls = pd.ExcelFile(EXCEL_PATH)
        
        for sheet_name, json_file in FILES_MAP.items():
            if sheet_name in xls.sheet_names:
                print(f"  Reading Sheet '{sheet_name}' -> {json_file}")
                df = pd.read_excel(xls, sheet_name=sheet_name)
                
                # Convert back to list of dicts
                # Handle NaN as null for JSON
                data = df.to_dict(orient='records')
                
                # Clean up data types (Pandas may introduce int64, float64 which aren't JSON serializable directly in some versions, but standard json dump usually handles int/float)
                # Also convert NaN to None
                cleaned_data = []
                for row in data:
                    new_row = {}
                    for k, v in row.items():
                        if pd.isna(v):
                            new_row[k] = None
                        else:
                            new_row[k] = v
                    cleaned_data.append(new_row)

                json_path = os.path.join(DATA_DIR, json_file)
                with open(json_path, 'w', encoding='utf-8') as f:
                    json.dump(cleaned_data, f, indent=2, ensure_ascii=False)
            else:
                print(f"  Warning: Sheet '{sheet_name}' not found in Excel.")
        
        print(f"\nSuccess! JSON files updated in {DATA_DIR}")
    except Exception as e:
        print(f"Error updating JSON: {e}")

def main():
    if len(sys.argv) > 1:
        mode = sys.argv[1]
    else:
        # Default behavior:
        # If Excel doesn't exist, create it.
        # If Excel exists, ask user what to do.
        if not os.path.exists(EXCEL_PATH):
            mode = 'init'
        else:
            print(f"Found existing price file: {EXCEL_PATH}")
            print("1. Update JSON from Excel (Input 1)")
            print("2. Re-generate Excel from JSON (Input 2)")
            choice = input("Select option (1/2): ").strip()
            if choice == '1':
                mode = 'update'
            elif choice == '2':
                mode = 'init'
            else:
                print("Invalid choice.")
                return

    if mode == 'init':
        json_to_excel()
    elif mode == 'update':
        excel_to_json()
    else:
        print("Usage: python manage_prices.py [init|update]")

if __name__ == '__main__':
    main()
