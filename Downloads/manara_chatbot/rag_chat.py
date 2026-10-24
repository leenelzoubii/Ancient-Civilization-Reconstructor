import os
import numpy as np
import faiss
from dotenv import load_dotenv
from sentence_transformers import SentenceTransformer, CrossEncoder
from openai import OpenAI

load_dotenv()

INDEX_DIR = os.getenv("INDEX_DIR", "./kb_index")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing in .env file")

# Global variables (lazy loaded)
_rag_cache = {}

def get_rag_components():
    """Get or initialize RAG components (cached)."""
    global _rag_cache
    
    if "initialized" in _rag_cache:
        return _rag_cache
    
    # Initialize components
    client = OpenAI(api_key=OPENAI_API_KEY)
    emb = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
    
    # Load index
    index = faiss.read_index(os.path.join(INDEX_DIR, "faiss.index"))
    texts = np.load(os.path.join(INDEX_DIR, "texts.npy"), allow_pickle=True)
    sources = np.load(os.path.join(INDEX_DIR, "sources.npy"), allow_pickle=True)
    
    _rag_cache = {
        "client": client,
        "emb": emb,
        "reranker": reranker,
        "index": index,
        "texts": texts,
        "sources": sources,
        "initialized": True
    }
    
    print(f"Total chunks indexed: {len(texts)}")
    print("Sample sources:", sources[:5])
    
    return _rag_cache


# In rag_chat.py - UPDATE THE SYSTEM PROMPT
SYS_PROMPT = (
    "Hello, my name is Manara. I'm a friendly bilingual assistant for Applied Technology Schools (ATS) in UAE. I'm here to help with any questions you may have about ATS. How can I assist you today? "
    "Your SOLE purpose is to answer questions based **EXCLUSIVELY** on the provided context. "
    "Be friendly, warm, and helpful in your responses. "
    "If the context does not contain the answer, respond with a polite statement like 'I'm sorry, but I don't have that information available. Please try asking about admissions, fees, curriculum, locations, or other ATS-related topics.' "
    "Keep answers concise, between 2-4 sentences, and in the same language as the user's question. "
    "**CRITICAL**: Do NOT mention any file names, sources, or document references in your answer. Never say 'according to [filename]' or 'in the [filename] file'. "
    "**STRICT RULE**: Do NOT invent, guess, or use any external knowledge. Only use the provided context. "
    "Provide the answer directly without any introductory phrases or reasoning. "
    "For tabular data (like menus), present the information in a clear, natural way without showing the raw table format."
)


def truncate_chunk(txt: str, max_words: int = 200) -> str:
    words = txt.split()
    if len(words) > max_words:
        return " ".join(words[:max_words]) + "… (truncated)"
    return txt


def retrieve(query: str, k: int = 30, top_n: int = 5):
    """Retrieve and re-rank the most relevant chunks."""
    rag = get_rag_components()
    emb = rag["emb"]
    reranker = rag["reranker"]
    index = rag["index"]
    texts = rag["texts"]
    sources = rag["sources"]
    
    # 1. Initial retrieval (vector search)
    q = emb.encode([query], normalize_embeddings=True)
    D, I = index.search(q, k)
    
    initial_ctx = []
    for i, score in zip(I[0], D[0]):
        if i == -1:
            continue
        initial_ctx.append({"text": texts[i], "source": sources[i], "score": float(score)})
        
    if not initial_ctx:
        return []

    # 2. Re-ranking (cross-encoder)
    sentences = [c["text"] for c in initial_ctx]
    pairs = [[query, sentence] for sentence in sentences]
    
    # The CrossEncoder returns a score for each pair
    scores = reranker.predict(pairs)
    
    # Sort the initial context based on the re-ranker scores
    reranked_ctx = sorted(
        zip(initial_ctx, scores),
        key=lambda x: x[1],
        reverse=True
    )
    
    # 3. Select the top_n chunks
    final_ctx = []
    for (ctx_item, score) in reranked_ctx[:top_n]:
        # Update the score to the re-ranker score for transparency
        ctx_item["score"] = float(score)
        final_ctx.append(ctx_item)
        
    return final_ctx


def answer(query: str, history):
    """Generate an answer using RAG with GPT-4o-mini."""
    rag = get_rag_components()
    client = rag["client"]
    
    # Use the retrieve function with re-ranking.
    # It retrieves 30 candidates and re-ranks to the top 5 for quality context.
    ctx = retrieve(query, k=30, top_n=5)
    
    # If no context is found, return a polite "I don't know" message
    if not ctx:
        return "I am sorry, but I cannot find the answer to your question in the provided documents. Please try asking about admissions, fees, curriculum, locations, or other ATS-related topics."

    short_ctx = [truncate_chunk(c["text"]) for c in ctx]

    joined = "\n---\n".join(
        f"{txt}"
        for i, (c, txt) in enumerate(zip(ctx, short_ctx))
    )

    # More direct prompt without encouraging reasoning
    prompt = (
        f"Context information:\n{joined}\n\n"
        f"Question: {query}\n\n"
        f"Based on the context above, provide a direct and helpful answer to the question. "
        f"Be friendly and conversational. "
        f"Use the information provided to synthesize a comprehensive response. "
        f"Keep it brief (2-4 sentences). Do not show your reasoning process. "
        f"Answer in the same language as the question. "
        f"NEVER mention file names, sources, or where the information came from. "
        f"If the context does not contain enough information, politely state that you cannot find the answer."
    )

    try:
        resp = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": SYS_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.7,
            max_tokens=300,
        )
        return resp.choices[0].message.content
    except Exception as e:
        print(f"Error calling OpenAI API: {e}")
        return f"I encountered an error while processing your request. Please try again. Error: {str(e)}"
