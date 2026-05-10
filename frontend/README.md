# 🎨 ClosrAI — Frontend

The user interface for ClosrAI, built with Next.js 15, React 19, and Tailwind CSS 4.

## 🚀 Key Features

- **Immersive 3D Landing Page:** Built with React Three Fiber, Drei, and GSAP.
- **Dynamic Dashboard:** Real-time lead management, campaign tracking, and search.
- **AI-Powered Lead Drawer:** Seamless interaction with Gemini for email generation.
- **State Management:** Lightweight and fast state handling with Zustand.
- **Analytics:** Beautiful charts and metrics using Recharts.

## 🛠 Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/), [GSAP](https://greensock.com/gsap/)
- **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Form Handling:** React Hook Form + Zod

## 📦 Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

## 🏗 Project Structure

- `src/app`: Next.js App Router pages and layouts.
- `src/components`: Reusable UI components (dashboard, home, layout).
- `src/lib`: Utilities and Supabase client configuration.
- `src/store`: Zustand store for global state.
- `public`: Static assets (SVG icons, etc.).
