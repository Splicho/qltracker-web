const RELEASES_API_URL =
  "https://api.github.com/repos/Splicho/QLTracker/releases?per_page=10";
const RELEASES_PAGE_URL = "https://github.com/Splicho/QLTracker/releases";
const RELEASES_REVALIDATE_SECONDS = 60;

type Platform = "windows" | "macos" | "linux" | "unknown";
type Architecture = "x64" | "arm64" | "unknown";

type GitHubReleaseAsset = {
  browser_download_url: string;
  name: string;
};

export type ReleaseAsset = GitHubReleaseAsset;

type GitHubRelease = {
  assets: ReleaseAsset[];
  draft: boolean;
  html_url: string;
  prerelease: boolean;
  published_at: string;
  tag_name: string;
};

export type DownloadTarget = {
  href: string;
  label: string;
};

export type ReleaseDownloadData = {
  downloadTarget: DownloadTarget;
  version: string | null;
};

export type ReleaseEntry = {
  assets: ReleaseAsset[];
  href: string;
  isPrerelease: boolean;
  publishedAt: string;
  version: string;
};

function detectPlatform(userAgent: string): Platform {
  if (/windows/i.test(userAgent)) {
    return "windows";
  }

  if (/mac os|macintosh/i.test(userAgent)) {
    return "macos";
  }

  if (/linux|x11/i.test(userAgent)) {
    return "linux";
  }

  return "unknown";
}

function detectArchitecture(userAgent: string): Architecture {
  if (/arm64|aarch64/i.test(userAgent)) {
    return "arm64";
  }

  if (/x86_64|win64|wow64|x64|amd64|intel/i.test(userAgent)) {
    return "x64";
  }

  return "unknown";
}

function getPlatformLabel(platform: Platform): string {
  switch (platform) {
    case "windows":
      return "Windows";
    case "macos":
      return "macOS";
    case "linux":
      return "Linux";
    default:
      return "your OS";
  }
}

function isDownloadableAsset(asset: GitHubReleaseAsset): boolean {
  return asset.name !== "latest.json" && !asset.name.endsWith(".sig");
}

function findAsset(
  assets: GitHubReleaseAsset[],
  patterns: RegExp[],
): GitHubReleaseAsset | undefined {
  return assets.find((asset) =>
    patterns.some((pattern) => pattern.test(asset.name)),
  );
}

function pickAssetForPlatform(
  assets: GitHubReleaseAsset[],
  platform: Platform,
  architecture: Architecture,
): GitHubReleaseAsset | undefined {
  const downloadableAssets = assets.filter(isDownloadableAsset);

  if (platform === "windows") {
    if (architecture === "arm64") {
      return (
        findAsset(downloadableAssets, [/arm64-setup\.exe$/i]) ??
        findAsset(downloadableAssets, [/arm64\.exe$/i]) ??
        findAsset(downloadableAssets, [/\.exe$/i]) ??
        findAsset(downloadableAssets, [/setup\.exe$/i]) ??
        findAsset(downloadableAssets, [/x64-setup\.exe$/i])
      );
    }

    return (
      findAsset(downloadableAssets, [/x64-setup\.exe$/i]) ??
      findAsset(downloadableAssets, [/x64\.exe$/i]) ??
      findAsset(downloadableAssets, [/\.exe$/i]) ??
      findAsset(downloadableAssets, [/setup\.exe$/i]) ??
      findAsset(downloadableAssets, [/arm64-setup\.exe$/i])
    );
  }

  if (platform === "linux") {
    if (architecture === "arm64") {
      return (
        findAsset(downloadableAssets, [/aarch64\.AppImage$/i]) ??
        findAsset(downloadableAssets, [/arm64\.AppImage$/i]) ??
        findAsset(downloadableAssets, [/arm64\.deb$/i]) ??
        findAsset(downloadableAssets, [/AppImage$/i]) ??
        findAsset(downloadableAssets, [/\.deb$/i])
      );
    }

    return (
      findAsset(downloadableAssets, [/amd64\.AppImage$/i]) ??
      findAsset(downloadableAssets, [/x64\.AppImage$/i]) ??
      findAsset(downloadableAssets, [/amd64\.deb$/i]) ??
      findAsset(downloadableAssets, [/x64\.deb$/i]) ??
      findAsset(downloadableAssets, [/AppImage$/i]) ??
      findAsset(downloadableAssets, [/\.deb$/i])
    );
  }

  if (platform === "macos") {
    return findAsset(downloadableAssets, [/\.dmg$/i, /\.pkg$/i, /mac/i]);
  }

  return undefined;
}

function normalizeVersion(tagName: string): string {
  return tagName.replace(/^v/i, "");
}

async function getLatestRelease(): Promise<GitHubRelease | null> {
  const releases = await fetchReleases();
  return releases.find((entry) => !entry.draft) ?? null;
}

async function fetchReleases(): Promise<GitHubRelease[]> {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "qltracker-web",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: RELEASES_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`GitHub releases request failed: ${response.status}`);
  }

  return (await response.json()) as GitHubRelease[];
}

export async function getReleaseCatalog(): Promise<ReleaseEntry[]> {
  try {
    const releases = await fetchReleases();

    return releases
      .filter((entry) => !entry.draft)
      .map((entry) => ({
        assets: entry.assets.filter(isDownloadableAsset),
        href: entry.html_url,
        isPrerelease: entry.prerelease,
        publishedAt: entry.published_at,
        version: normalizeVersion(entry.tag_name),
      }));
  } catch {
    return [];
  }
}

export async function getReleaseDownloadData(
  userAgent: string,
): Promise<ReleaseDownloadData> {
  const platform = detectPlatform(userAgent);
  const architecture = detectArchitecture(userAgent);

  try {
    const release = await getLatestRelease();

    if (!release) {
      return {
        downloadTarget: {
          href: RELEASES_PAGE_URL,
          label: "View releases",
        },
        version: null,
      };
    }

    const asset = pickAssetForPlatform(release.assets, platform, architecture);

    if (asset) {
      return {
        downloadTarget: {
          href: asset.browser_download_url,
          label: `Download for ${getPlatformLabel(platform)}`,
        },
        version: normalizeVersion(release.tag_name),
      };
    }

    return {
      downloadTarget: {
        href: release.html_url,
        label:
          platform === "unknown"
            ? "View downloads"
            : `View ${getPlatformLabel(platform)} downloads`,
      },
      version: normalizeVersion(release.tag_name),
    };
  } catch {
    return {
      downloadTarget: {
        href: RELEASES_PAGE_URL,
        label: platform === "unknown" ? "View releases" : "Download",
      },
      version: null,
    };
  }
}

export async function getDownloadTarget(
  userAgent: string,
): Promise<DownloadTarget> {
  const releaseData = await getReleaseDownloadData(userAgent);
  return releaseData.downloadTarget;
}
