# 🚀 ClosrAI — AI Sales Autopilot

[![Next.js](https://img.shields.io/badge/Next.js-000?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Gemini_2.0-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)

ClosrAI is a production-grade, 24/7 Virtual Sales Representative designed to automate the most time-consuming parts of the sales cycle. From discovering high-intent leads to crafting hyper-personalized outreach and managing multi-step follow-ups, ClosrAI acts as your AI-powered sales engine.

---

## 💡 The Idea

**Why ClosrAI?**
In modern sales, you're often forced to choose between **quantity** and **quality**. Sending 1,000 generic emails feels like spam and gets ignored, while manually researching 10 leads a day is too slow to hit growth targets.

**The Problem:**
Founders and sales teams spend up to 70% of their time on "pre-sales" grunt work: searching for leads, verifying emails, finding LinkedIn profiles, and staring at a blank screen trying to write a personalized message.

**The Solution:**
ClosrAI was built to bridge this gap. By integrating world-class lead databases (Apollo/Hunter) with cutting-edge AI (Gemini 2.0), we've created a system that handles the research and copywriting at scale. It’s not just an automation tool; it’s an **AI Sales Autopilot** that ensures every outreach feels personal, timely, and relevant, 24/7.

---

## ✨ Core Features

### 🔍 AI Lead Discovery & Enrichment
*   **Apollo.io & Hunter.io Integration:** Directly search for leads within the platform. Fetch verified emails, LinkedIn profiles, and company data in seconds.
*   **Smart Search:** Use natural language or targeted keywords to find your ideal customer profile (ICP).

### ✍️ Hyper-Personalized Outreach
*   **Gemini 2.0 Engine:** Leveraging Google's latest LLM to write emails that don't feel like templates. Each message is tailored to the lead's role, company, and bio.
*   **One-Click Generation:** Generate professional, high-converting pitches instantly from the lead drawer.

### ⛓️ Multi-Step Automated Sequences
*   **Set-and-Forget Campaigns:** Build complex outreach sequences with custom delays between steps.
*   **Autopilot Mode:** Our background worker (APScheduler) handles the heavy lifting, sending follow-ups automatically based on your schedule.

### 📊 Real-Time Analytics & Tracking
*   **Outreach History:** A comprehensive log of every email sent, including timestamps and content.
*   **Status Management:** Track leads through the funnel—from "New" to "Emailed" to "Replied."

### 🎨 Immersive User Experience
*   **Modern Dashboard:** A sleek, dark-themed interface built with Tailwind CSS 4 and Framer Motion.
*   **3D Visuals:** A stunning landing page featuring React Three Fiber and GSAP for a high-end brand feel.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/)
- **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Three.js](https://threejs.org/)
- **State Management:** [Zustand](https://github.com/pmndrs/zustand)
- **Icons:** [Lucide React](https://lucide.dev/)

### Backend
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python)
- **AI Models:** [Gemini 2.0 Flash](https://ai.google.dev/), [OpenRouter](https://openrouter.ai/)
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL)
- **Email Delivery:** [Resend](https://resend.com/)
- **Task Scheduling:** [APScheduler](https://apscheduler.readthedocs.io/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Supabase Account
- Gemini API Key
- Resend API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and install dependencies:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Create a `.env` file in `/backend` with:
   ```env
   GEMINI_API_KEY=your_key
   RESEND_API_KEY=your_key
   SUPABASE_URL=your_url
   SUPABASE_KEY=your_key
   APOLLO_API_KEY=your_key
   HUNTER_API_KEY=your_key
   ```
4. Start the server:
   ```bash
   uvicorn main:app --reload --port 8001
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in `/frontend` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

---

## 📈 Platform Flow

1.  **Configure:** Set your "Sender Name" and "Calendly Link" in **Settings**.
2.  **Create:** Build a new outreach campaign in **Campaigns**.
3.  **Discover:** Use the **Search** tab to find leads via Apollo.io and add them to your campaign.
4.  **Engage:** Open a lead in the **Leads** dashboard, generate a personalized email via Gemini, and send it instantly.
5.  **Monitor:** Track progress and sequence status in the **Outreach** and **Analytics** tabs.

---

## 📄 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Built with ❤️ by the Amit just for everyones use !!.
