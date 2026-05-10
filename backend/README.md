# ⚙️ ClosrAI — Backend

The powerful AI engine and API for ClosrAI, built with FastAPI, Python, and Gemini 2.0.

## 🚀 Key Features

- **Gemini 2.0 Integration:** Advanced email generation and sentiment analysis.
- **Autopilot Worker:** Background processing for automated multi-step outreach sequences using APScheduler.
- **Lead Discovery:** Integrated with Apollo.io and Hunter.io for high-quality data enrichment.
- **Email Delivery:** Secure and reliable sending via Resend API.
- **Database & Auth:** Seamless integration with Supabase (PostgreSQL).

## 🛠 Tech Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/)
- **Language:** Python 3.9+
- **AI Models:** Gemini 2.0 Flash, OpenRouter (Fallback)
- **Database:** Supabase (PostgreSQL)
- **Email:** Resend
- **Task Runner:** APScheduler
- **HTTP Client:** httpx

## 📦 Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables in `.env`:
   ```env
   GEMINI_API_KEY=your_gemini_key
   RESEND_API_KEY=your_resend_key
   OPENROUTER_API_KEY=your_openrouter_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_supabase_service_role_key
   HUNTER_API_KEY=your_hunter_key
   APOLLO_API_KEY=your_apollo_key
   ```

5. Start the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

## 🏗 API Overview

- `POST /generate_email`: Generates personalized email content using Gemini.
- `POST /send_email`: Triggers email delivery via Resend.
- `GET /search_leads`: Fetches leads from Apollo.io and Hunter.io.
- `Background Worker`: Automatically processes campaign sequences and updates lead statuses.
