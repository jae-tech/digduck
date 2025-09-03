import { createFileRoute } from "@tanstack/react-router";
import { requireAuth } from "@/middleware/auth.middleware";
import { ShoppingInsightsPage } from "@/features/crawler";

export const Route = createFileRoute("/_authenticated/crawler/insights")({
  beforeLoad: requireAuth,
  component: ShoppingInsightsPage,
});