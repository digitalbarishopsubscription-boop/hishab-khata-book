import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/customers")({
  staticData: { sitemap: false },
  component: CustomersLayout,
});

function CustomersLayout() {
  return <Outlet />;
}
