# 1️⃣ Create virtual environment
```py -3.11 -m venv .venv```

# 2️⃣ Activate environment
```.venv\Scripts\activate```          # Windows

# 3️⃣ Install dependencies
``` pip install -r requirements.txt```

# 4️⃣ Set environment variables
``` echo GROQ_API_KEY=your_key_here > .env ```
``` echo INDEX_DIR=./kb_index >> .env ```
``` echo DATA_DIR=./data >> .env ```

# 5️⃣ Crawl website data
```python crawl_site.py```

# 6️⃣ Convert PDFs to text
```python convert_pdfs.py```

# 6️⃣ Build FAISS index
```python build_index.py```

# 7️⃣ Run chatbot app
```python main.py```
