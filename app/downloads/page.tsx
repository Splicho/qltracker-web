import type { Metadata } from "next";
import Image from "next/image";
import { headers } from "next/headers";
import { Card, Chip, Link, buttonVariants } from "@heroui/react";

import { ArrowRight, ChevronDown, Download } from "@/components/icon";
import {
  getReleaseCatalog,
  getReleaseDownloadData,
  type ReleaseAsset,
} from "@/lib/download-target";
import { createPageMetadata } from "@/lib/seo";

type PlatformKey = "windows" | "linux";

type PlatformSection = {
  assets: ReleaseAsset[];
  key: PlatformKey;
  label: string;
};

const PLATFORM_SECTIONS: Array<Omit<PlatformSection, "assets">> = [
  { key: "windows", label: "Windows" },
  { key: "linux", label: "Linux" },
];

export const metadata: Metadata = createPageMetadata({
  title: "Downloads",
  path: "/downloads",
  description:
    "Download the latest QLTracker builds for Windows and Linux, browse release assets, and view GitHub release notes.",
});

function classifyAssetPlatform(name: string): PlatformKey | null {
  if (/\.exe$|windows|setup/i.test(name)) {
    return "windows";
  }

  if (/appimage|\.deb$|\.rpm$|linux/i.test(name)) {
    return "linux";
  }

  return null;
}

function formatAssetLabel(name: string): string {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".exe")) {
    if (lowerName.includes("arm64")) {
      return "Windows (ARM64)";
    }

    if (lowerName.includes("x64")) {
      return "Windows (x64)";
    }

    return "Windows";
  }

  if (lowerName.endsWith(".appimage")) {
    if (lowerName.includes("aarch64") || lowerName.includes("arm64")) {
      return "Linux AppImage (ARM64)";
    }

    if (lowerName.includes("amd64") || lowerName.includes("x64")) {
      return "Linux AppImage (x64)";
    }

    return "Linux AppImage";
  }

  if (lowerName.endsWith(".deb")) {
    if (lowerName.includes("arm64")) {
      return "Linux .deb (ARM64)";
    }

    if (lowerName.includes("amd64") || lowerName.includes("x64")) {
      return "Linux .deb (x64)";
    }

    return "Linux .deb";
  }

  if (lowerName.endsWith(".rpm")) {
    if (lowerName.includes("arm64")) {
      return "Linux RPM (ARM64)";
    }

    if (lowerName.includes("amd64") || lowerName.includes("x64")) {
      return "Linux RPM (x64)";
    }

    return "Linux RPM";
  }

  if (lowerName.endsWith(".dmg")) {
    if (lowerName.includes("arm64")) {
      return "macOS (ARM64)";
    }

    if (lowerName.includes("x64") || lowerName.includes("amd64")) {
      return "macOS (x64)";
    }

    if (lowerName.includes("universal")) {
      return "macOS Universal";
    }

    return "macOS";
  }

  if (lowerName.endsWith(".pkg")) {
    return "macOS Installer";
  }

  return name;
}

function rankAsset(name: string): number {
  const lowerName = name.toLowerCase();

  if (lowerName.endsWith(".exe") && lowerName.includes("x64")) {
    return 10;
  }

  if (lowerName.endsWith(".exe") && lowerName.includes("arm64")) {
    return 20;
  }

  if (lowerName.endsWith(".deb") && lowerName.includes("x64")) {
    return 30;
  }

  if (lowerName.endsWith(".deb") && lowerName.includes("arm64")) {
    return 40;
  }

  if (lowerName.endsWith(".rpm") && lowerName.includes("x64")) {
    return 50;
  }

  if (lowerName.endsWith(".rpm") && lowerName.includes("arm64")) {
    return 60;
  }

  if (lowerName.endsWith(".appimage") && lowerName.includes("x64")) {
    return 70;
  }

  if (lowerName.endsWith(".appimage") && lowerName.includes("arm64")) {
    return 80;
  }

  return 999;
}

function groupAssetsByPlatform(assets: ReleaseAsset[]): PlatformSection[] {
  const grouped: PlatformSection[] = PLATFORM_SECTIONS.map((section) => ({
    ...section,
    assets: [],
  }));

  for (const asset of assets) {
    const platform = classifyAssetPlatform(asset.name);

    if (!platform) {
      continue;
    }

    const target = grouped.find((section) => section.key === platform);

    if (target) {
      target.assets.push(asset);
    }
  }

  for (const section of grouped) {
    section.assets.sort((left, right) => rankAsset(left.name) - rankAsset(right.name));
  }

  return grouped;
}

