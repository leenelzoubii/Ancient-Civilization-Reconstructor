# ui.py
import gradio as gr

CUSTOM_CSS = """
/* Modern Dark Theme */
:root {
    --primary: #74c69d;
    --secondary: #2d6a4f;
    --dark-bg: #0d1b2a;
    --card-bg: #152238;
    --accent: #40916c;
}
body {background: linear-gradient(135deg, #0d1b2a 0%, #1b3a4b 100%); margin:0; padding:0; font-family:'Segoe UI',system-ui,sans-serif;}
.gradio-container {background:transparent !important; max-width:1200px !important; margin:auto !important;}
.header {background:linear-gradient(135deg,var(--secondary) 0%,var(--accent) 100%); padding:1.5rem 2rem; border-radius:0 0 20px 20px; margin-bottom:2rem; text-align:center; box-shadow:0 4px 20px rgba(0,0,0,.3); position:relative;}
.gr-chatbot {background:var(--card-bg)!important; border-radius:20px!important; border:1px solid rgba(116,198,157,.3)!important; box-shadow:0 8px 32px rgba(0,0,0,.2)!important; backdrop-filter:blur(10px); min-height:600px; max-height:70vh; padding:20px;}
.user-message,.bot-message {padding:16px 20px; border-radius:18px; margin:8px 0; line-height:1.5; max-width:80%;}
.user-message {background:linear-gradient(135deg,var(--primary) 0%,var(--accent) 100%); color:white; margin-left:auto; border-bottom-right-radius:4px;}
.bot-message {background:rgba(255,255,255,.1); color:#e9f5ee; margin-right:auto; border-bottom-left-radius:4px; border:1px solid rgba(255,255,255,.1);}
.input-container {background:var(--card-bg)!important; border-radius:20px!important; padding:20px!important; margin-top:20px!important; border:1px solid rgba(116,198,157,.3)!important;}
.gr-button {background:linear-gradient(135deg,var(--primary) 0%,var(--accent) 100%)!important; color:white!important; border:none!important; border-radius:12px!important; padding:12px 24px!important; font-weight:600!important; transition:all .3s ease!important; box-shadow:0 4px 15px rgba(116,198,157,.3)!important;}
.gr-button:hover {transform:translateY(-2px)!important; box-shadow:0 6px 20px rgba(116,198,157,.4)!important;}
textarea,input {background:rgba(255,255,255,.05)!important; color:#e9f5ee!important; border:1px solid rgba(116,198,157,.3)!important; border-radius:12px!important; padding:16px!important; font-size:14px!important;}
.section-card {background:var(--card-bg); border-radius:16px; padding:20px; margin:10px 0; border:1px solid rgba(116,198,157,.2); box-shadow:0 4px 20px rgba(0,0,0,.1);}
.quick-action-btn {background:rgba(116,198,157,.2)!important; border:1px solid #74c69d!important; color:#74c69d!important; padding:12px!important; border-radius:10px!important; cursor:pointer!important; transition:all .3s ease!important; width:100%!important; margin:5px 0!important;}
.quick-action-btn:hover {background:rgba(116,198,157,.3)!important; transform:translateY(-2px)!important;}
.bot-message strong {color:#74c69d !important; animation:cite-pulse 1.5s ease-in-out; display:inline-block;}
@keyframes cite-pulse {0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.03)}}
"""

def header_html():
    return gr.HTML("""
    <div class="header">
        <div style="position:absolute; left:2rem; top:1.5rem;">
            <img src="logo.png" alt="ATS Logo" style="height:60px; width:auto; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.3);">
        </div>
        <div style="text-align:center; padding-left:80px;">
            <h1 style="color:white; margin:0; font-size:2.5em; font-weight:700;">Manara</h1>
            <p style="color:rgba(255,255,255,.9); font-size:1.2em; margin:8px 0 0 0;">Your Guide to ATS</p>
        </div>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:12px; padding-left:80px;">
            <span class="lang-badge">العربية</span>
            <span class="lang-badge">English</span>
        </div>
    </div>
    <style>
    .lang-badge {
        background: rgba(255,255,255,0.15);
        padding: 6px 16px;
        border-radius: 30px;
        font-size: 0.85em;
        font-weight: 600;
        color: white;
        backdrop-filter: blur(5px);
        border: 1px solid rgba(116,198,157,0.4);
        animation: pulse-glow 2s infinite ease-in-out;
    }
    @keyframes pulse-glow {
        0%, 100% { box-shadow: 0 0 5px rgba(116,198,157,0.4); transform: scale(1); }
        50% { box-shadow: 0 0 15px rgba(116,198,157,0.8); transform: scale(1.05); }
    }
    </style>
    """)

def features_html():
    return gr.HTML("""
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin:20px 0;">
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Admissions</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Requirements, deadlines, procedures</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Fees & Costs</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Tuition, scholarships, payment</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Curriculum</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Programs, courses, schedules</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Locations</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Campuses, facilities, contacts</p></div>
    </div>
    """)

def quick_button(label: str, question: str, textbox: gr.Textbox):
    def fill():
        return question
    return gr.Button(label, elem_classes="quick-action-btn").click(fn=fill, outputs=textbox)

def build_ui(chat_fn):
    with gr.Blocks(css=CUSTOM_CSS, theme=gr.themes.Soft(), title="ATS Knowledge Hub") as demo:
        header_html()
        features_html()

        with gr.Row():
            with gr.Column(scale=3):
                chat = gr.ChatInterface(
                    fn=chat_fn,
                    title="",
                    description="",
                    examples=[
                        "What are the admission requirements for ATS?",
                        "Tell me about the curriculum structure",
                        "How much are the tuition fees?",
                        "What programs are available?",
                        "Where are the ATS campuses located?"
                    ],
                    cache_examples=False,
                    submit_btn="Send",
                    retry_btn="Regenerate",
                    clear_btn="Clear",
                )
                textbox = chat.textbox

            with gr.Column(scale=1):
                with gr.Group():
                    gr.HTML("""
                    <div class="section-card">
                        <h3 style="color:#74c69d;margin-top:0;">Quick Actions</h3>
                        <p style="color:#d8f3dc;font-size:.9em;margin-bottom:15px;">Click to ask common questions:</p>
                    </div>
                    """)
                    quick_button("Admission Info", "What are the admission requirements?", textbox)
                    quick_button("Fee Structure", "How much are the tuition fees?", textbox)
                    quick_button("Programs", "What programs are available at ATS?", textbox)
                    quick_button("Locations", "Where are the ATS campuses located?", textbox)

                gr.HTML("""
                <div class="section-card">
                    <h3 style="color:#74c69d;margin-top:0;">About ATS</h3>
                    <p style="color:#d8f3dc;font-size:.9em;line-height:1.4;">
                        Applied Technology Schools provide vocational and technical education in the UAE,
                        offering industry-relevant programs and career-focused training.
                    </p>
                </div>
                """)

    return demo   # THIS LINE WAS MISSING!