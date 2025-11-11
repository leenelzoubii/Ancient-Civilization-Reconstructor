# app.py
import streamlit as st
from rag_chat import answer
import os

# --- Configuration and Setup ---
st.set_page_config(
    page_title="Manara - Your Guide to ATS",
    page_icon="logo.png",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS from ui.py, adapted for Streamlit
CUSTOM_CSS = """
/* Modern Dark Theme */
:root {
    --primary: #74c69d;
    --secondary: #2d6a4f;
    --dark-bg: #0d1b2a;
    --card-bg: #152238;
    --accent: #40916c;
}
body {
    background: linear-gradient(135deg, var(--dark-bg) 0%, #1b3a4b 100%);
    margin:0;
    padding:0;
    font-family:'Segoe UI',system-ui,sans-serif;
}
/* Streamlit main container */
.stApp {
    background: linear-gradient(135deg, var(--dark-bg) 0%, #1b3a4b 100%);
}

/* Header styling */
.header {
    background: linear-gradient(135deg, var(--secondary) 0%, var(--accent) 100%);
    padding: 1.5rem 2rem;
    border-radius: 0 0 20px 20px;
    margin-bottom: 2rem;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,.3);
    position: relative;
}
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
    display: inline-block;
}
@keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 5px rgba(116,198,157,0.4); transform: scale(1); }
    50% { box-shadow: 0 0 15px rgba(116,198,157,0.8); transform: scale(1.05); }
}

/* Section Card styling */
.section-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 20px;
    margin: 10px 0;
    border: 1px solid rgba(116,198,157,.2);
    box-shadow: 0 4px 20px rgba(0,0,0,.1);
}

/* Quick Action Button styling */
.quick-action-btn {
    background: rgba(116,198,157,.2);
    border: 1px solid #74c69d;
    color: #74c69d;
    padding: 12px;
    border-radius: 10px;
    cursor: pointer;
    transition: all .3s ease;
    width: 100%;
    margin: 5px 0;
    text-align: center;
    font-weight: 600;
}
.quick-action-btn:hover {
    background: rgba(116,198,157,.3);
    transform: translateY(-2px);
}

/* Chat message styling (Streamlit's default chat elements are hard to style, so we'll rely on Streamlit's theme and custom markdown for bot messages) */
/* Overriding Streamlit's default theme to match the dark aesthetic */
[data-testid="stHeader"] {
    display: none; /* Hide Streamlit header */
}
[data-testid="stToolbar"] {
    right: 2rem;
}
[data-testid="stSidebar"] {
    background-color: var(--card-bg);
}
.st-emotion-cache-18ni2g1 { /* Main content padding */
    padding-top: 0;
}
.st-emotion-cache-1wa0z9t { /* Main content background */
    background-color: transparent;
}
.st-emotion-cache-10trblm { /* Title/Header color */
    color: var(--primary);
}
.st-emotion-cache-13ln4jw { /* Chat input container */
    background-color: var(--card-bg);
    border-radius: 20px;
    padding: 20px;
    border: 1px solid rgba(116,198,157,.3);
    box-shadow: 0 8px 32px rgba(0,0,0,.2);
}
.st-emotion-cache-16txto3 { /* Chat input text area */
    background-color: rgba(255,255,255,.05);
    color: #e9f5ee;
    border: 1px solid rgba(116,198,157,.3);
    border-radius: 12px;
}
.st-emotion-cache-16txto3:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 0.2rem rgba(116,198,157,.5);
}
.st-emotion-cache-1cyp70b { /* Chat message container */
    background-color: transparent;
}
.st-emotion-cache-4oy32v { /* User message bubble */
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
    color: white;
    border-radius: 18px 18px 4px 18px;
}
.st-emotion-cache-1r4qj8x { /* Bot message bubble */
    background: rgba(255,255,255,.1);
    color: #e9f5ee;
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 18px 18px 18px 4px;
}
.st-emotion-cache-1g0q2g0 { /* Chat message text */
    color: inherit;
}
"""

# Apply custom CSS
st.markdown(f"<style>{CUSTOM_CSS}</style>", unsafe_allow_html=True)

# --- UI Components ---

def header_html():
    """Generates the custom header HTML."""
    logo_path = os.path.join(os.path.dirname(__file__), "logo.png")
    # Use base64 encoding for the image to embed it directly in HTML
    import base64
    if os.path.exists(logo_path):
        with open(logo_path, "rb") as f:
            logo_base64 = base64.b64encode(f.read()).decode()
            logo_src = f"data:image/png;base64,{logo_base64}"
    else:
        logo_src = "" # Fallback

    html = f"""
    <div class="header">
        <div style="position:absolute; left:2rem; top:1rem;">
            <img src="{logo_src}" alt="ATS Logo" style="height:90px; width:auto; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,0.3);">
        </div>
        <div style="text-align:center; padding-left:120px;">
            <h1 style="color:white; margin:0; font-size:3.5em; font-weight:700; letter-spacing:2px;">Manara</h1>
            <p style="color:rgba(255,255,255,.9); font-size:1.2em; margin:8px 0 0 0;">Your Guide to ATS</p>
        </div>
        <div style="display:flex; justify-content:center; gap:12px; margin-top:12px; padding-left:120px;">
            <span class="lang-badge">العربية</span>
            <span class="lang-badge">English</span>
        </div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)

def features_html():
    """Generates the features section HTML."""
    html = """
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:15px;margin:20px 0;">
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Admissions</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Requirements, deadlines, procedures</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Fees & Costs</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Tuition, scholarships, payment</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Curriculum</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Programs, courses, schedules</p></div>
        <div class="section-card"><h4 style="color:#74c69d;margin:0 0 10px 0;">Locations</h4><p style="color:#d8f3dc;margin:0;font-size:.9em;">Campuses, facilities, contacts</p></div>
    </div>
    """
    st.markdown(html, unsafe_allow_html=True)



# --- Main Application Logic ---

def main():
    # 1. Header and Features
    header_html()
    features_html()
    
    # 2. Clear Chat Button
    col_clear = st.columns([3, 1])[1]
    with col_clear:
        if st.button("🗑️ Clear Chat", use_container_width=True, key="clear_chat_btn"):
            st.session_state.messages = []
            st.rerun()

    # 3. Layout for Chat and Sidebar
    col1, col2 = st.columns([3, 1])

    with col1:
        # Initialize chat history
        if "messages" not in st.session_state:
            st.session_state.messages = []

        # Display chat messages from history on app rerun
        for message in st.session_state.messages:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

        # Handle quick action button click to pre-fill the prompt
        prompt_value = st.session_state.get("prompt_input", "")
        
        # Use the pre-filled value if available, otherwise use empty string
        chat_input_placeholder = prompt_value if prompt_value else "Ask a question about ATS..."
        if prompt := st.chat_input(chat_input_placeholder, key="chat_input"):
            # Clear the pre-filled value after use
            if "prompt_input" in st.session_state:
                del st.session_state["prompt_input"]

            # Add user message to chat history
            st.session_state.messages.append({"role": "user", "content": prompt})
            with st.chat_message("user"):
                st.markdown(prompt)

            # Get bot response
            with st.chat_message("assistant"):
                # Check if the prompt is a simple greeting
                greeting_keywords = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "greetings", "howdy"]
                is_greeting = any(keyword in prompt.lower() for keyword in greeting_keywords) and len(prompt.split()) <= 3
                
                if is_greeting:
                    # Respond with a friendly greeting without using RAG
                    response = "Hello, my name is Manara. I'm a friendly bilingual assistant for Applied Technology Schools (ATS) in UAE. I'm here to help with any questions you may have about ATS. How can I assist you today?"
                else:
                    # Call the answer function with the query and chat history for actual questions
                    response = answer(prompt, st.session_state.messages)
                
                st.markdown(response)
            
            # Add bot response to chat history
            st.session_state.messages.append({"role": "assistant", "content": response})

    with col2:
        # Quick Actions Group
        st.markdown("""
        <div class="section-card">
            <h3 style="color:#74c69d;margin-top:0;">Quick Actions</h3>
            <p style="color:#d8f3dc;font-size:.9em;margin-bottom:15px;">Click to ask common questions:</p>
        </div>
        """, unsafe_allow_html=True)
        
        # The quick action buttons use session state to pre-fill the chat input
        if st.button("Admission Info", key="quick_action_Admission Info", use_container_width=True):
            st.session_state.prompt_input = "What are the admission requirements?"
            st.rerun()
        if st.button("Fee Structure", key="quick_action_Fee Structure", use_container_width=True):
            st.session_state.prompt_input = "How much are the tuition fees?"
            st.rerun()
        if st.button("Programs", key="quick_action_Programs", use_container_width=True):
            st.session_state.prompt_input = "What programs are available at ATS?"
            st.rerun()
        if st.button("Locations", key="quick_action_Locations", use_container_width=True):
            st.session_state.prompt_input = "Where are the ATS campuses located?"
            st.rerun()

        # About ATS Group
        st.markdown("""
        <div class="section-card">
            <h3 style="color:#74c69d;margin-top:0;">About ATS</h3>
            <p style="color:#d8f3dc;font-size:.9em;line-height:1.4;">
                Applied Technology Schools provide vocational and technical education in the UAE,
                offering industry-relevant programs and career-focused training.
            </p>
        </div>
        """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()
