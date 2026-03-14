import { DownloadButtonGroup } from "@/components/download-button-group";

type HomeHeroProps = {
  downloadHref: string;
  downloadLabel: string;
};

export function HomeHero({ downloadHref, downloadLabel }: HomeHeroProps) {
  return (
    <section className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
      <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
        <h1 className="text-5xl font-light tracking-tightest text-white sm:text-6xl md:text-7xl lg:text-8xl">
          A modern Quake Live{" "}
          <span
            className="inline-block bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 68%, black))",
            }}
          >
            server browser
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl md:text-2xl">
          QLTracker combines Steam server discovery, qlstats enrichment,
          favorites, player lookups, and direct join flows in a desktop-first
          browser built for Quake Live.
        </p>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <DownloadButtonGroup
            downloadHref={downloadHref}
            downloadLabel={downloadLabel}
          />
        </div>
      </div>
    </section>
  );
}
