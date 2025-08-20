import { createFileRoute } from "@tanstack/react-router";
import { LicenseGeneratorPage } from "@/features/licenseGenerator/components/LicenseGeneratorPage";
import AdminLayout from "@/components/layouts/AdminLayout";

export const Route = createFileRoute("/_authenticated/admin/license-generator")(
  {
    component: LicenseGeneratorRoute,
  }
);

function LicenseGeneratorRoute() {
  return (
    <AdminLayout>
      <LicenseGeneratorPage />
    </AdminLayout>
  );
}
