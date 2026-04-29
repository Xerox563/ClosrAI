import { LandingPage } from "@/components/home/LandingPage";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <LandingPage />
    </main>
  );
}
