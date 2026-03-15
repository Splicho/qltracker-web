"use client";

import { useState } from "react";
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
  const [pendingAction, setPendingAction] = useState<"download" | "versions" | null>(
    null,
  );

  return (
    <ButtonGroup size="lg">
      <Button
        className="rounded-l-full px-5 py-7 text-lg"
        isDisabled={pendingAction !== null}
        isPending={pendingAction === "download"}
        onPress={() => {
          setPendingAction("download");
          window.open(downloadHref, "_blank", "noopener,noreferrer");
          window.setTimeout(() => {
            setPendingAction(null);
          }, 500);
        }}
      >
        {downloadLabel}
        <Download className="h-5 w-5" />
      </Button>
      <Button
        className="rounded-r-full px-4 py-7 text-lg"
        isDisabled={pendingAction !== null}
        isPending={pendingAction === "versions"}
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
        onPress={() => {
          setPendingAction("versions");
          router.push("/downloads");
        }}
      >
        <ButtonGroup.Separator />
        All versions
        <ArrowRight className="h-5 w-5" />
      </Button>
    </ButtonGroup>
  );
}