export default async function DownloadsPage() {
  const requestHeaders = await headers();
  const [releases, releaseData] = await Promise.all([
    getReleaseCatalog(),
    getReleaseDownloadData(requestHeaders.get("user-agent") ?? ""),
  ]);

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#050505_0%,#121212_100%)] px-6 py-8 text-white sm:px-10 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-col gap-10">
        <header className="flex items-center justify-between gap-4">
          <Link aria-label="QLTracker home" className="inline-flex items-center" href="/">
            <Image
              alt="QLTracker"
              height={51}
              priority
              src="/images/logo.png"
              width={176}
            />
          </Link>

          <Link className="text-sm text-white/70 transition hover:text-white" href="/">
            Back home
          </Link>
        </header>

        <section className="grid gap-6 p-8 sm:grid-cols-[8rem_1fr] sm:items-center">
          <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] border border-white/10 bg-white/5">
            <Image
              alt="QLTracker app icon"
              className="h-20 w-20 object-contain"
              height={180}
              priority
              src="/apple-touch-icon.png"
              width={180}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
                Download QLTracker
              </h1>
              <p className="text-lg text-white/70 sm:text-2xl">
                Available for Windows and Linux.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                className={buttonVariants({
                  size: "lg",
                  className:
                    "inline-flex items-center gap-2 rounded-full px-8 py-6 text-base",
                })}
                href={releaseData.downloadTarget.href}
                rel="noreferrer"
                target="_blank"
              >
                {releaseData.downloadTarget.label}
                <Download className="h-5 w-5" />
              </Link>

              {releaseData.version ? (
                <p className="text-sm uppercase tracking-[0.16em] text-white/50">
                  Latest {releaseData.version}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <section className="space-y-3">
          {releases.length > 0 ? (
            releases.map((release, index) => {
              const groupedAssets = groupAssetsByPlatform(release.assets);

              return (
                <details
                  key={release.version}
                  className="group border-b border-white/10 px-0 py-4"
                  open={index === 0}
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-3xl font-medium tracking-tight">
                        {release.version}
                      </h2>
                      {index === 0 ? (
                        <Chip
                          className="rounded-full border border-white/20 bg-transparent text-white"
                          color="default"
                          variant="tertiary"
                        >
                          Latest
                        </Chip>
                      ) : null}
                      {release.isPrerelease ? (
                        <Chip
                          className="rounded-full border border-white/20 bg-transparent text-white"
                          color="warning"
                          variant="tertiary"
                        >
                          Pre-release
                        </Chip>
                      ) : null}
                    </div>

                    <ChevronDown className="h-5 w-5 transition duration-200 group-open:rotate-180" />
                  </summary>

                  <div className="mt-4 space-y-6">
                    <div className="grid gap-4 xl:grid-cols-2">
                      {groupedAssets.map((section) => (
                        <Card
                          key={`${release.version}-${section.key}`}
                          className="border border-white/10 bg-white/5 text-white"
                        >
                          <Card.Header className="border-b border-white/10 pb-4">
                            <Card.Title className="text-xl font-medium text-white">
                              {section.label}
                            </Card.Title>
                          </Card.Header>

                          <Card.Content className="pt-0">
                            {section.assets.length > 0 ? (
                              <div className="divide-y divide-white/10">
                                {section.assets.map((asset) => (
                                  <Link
                                    key={asset.name}
                                    className="flex w-full items-center justify-between gap-4 rounded-none py-4 text-base text-white transition hover:text-white/75"
                                    href={asset.browser_download_url}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <span>{formatAssetLabel(asset.name)}</span>
                                    <Download className="h-5 w-5 shrink-0" />
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <div className="py-6 text-base text-white/45">
                                No builds listed yet.
                              </div>
                            )}
                          </Card.Content>
                        </Card>
                      ))}
                    </div>

                    <Link
                      className="inline-flex items-center gap-2 text-sm text-accent transition hover:text-accent"
                      href={release.href}
                      rel="noreferrer"
                      target="_blank"
                    >
                      View release notes
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </details>
              );
            })
          ) : (
            <Card className="border border-white/10 bg-white/5 text-white">
              <Card.Content className="py-10 text-white/70">
                Releases are unavailable right now. Check the GitHub releases
                page again shortly.
              </Card.Content>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
