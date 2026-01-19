import Hero from "@/components/home/Hero";
import Experiments from "@/components/home/Experiments";

export default async function Home() {
  return (
    <div className="myshkin-labs-home min-h-screen">
      <Hero />

      <div className="max-w-7xl px-4 py-4" style={{ margin: '0 auto' }}>
        <Experiments />
      </div>
    </div>
  );
}
