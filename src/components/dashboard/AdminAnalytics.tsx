import { Worker } from '@/types';
import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsKPIs from "./AnalyticsKPIs";
import AlertsManager from "./AlertsManager";

interface AdminAnalyticsProps {
  workers?: Worker[];
  isAdmin?: boolean;
}

export default function AdminAnalytics({ workers = [], isAdmin = true }: AdminAnalyticsProps) {
    
    const handleAction = () => {
        // This is a dummy handler for now, can be used to trigger data refetch
        // For example, by emitting a custom event
        window.dispatchEvent(new CustomEvent('data-updated'));
    }

    return (
        <div className="space-y-8">
            <AlertsManager workers={workers} isAdmin={isAdmin} />
            <AnalyticsKPIs />
            <AnalyticsCharts />
        </div>
    );
}
