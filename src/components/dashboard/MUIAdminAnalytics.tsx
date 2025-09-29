import { Worker } from '@/types';
import MUIAnalyticsCharts from "./MUIAnalyticsCharts";
import AnalyticsKPIs from "./AnalyticsKPIs";
import EmployeesOnLeave from "./EmployeesOnLeave";
import LeaveRequestsAdmin from "./LeaveRequestsAdmin";
import AlertsManager from "./AlertsManager";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useTheme } from '@mui/material/styles';

interface MUIAdminAnalyticsProps {
  workers?: Worker[];
  isAdmin?: boolean;
}

export default function MUIAdminAnalytics({ workers = [], isAdmin = true }: MUIAdminAnalyticsProps) {
  const theme = useTheme();
    
  const handleAction = () => {
    // This is a dummy handler for now, can be used to trigger data refetch
    // For example, by emitting a custom event
    window.dispatchEvent(new CustomEvent('data-updated'));
  }

  return (
    <div className="space-y-8">
      <AlertsManager workers={workers} isAdmin={isAdmin} />
      <AnalyticsKPIs />
      
      {/* MUI Charts Section */}
      <MUIAnalyticsCharts />
      
      {/* Leave Information Cards */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>طلبات الإجازة المعلقة</span>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleAction()}
                >
                  تحديث
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <LeaveRequestsAdmin onAction={handleAction} itemCount={3} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6 }}>
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>حالة الإجازات المعتمدة</span>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => handleAction()}
                >
                  تحديث
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EmployeesOnLeave onAction={handleAction} />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </div>
  );
}