import Hero from "@/components/home/Hero";
import Experiments from "@/components/home/Experiments";

export default async function Home() {
  return (
    <div className="myshkin-labs-home min-h-screen">
      <Hero />
      <Experiments />
    </div>
  );
}
