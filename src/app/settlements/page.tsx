
import SettlementsDashboard from "@/components/settlements/SettlementsDashboard";

// This page component now simply renders the client-side dashboard,
// which is responsible for fetching and managing its own data.
export default function SettlementsPage() {
  return <SettlementsDashboard />;
}
