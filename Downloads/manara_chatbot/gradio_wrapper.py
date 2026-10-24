# gradio_wrapper.py
from rag_chat import answer as rag_answer

def gradio_answer(message: str, history: list):
    """
    Wrapper function that converts Gradio format to what your RAG system expects
    """
    print(f"📨 Received message: {message}")
    print(f"📜 History: {history}")
    
    # Call your existing RAG function
    # Note: Your original function might be expecting different parameters
    try:
        response = rag_answer(message, history)
        print(f"✅ Response generated: {response[:100]}...")
        return response
    except Exception as e:
        error_msg = f"Error: {str(e)}"
        print(f"❌ Error: {error_msg}")
        return error_msg