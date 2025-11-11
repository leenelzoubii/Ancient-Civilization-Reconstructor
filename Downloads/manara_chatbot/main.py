# main.py
from rag_chat import answer
from ui import build_ui

if __name__ == "__main__":
    demo = build_ui(answer)
    demo.launch(
        server_name="127.0.0.1",
        server_port=7871,
        share=True,
        inbrowser=True
    )