import { APP_DESCRIPTION, APP_NAME, APP_URL } from "@/lib/constants";
import type { Metadata } from "next";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  path?: string;
}

export function generateMetadata({
  title,
  description = APP_DESCRIPTION,
  image,
  path = "",
}: SEOProps = {}): Metadata {
  const pageTitle = title ? `${title} | ${APP_NAME}` : APP_NAME;
  const url = `${APP_URL}${path}`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      url,
      siteName: APP_NAME,
      images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: image ? [image] : undefined,
    },
  };
}
