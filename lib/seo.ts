import type { Metadata } from "next";

export const siteConfig = {
  name: "QLTracker",
  shortName: "QLTracker",
  creator: "isevendeuce",
  description:
    "Modern Quake Live server browser with smart downloads, release tracking, favorites, player lookups, and desktop-first server discovery.",
  keywords: [
    "QLTracker",
    "Quake Live",
    "server browser",
    "Quake Live server browser",
    "Quake Live download",
    "qlstats",
    "Steam server browser",
    "desktop app",
  ],
  ogImage: {
    alt: "QLTracker preview",
    height: 852,
    url: "/images/og-image.jpg",
    width: 1362,
  },
} as const;

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (!envUrl) {
    return "http://localhost:3000";
  }

  if (envUrl.startsWith("http://") || envUrl.startsWith("https://")) {
    return envUrl;
  }

  return `https://${envUrl}`;
}

export function createPageMetadata({
  description,
  path,
  title,
}: {
  description?: string;
  path: string;
  title?: string;
}): Metadata {
  const resolvedDescription = description ?? siteConfig.description;
  const resolvedTitle = title ?? siteConfig.name;

  return {
    title,
    description: resolvedDescription,
    alternates: {
      canonical: path,
    },
    openGraph: {
      description: resolvedDescription,
      images: [siteConfig.ogImage],
      locale: "en_US",
      siteName: siteConfig.name,
      title: resolvedTitle,
      type: "website",
      url: path,
    },
    twitter: {
      card: "summary_large_image",
      description: resolvedDescription,
      images: [siteConfig.ogImage.url],
      title: resolvedTitle,
    },
  };
}
