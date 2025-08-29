import { createFileRoute } from "@tanstack/react-router";
import { LicenseManagerPage } from "@/features/licenseManager/components/LicenseManagerPage";
import AdminLayout from "@/components/layouts/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin/license-manager")({
  component: LicenseManagerRoute,
});

function LicenseManagerRoute() {
  return (
    <AdminLayout>
      <LicenseManagerPage />
    </AdminLayout>
  );
}
