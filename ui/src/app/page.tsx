import { ScanHistoryScreen } from "@/components/claimguard/scan-history-screen";
import { MOCK_SCANS } from "@/lib/mock";

export default function Home() {
  return <ScanHistoryScreen scans={MOCK_SCANS} />;
}
