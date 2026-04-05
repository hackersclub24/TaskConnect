import { useEffect } from "react";

const SITE_NAME = "Skillstreet";

const ensureMetaTag = (selector, attrs) => {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(attrs).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }
  return tag;
};

const ensureCanonicalTag = () => {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  return link;
};

const upsertStructuredData = (data) => {
  const existing = document.getElementById("seo-structured-data");
  if (!data) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  const script = existing || document.createElement("script");
  script.id = "seo-structured-data";
  script.setAttribute("type", "application/ld+json");
  script.textContent = JSON.stringify(data);

  if (!existing) {
    document.head.appendChild(script);
  }
};

const toAbsoluteUrl = (baseUrl, pathOrUrl = "/") => {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    return pathOrUrl;
  }
  return new URL(pathOrUrl, `${baseUrl}/`).toString();
};

const SeoManager = ({
  title,
  description,
  path,
  image = "/skillstreet-icon.png",
  robots = "index, follow",
  type = "website",
  structuredData = null
}) => {
  useEffect(() => {
    const baseUrl = (import.meta.env.VITE_SITE_URL || window.location.origin || "").replace(/\/$/, "");
    const currentPath = path || `${window.location.pathname}${window.location.search}`;
    const canonicalUrl = toAbsoluteUrl(baseUrl, currentPath);
    const imageUrl = toAbsoluteUrl(baseUrl, image);
    const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} | Student Task & Skill Exchange Platform`;

    document.title = fullTitle;

    ensureMetaTag('meta[name="description"]', { name: "description" }).setAttribute(
      "content",
      description
    );
    ensureMetaTag('meta[name="robots"]', { name: "robots" }).setAttribute("content", robots);

    ensureMetaTag('meta[property="og:title"]', { property: "og:title" }).setAttribute(
      "content",
      fullTitle
    );
    ensureMetaTag('meta[property="og:description"]', { property: "og:description" }).setAttribute(
      "content",
      description
    );
    ensureMetaTag('meta[property="og:type"]', { property: "og:type" }).setAttribute("content", type);
    ensureMetaTag('meta[property="og:url"]', { property: "og:url" }).setAttribute("content", canonicalUrl);
    ensureMetaTag('meta[property="og:image"]', { property: "og:image" }).setAttribute(
      "content",
      imageUrl
    );
    ensureMetaTag('meta[property="og:site_name"]', { property: "og:site_name" }).setAttribute(
      "content",
      SITE_NAME
    );

    ensureMetaTag('meta[name="twitter:card"]', { name: "twitter:card" }).setAttribute(
      "content",
      "summary_large_image"
    );
    ensureMetaTag('meta[name="twitter:title"]', { name: "twitter:title" }).setAttribute(
      "content",
      fullTitle
    );
    ensureMetaTag('meta[name="twitter:description"]', { name: "twitter:description" }).setAttribute(
      "content",
      description
    );
    ensureMetaTag('meta[name="twitter:image"]', { name: "twitter:image" }).setAttribute(
      "content",
      imageUrl
    );

    ensureCanonicalTag().setAttribute("href", canonicalUrl);

    if (structuredData) {
      upsertStructuredData(structuredData);
    } else {
      upsertStructuredData(null);
    }
  }, [title, description, path, image, robots, type, structuredData]);

  return null;
};

export default SeoManager;
