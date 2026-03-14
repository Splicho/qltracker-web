import { headers } from "next/headers";

import { HomeFooter } from "@/components/home-footer";
import { HomeHeader } from "@/components/home-header";
import { HomeHero } from "@/components/home-hero";
import { getReleaseDownloadData } from "@/lib/download-target";

const VIDEO_SRC = "/video/video.webm";

export default async function Home() {
  const requestHeaders = await headers();
  const releaseData = await getReleaseDownloadData(
    requestHeaders.get("user-agent") ?? "",
  );

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black text-white">
      <video
        autoPlay
        className="absolute inset-0 h-full w-full object-cover"
        loop
        muted
        playsInline
      >
        <source src={VIDEO_SRC} type="video/webm" />
      </video>
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-black" />

      <div className="relative z-10 flex h-full flex-col">
        <HomeHeader version={releaseData.version} />
        <HomeHero
          downloadHref={releaseData.downloadTarget.href}
          downloadLabel={releaseData.downloadTarget.label}
        />
        <HomeFooter />
      </div>
    </main>
  );
}
