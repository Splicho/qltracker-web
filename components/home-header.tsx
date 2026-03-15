import Link from "next/link";
import Image from "next/image";

type HomeHeaderProps = {
  version: string | null;
};

export function HomeHeader({ version }: HomeHeaderProps) {
  return (
    <header className="px-6 py-6 sm:px-10">
      <Link
        aria-label="QLTracker home"
        className="inline-flex items-center gap-4"
        href="/"
      >
        <Image
          alt="QLTracker"
          height={51}
          priority
          src="/images/logo.png"
          width={176}
        />
        {version ? (
          <span className="text-sm font-medium tracking-[0.14em] text-white/70 uppercase">
            {version}
          </span>
        ) : null}
      </Link>
    </header>
  );
}
