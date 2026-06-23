import pdfplumber

with pdfplumber.open("college-ug-print.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        print(f"--- Page {i+1} ---")
        text = page.extract_text()
        print(text)
        
        # Check for tables
        tables = page.extract_tables()
        if tables:
            print(f"--- Page {i+1} Tables ---")
            for table in tables:
                for row in table:
                    print(row)
