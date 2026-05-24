import Hero from "@/components/home/Hero";
import Content from "@/components/home/Content";
import { getLatestPost } from "@/lib/wordpress";

export default async function Home() {
  const latestPost = await getLatestPost();

  return (
    <div className="myshkin-labs-home min-h-screen">
      <Hero latestPost={latestPost} />
      <Content />
    </div>
  );
}
