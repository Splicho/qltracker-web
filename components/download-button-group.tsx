"use client";

import { Button, ButtonGroup } from "@heroui/react";
import { useRouter } from "next/navigation";

import { ArrowRight, Download } from "@/components/icon";

type DownloadButtonGroupProps = {
  downloadHref: string;
  downloadLabel: string;
};

export function DownloadButtonGroup({
  downloadHref,
  downloadLabel,
}: DownloadButtonGroupProps) {
  const router = useRouter();

  return (
    <ButtonGroup size="lg">
      <Button
        className="rounded-l-full px-5 py-7 text-lg"
        onPress={() => window.open(downloadHref, "_blank", "noopener,noreferrer")}
      >
        {downloadLabel}
        <Download className="h-5 w-5" />
      </Button>
      <Button
        className="rounded-r-full px-4 py-7 text-lg"
        style={{
          backgroundColor: "color-mix(in oklab, var(--accent) 82%, white)",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.backgroundColor =
            "color-mix(in oklab, var(--accent) 72%, white)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.backgroundColor =
            "color-mix(in oklab, var(--accent) 82%, white)";
        }}
        onPress={() => router.push("/downloads")}
      >
        <ButtonGroup.Separator />
        All versions
        <ArrowRight className="h-5 w-5" />
      </Button>
    </ButtonGroup>
  );
}
