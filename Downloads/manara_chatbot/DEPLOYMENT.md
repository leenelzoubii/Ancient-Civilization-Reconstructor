# Manara Chatbot - Streamlit Deployment Guide

## Overview
Manara is a Streamlit-based chatbot application designed to answer questions about Applied Technology Schools (ATS) in the UAE. The application uses Retrieval-Augmented Generation (RAG) with Groq API for intelligent responses.

## Prerequisites
- Python 3.11+
- Groq API Key
- Docker (for containerized deployment)

## Local Deployment

### 1. Setup Environment
```bash
cd manara_chatbot
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Dependencies
```bash
pip install -r requirements_streamlit.txt
```

### 3. Configure Environment
Create a `.env` file with:
```
GROQ_API_KEY=your_groq_api_key_here
INDEX_DIR=./kb_index
```

### 4. Run the Application
```bash
streamlit run app.py
```

The app will be available at `http://localhost:8501`

## Docker Deployment

### Build Image
```bash
docker build -t manara-chatbot .
```

### Run Container
```bash
docker run -p 8501:8501 manara-chatbot
```

## Manus Space Deployment

1. Upload the entire `manara_chatbot` directory to Manus Space
2. Set environment variables in Manus Space:
   - `GROQ_API_KEY`: Your Groq API key
   - `INDEX_DIR`: ./kb_index
3. Configure the startup command: `streamlit run app.py --server.port=8501 --server.address=0.0.0.0`
4. Expose port 8501

## Features
- Modern dark theme UI with green accent colors
- RAG-based question answering
- Quick action buttons for common questions
- Bilingual support (Arabic & English)
- Real-time chat interface
- Knowledge base indexing with FAISS

## File Structure
```
manara_chatbot/
├── app.py                    # Main Streamlit application
├── rag_chat.py              # RAG chat logic with Groq API
├── build_index.py           # Knowledge base indexing script
├── logo.png                 # Application logo
├── .env                     # Environment variables
├── .streamlit/config.toml   # Streamlit configuration
├── kb_index/                # FAISS index and embeddings
├── data/                    # Source documents for indexing
├── requirements_streamlit.txt # Python dependencies
├── Dockerfile               # Docker configuration
└── DEPLOYMENT.md            # This file
```

## Troubleshooting

### Missing GROQ_API_KEY
Ensure the `.env` file is present and contains a valid Groq API key.

### Index not found
Run `python3 build_index.py` to create the knowledge base index from source documents.

### Port already in use
Change the port in the startup command or kill the process using the port.

## Support
For issues or questions, refer to the Streamlit documentation or Groq API documentation.
