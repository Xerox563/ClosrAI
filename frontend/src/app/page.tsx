import { Hero } from "@/components/home/Hero";
import { Navbar } from "@/components/layout/Navbar";

export default function Home() {
  return (
    <main className="flex flex-col min-h-screen">
      <Navbar />
      <Hero />
    </main>
  );
}
