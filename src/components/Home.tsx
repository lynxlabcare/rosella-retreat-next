import { Navigation } from "./Navigation";
import { Hero } from "./Hero";
import { TheVibe } from "./TheVibe";
import { Interlude } from "./Interlude";
import { Amenities } from "./Amenities";
import { ChapterThree } from "./ChapterThree";
import { InsideLook } from "./InsideLook";
import { Gallery } from "./Gallery";
import { SocialProof } from "./SocialProof";
import { Footer } from "./Footer";

export function Home() {
  return (
    <div className="flex flex-col relative w-full overflow-x-clip" style={{ backgroundColor: "var(--rr-bg)" }}>
      <Navigation />
      <Hero />
      <TheVibe />
      <Interlude />
      <InsideLook />
      <ChapterThree />
      <Amenities />
      <Gallery />
      <SocialProof />
      <Footer />
    </div>
  );
}