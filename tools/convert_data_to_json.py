import pandas as pd
import json
import argparse
import os

def convert_to_json(input_file_path, output_file_path):
    """
    Converts data from an Excel or CSV file to a structured JSON file.
    """
    try:
        file_extension = os.path.splitext(input_file_path)[1].lower()
        if file_extension in ['.xls', '.xlsx']:
            df = pd.read_excel(input_file_path)
        elif file_extension == '.csv':
            try:
                df = pd.read_csv(input_file_path)
            except pd.errors.ParserError:
                try:
                    df = pd.read_csv(input_file_path, sep=';')
                except pd.errors.ParserError:
                    df = pd.read_csv(input_file_path, sep='\t')
        else:
            print(f"Error: Unsupported file format: {file_extension}. Please use .xls, .xlsx, or .csv.")
            return
    except FileNotFoundError:
        print(f"Error: Input file not found at {input_file_path}")
        return
    except Exception as e:
        print(f"Error reading the input file: {e}")
        return

    df = df.fillna('')

    output_data = []

    ai_model_columns = [
        "GPT-4o", "Gemini 1.5 Pro", "Gemma 3",
        "Claude 3.5 Sonnet v2", "Claude 3.7 Sonnet", "Grok-3", "Sonar",
        "Qwen2.5-Max", "DeepSeek-R1", "MiniMax-01", "Mistral Large"
    ]
    human_columns = ["Human1", "Human2", "Human3"]

    expected_base_columns = ["ID", "Operation", "MapID", "QuestionText"]
    all_expected_columns = expected_base_columns + ai_model_columns + human_columns
    missing_columns = [col for col in all_expected_columns if col not in df.columns]
    if missing_columns:
        print(f"Warning: The following expected columns are missing in the input file: {', '.join(missing_columns)}")
        print("The script will proceed but might produce incomplete JSON for these fields.")


    for index, row in df.iterrows():
        question_entry = {}

        for col_name in expected_base_columns:
            if col_name in row:
                if col_name == "ID":
                    try:
                        question_entry[col_name] = int(row[col_name]) if pd.notna(row[col_name]) and row[col_name] != '' else None
                    except ValueError:
                        question_entry[col_name] = str(row[col_name]) if pd.notna(row[col_name]) else None
                else:
                    question_entry[col_name] = str(row[col_name]) if pd.notna(row[col_name]) else ''
            else:
                question_entry[col_name] = ''

        ai_responses = []
        for model_name in ai_model_columns:
            if model_name in row:
                ai_responses.append({
                    "modelName": model_name,
                    "responseText": str(row[model_name]) if pd.notna(row[model_name]) else ''
                })
        question_entry["AIResponses"] = ai_responses

        # Zbieranie odpowiedzi ludzi
        human_responses = []
        for human_id in human_columns:
            if human_id in row:
                human_responses.append({
                    "humanID": human_id,
                    "responseText": str(row[human_id]) if pd.notna(row[human_id]) else ''
                })
        question_entry["HumanResponses"] = human_responses

        output_data.append(question_entry)

    try:
        with open(output_file_path, 'w', encoding='utf-8') as f:
            json.dump(output_data, f, ensure_ascii=False, indent=4)
        print(f"Successfully converted data to {output_file_path}")
    except Exception as e:
        print(f"Error writing JSON to file: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Convert Excel/CSV data to structured JSON.")
    parser.add_argument("input_file", help="Path to the input Excel (.xls, .xlsx) or CSV (.csv) file.")
    parser.add_argument("output_file", help="Path to the output JSON file.")

    args = parser.parse_args()

    convert_to_json(args.input_file, args.output_file)