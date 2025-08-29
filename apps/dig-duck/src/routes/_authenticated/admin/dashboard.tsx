import AdminLayout from "@/components/layouts/AdminLayout";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <AdminLayout>
      <div>Hello "/_authenticated/admin/dashboard"!</div>;
    </AdminLayout>
  );
}
