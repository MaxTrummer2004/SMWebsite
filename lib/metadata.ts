import type { Metadata } from "next";

export const siteConfig = {
  name: "SMKnowers",
  description:
    "SMKnowers is the tiny 8-bit social club for friends. Drop posts, sling GIFs, and watch the pixels fly. Local-first — your feed lives in your browser.",
  url: "https://smknowers.app",
  ogImage: "/og-image.png",
  creator: "@smknowers",
} as const;

export const baseMetadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  creator: siteConfig.creator,
  publisher: siteConfig.name,
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    creator: siteConfig.creator,
  },
};

export function createMetadata({
  title,
  description,
  path = "/",
}: {
  title?: string;
  description?: string;
  path?: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: title ?? siteConfig.name,
      description: description ?? siteConfig.description,
      url: `${siteConfig.url}${path}`,
    },
  };
}
