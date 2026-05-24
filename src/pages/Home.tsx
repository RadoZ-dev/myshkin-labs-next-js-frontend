import Hero from "@/components/home/Hero";
import Content from "@/components/home/Content";

export default async function Home() {
  return (
    <div className="myshkin-labs-home min-h-screen">
      <Hero />
      <Content />
    </div>
  );
}
