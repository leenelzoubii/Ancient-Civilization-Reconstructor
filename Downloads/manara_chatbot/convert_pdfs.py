import os
import glob
import pdfplumber

# Set the directory where your PDFs are located
DATA_DIR = "C:\\Users\\HP\\Desktop\\COMMISION MANAR\\data"

# Ensure the data directory exists
os.makedirs(DATA_DIR, exist_ok=True)

# Convert each PDF to a text file
for pdf_file in glob.glob(os.path.join(DATA_DIR, "*.pdf")):
    print(f"Converting {pdf_file}...")
    with pdfplumber.open(pdf_file) as pdf:
        # Extract text from all pages
        text = "".join(page.extract_text() for page in pdf.pages if page.extract_text())
        # Create a .txt file with the same name as the PDF
        txt_file = os.path.splitext(pdf_file)[0] + ".txt"
        with open(txt_file, "w", encoding="utf-8") as f:
            f.write(text)
    print(f"Saved as {txt_file}")

print("PDF conversion complete!")