import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/middleware/auth.middleware";
import { CrawlerPage } from "@/features/crawler";

export const Route = createFileRoute("/_authenticated/crawler")({
  beforeLoad: requireAuth,
  component: CrawlerPage,
});
