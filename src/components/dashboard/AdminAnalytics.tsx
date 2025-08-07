import AnalyticsCharts from "./AnalyticsCharts";
import AnalyticsKPIs from "./AnalyticsKPIs";
import EmployeesOnLeave from "./EmployeesOnLeave";
import LeaveRequestsAdmin from "./LeaveRequestsAdmin";


export default function AdminAnalytics() {
    
    const handleAction = () => {
        // This is a dummy handler for now, can be used to trigger data refetch
        // For example, by emitting a custom event
        window.dispatchEvent(new CustomEvent('data-updated'));
    }

    return (
        <div className="space-y-8">
            <AnalyticsKPIs />
            <AnalyticsCharts />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LeaveRequestsAdmin onAction={handleAction} />
                <EmployeesOnLeave onAction={handleAction}/>
            </div>
        </div>
    );
}
