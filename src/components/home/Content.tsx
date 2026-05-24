import Experiments from "@/components/home/Experiments";
import Notes from "@/components/home/Notes";
import Releases from "@/components/home/Releases";
import Instruments from "./Instruments";

export default function Content() {
  return (
    <div className="max-w-7xl px-4 py-4" style={{ margin: "0 auto" }}>
      <Experiments />
      <Notes />
      <Releases />
      <Instruments />
    </div>
  );
}
