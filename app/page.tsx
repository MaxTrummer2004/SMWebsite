import { HomeClient } from "@/components/home-client";
import { createMetadata, siteConfig } from "@/lib/metadata";
import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = createMetadata({
  title: "Home",
  description: siteConfig.description,
  path: "/",
});

export default function HomePage(): ReactNode {
  return <HomeClient />;
}
