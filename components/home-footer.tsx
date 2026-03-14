import { Link } from "@heroui/react";

import {
  ArrowUpRight,
  Discord,
  Github,
  Steam,
  YouTube,
} from "@/components/icon";

const VIDEO_CREDIT_URL = "https://www.youtube.com/@apixelatedpointofview";

const SOCIAL_LINKS = [
  { label: "Discord", href: "discord://-/users/220994041712476161", Icon: Discord },
  { label: "YouTube", href: "https://youtube.com/@isevendeuceQL", Icon: YouTube },
  { label: "Steam", href: "https://steamcommunity.com/profiles/76561199171761827/", Icon: Steam },
  { label: "GitHub", href: "https://github.com/Splicho/QLTracker", Icon: Github },
];

export function HomeFooter() {
  return (
    <footer className="px-6 py-6 sm:px-10">
      <div className="relative flex items-center justify-center">
        <nav
          aria-label="Social links"
          className="flex items-center justify-center gap-3"
        >
          {SOCIAL_LINKS.map(({ label, href, Icon }) => (
            <Link
              key={label}
              aria-label={label}
              className="inline-flex h-11 w-11 items-center justify-center text-white/70 transition hover:text-white"
              href={href}
            >
              <Icon className="h-5 w-5" />
            </Link>
          ))}
        </nav>

        <p className="absolute right-0 text-sm text-white/60">
          video by{" "}
          <Link
            className="inline-flex items-center gap-1 text-white/80 lowercase tracking-tight transition hover:text-white"
            href={VIDEO_CREDIT_URL}
            rel="noreferrer"
            target="_blank"
          >
            PixelatedPointOfView
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </p>
      </div>
    </footer>
  );
}
