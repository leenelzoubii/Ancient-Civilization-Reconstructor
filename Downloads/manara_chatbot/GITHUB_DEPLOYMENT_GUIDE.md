# Manara Chatbot - GitHub & Streamlit Cloud Deployment Guide

## Overview

This guide provides step-by-step instructions to deploy your Manara chatbot on **Streamlit Community Cloud** (free hosting) using GitHub.

---

## Files to Upload to GitHub

The following files and folders **MUST** be included in your GitHub repository:

```
manara-chatbot/
├── app.py                          # Main Streamlit application
├── rag_chat.py                     # RAG logic with GPT-4o-mini
├── requirements.txt                # Python dependencies (IMPORTANT: rename from requirements_streamlit.txt)
├── .gitignore                      # Prevents .env from being uploaded
├── kb_index/                       # Knowledge base index (REQUIRED)
│   ├── faiss.index
│   ├── texts.npy
│   └── sources.npy
├── data/                           # Original source documents (RECOMMENDED)
│   ├── ATSEducationPlan2025-26.pdf
│   ├── ATS-Policies-Procedures-2024-2025.pdf
│   ├── ... (other documents)
└── logo.png                        # Logo image (if used in the app)
```

**CRITICAL:** Do NOT include the `.env` file in your GitHub repository. Your API key will be added as a **Secret** in Streamlit Cloud.

---

## Step-by-Step Deployment Instructions

### Part A: Prepare Your Local Repository

#### Step 1: Download and Extract the Project

1. Extract the `manara_chatbot_final_github.tar.gz` file to your local machine.
2. Navigate to the extracted folder in your terminal:
   ```bash
   cd /path/to/manara_chatbot
   ```

#### Step 2: Rename the Requirements File

Rename `requirements_streamlit.txt` to `requirements.txt`:

```bash
mv requirements_streamlit.txt requirements.txt
```

#### Step 3: Create a `.gitignore` File

Create a file named `.gitignore` in the project root with the following content:

```
.env
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
*.so
*.egg
*.egg-info/
dist/
build/
.streamlit/secrets.toml
```

This ensures your API key is never accidentally uploaded to GitHub.

#### Step 4: Initialize Git Repository

```bash
git init
git add .
git commit -m "Initial commit: Manara Chatbot with GPT-4o-mini and RAG"
```

---

### Part B: Create GitHub Repository and Push Code

#### Step 1: Create a New Repository on GitHub

1. Go to [GitHub.com](https://github.com) and log in.
2. Click the **"+"** icon in the top right and select **"New repository"**.
3. Name your repository (e.g., `manara-chatbot`).
4. Choose **Public** (required for Streamlit Cloud free tier).
5. Click **"Create repository"**.

#### Step 2: Push Your Code to GitHub

After creating the repository, GitHub will provide instructions. Follow them or use these commands:

```bash
git remote add origin https://github.com/YOUR_USERNAME/manara-chatbot.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

---

### Part C: Deploy on Streamlit Community Cloud

#### Step 1: Sign Up for Streamlit Cloud

1. Go to [share.streamlit.io](https://share.streamlit.io/).
2. Click **"Sign in with GitHub"** and authorize Streamlit to access your GitHub account.

#### Step 2: Create a New App

1. Click **"New app"** button.
2. Fill in the deployment details:
   - **Repository**: Select `YOUR_USERNAME/manara-chatbot`
   - **Branch**: Select `main`
   - **Main file path**: Enter `app.py`

#### Step 3: Add Secrets (API Key)

1. Click **"Advanced settings"** at the bottom of the deployment form.
2. Scroll to **"Secrets"** section.
3. Click **"Add secret"** and enter:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: `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`

#### Step 4: Deploy

1. Click the **"Deploy!"** button.
2. Streamlit will install dependencies and launch your app.
3. Once deployed, you'll receive a public URL (e.g., `https://manara-chatbot.streamlit.app`).

---

## Updating Your App

To update your app after deployment:

1. Make changes to your local files.
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: [describe your changes]"
   git push origin main
   ```
3. Streamlit Cloud will automatically detect the changes and redeploy your app.

---

## Troubleshooting

### Issue: "OPENAI_API_KEY missing in .env file"

**Solution**: Ensure you've added the `OPENAI_API_KEY` secret in Streamlit Cloud's advanced settings.

### Issue: "ModuleNotFoundError"

**Solution**: Ensure all dependencies are listed in `requirements.txt`. You can check by running locally:
```bash
pip install -r requirements.txt
```

### Issue: App is slow or timing out

**Solution**: The re-ranking process can be slow on the first run. Streamlit Cloud may have resource limitations. Consider reducing the `k` parameter in `rag_chat.py` from 30 to 20 if needed.

---

## Cost Considerations

- **Streamlit Community Cloud**: Free tier is available with some limitations (e.g., app sleeps after 1 hour of inactivity).
- **OpenAI API (GPT-4o-mini)**: Pay-as-you-go. The `gpt-4o-mini` model is one of the cheapest options. Monitor your usage at [platform.openai.com/account/usage](https://platform.openai.com/account/usage).

---

## Support

For issues with Streamlit Cloud, visit: [Streamlit Docs](https://docs.streamlit.io/)

For issues with OpenAI API, visit: [OpenAI Docs](https://platform.openai.com/docs/)

---

**Congratulations!** Your Manara Chatbot is now live on the internet. 🎉
