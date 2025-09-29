'use client';

import { useState, useRef } from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions,
  Button, 
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Switch,
  AppBar,
  Toolbar,
  IconButton,
  Avatar,
  Badge,
  Chip,
  LinearProgress,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import { 
  AccountCircle, 
  Email, 
  Phone, 
  Home, 
  Notifications, 
  Settings, 
  Person,
  CheckCircle,
  Error,
  Info,
  Warning,
  Print
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useTheme } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

// Mock data for DataGrid
const rows = [
  { id: 1, name: 'أحمد محمد', position: 'مطور برمجيات', department: 'تقنية المعلومات', salary: 8500, status: 'active' },
  { id: 2, name: 'فاطمة علي', position: 'محللة مالية', department: 'المالية', salary: 7500, status: 'on-leave' },
  { id: 3, name: 'سارة عبدالله', position: 'مديرة موارد بشرية', department: 'الموارد البشرية', salary: 9500, status: 'active' },
  { id: 4, name: 'محمد حسن', position: 'مصمم جرافيك', department: 'التسويق', salary: 6500, status: 'active' },
  { id: 5, name: 'نورا أحمد', position: 'مسؤولة إدارية', department: 'الإدارة', salary: 5500, status: 'pending' },
];

const columns: GridColDef[] = [
  { field: 'id', headerName: 'الرقم', width: 90 },
  { field: 'name', headerName: 'الاسم', width: 150 },
  { field: 'position', headerName: 'الوظيفة', width: 150 },
  { field: 'department', headerName: 'القسم', width: 150 },
  { 
    field: 'salary', 
    headerName: 'الراتب (ريال)', 
    width: 120, 
    valueFormatter: (params: any) => {
      if (params.value == null) return '';
      return Number(params.value).toLocaleString('ar-SA');
    } 
  },
  {
    field: 'status',
    headerName: 'الحالة',
    width: 120,
    renderCell: (params: any) => {
      const statusMap: Record<string, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
        active: { label: 'نشط', color: 'success' },
        'on-leave': { label: 'إجازة', color: 'warning' },
        pending: { label: 'قيد الانتظار', color: 'info' },
      };
      const status = statusMap[params.value] || { label: params.value, color: 'default' };
      return <Chip label={status.label} color={status.color} size="small" />;
    },
  },
];

// Print handler function
const handlePrint = () => {
  const printContent = document.querySelector('.printable')?.innerHTML;
  if (!printContent) return;
  
  const printWindow = window.open('', '', 'width=900,height=700');
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>تقرير مكونات MUI</title>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
        <style>
          body {
            background-color: white !important;
            font-family: 'Cairo', 'Tajawal', Arial, sans-serif !important;
            direction: rtl !important;
            margin: 0;
            color: #222;
            font-size: 13pt !important;
            line-height: 1.4;
          }
          
          @page {
            margin: 1.5cm;
          }
          
          .printable {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          
          /* Hide elements not needed for printing */
          .MuiButton-root, .MuiSnackbar-root, .MuiDialog-root,
          .no-print, .actions-bar, .sidebar, .print-hide {
            display: none !important;
          }
          
          /* Improve spacing and layout for print */
          .MuiCard-root {
            page-break-inside: avoid;
            margin-bottom: 15px !important;
            border-radius: 6px !important;
            border: 1px solid #eee !important;
            box-shadow: none !important;
          }
          
          .MuiTypography-h4 {
            color: #2563eb !important;
            font-size: 24pt !important;
            margin-bottom: 20px !important;
          }
          
          .MuiTypography-h6 {
            color: #2563eb !important;
            font-size: 16pt !important;
          }
          
          .MuiTabs-root, .MuiTab-root {
            border-bottom: 1px solid #eee !important;
          }
          
          .MuiCardHeader-root {
            background-color: #f8f9fa !important;
            border-bottom: 1px solid #eee !important;
            padding: 12px 16px !important;
          }
          
          .MuiCardContent-root {
            padding: 16px !important;
          }
          
          .MuiDataGrid-root {
            border: 1px solid #eee !important;
          }
          
          .MuiDataGrid-cell, .MuiDataGrid-columnHeader {
            border-color: #eee !important;
          }
          
          .MuiAlert-root {
            margin-bottom: 10px !important;
            border-radius: 6px !important;
          }
          
          .MuiLinearProgress-root {
            margin: 10px 0 !important;
          }
          
          /* Ensure proper spacing between sections */
          .MuiBox-root {
            margin-bottom: 20px !important;
          }
          
          /* Hide interactive elements */
          .MuiDataGrid-columnHeaders .MuiDataGrid-menuIcon,
          .MuiDataGrid-cell .MuiDataGrid-menuIcon,
          .MuiDataGrid-cell .MuiIconButton-root,
          .MuiDataGrid-footerContainer .MuiTablePagination-root {
            display: none !important;
          }
          
          /* Simplify DataGrid for printing */
          .MuiDataGrid-root .MuiDataGrid-overlay {
            display: none !important;
          }
        </style>
      </head>
      <body>
        ${printContent}
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
  }
};

// Restarting TS server to fix MUI component types
export default function MUIComponentsDemo() {
  const theme = useTheme();
  const router = useRouter();
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleShowSnackbar = (message: string, severity: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleProcessData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      handleShowSnackbar('تمت معالجة البيانات بنجاح!', 'success');
    }, 2000);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box className="container mx-auto py-8 printable">
      <Box className="flex justify-between items-center mb-6">
        <Typography variant="h4" component="h1" className="font-bold">
          عرض تجريبي لمكونات MUI
        </Typography>
        <Box className="flex gap-2">
          <Button 
            variant="contained" 
            onClick={handlePrint}
            startIcon={<Print />}
          >
            طباعة التقرير
          </Button>
          <Button 
            variant="contained" 
            onClick={() => router.push('/')}
          >
            العودة للرئيسية
          </Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* AppBar Example */}
        <Box sx={{ width: '100%' }}>
          <AppBar position="static" color="primary">
            <Toolbar>
              <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
                <Home />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                نظام الحضور والرواتب
              </Typography>
              <IconButton color="inherit">
                <Badge badgeContent={4} color="error">
                  <Notifications />
                </Badge>
              </IconButton>
              <IconButton color="inherit">
                <Settings />
              </IconButton>
              <IconButton color="inherit">
                <Avatar>
                  <Person />
                </Avatar>
              </IconButton>
            </Toolbar>
          </AppBar>
        </Box>

        {/* Progress Indicators and Alerts side by side */}
        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          <Box sx={{ flex: 1 }}>
            <Card>
              <CardHeader title="مؤشرات التقدم" />
              <CardContent>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    معالجة البيانات
                  </Typography>
                  {loading ? <LinearProgress /> : <LinearProgress variant="determinate" value={100} />}
                </Box>
                
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    تحميل الملفات
                  </Typography>
                  <CircularProgress />
                </Box>
                
                <Button 
                  variant="contained" 
                  onClick={handleProcessData}
                  disabled={loading}
                  startIcon={loading ? <CircularProgress size={20} /> : null}
                >
                  {loading ? 'جاري المعالجة...' : 'معالجة البيانات'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Card>
              <CardHeader title="التنبيهات والإشعارات" />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Alert severity="success" icon={<CheckCircle />}>
                    تم حفظ البيانات بنجاح!
                  </Alert>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Alert severity="info" icon={<Info />}>
                    معلومات مهمة حول النظام
                  </Alert>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Alert severity="warning" icon={<Warning />}>
                    تنبيه: يوجد تحديث متوفر للنظام
                  </Alert>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Alert severity="error" icon={<Error />}>
                    خطأ: لا يمكن الاتصال بقاعدة البيانات
                  </Alert>
                </Box>
                
                <Button 
                  variant="outlined" 
                  onClick={() => handleShowSnackbar('هذا إشعار تجريبي!', 'info')}
                >
                  إظهار إشعار
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Forms */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardHeader title="نموذج الموظف" />
            <CardContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="الاسم الكامل"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <AccountCircle sx={{ mr: 1, my: 0.5 }} />,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="البريد الإلكتروني"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Email sx={{ mr: 1, my: 0.5 }} />,
                      }}
                    />
                  </Box>
                </Box>
                
                <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
                  <Box sx={{ flex: 1 }}>
                    <TextField
                      fullWidth
                      label="رقم الهاتف"
                      variant="outlined"
                      InputProps={{
                        startAdornment: <Phone sx={{ mr: 1, my: 0.5 }} />,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ flex: 1 }}>
                    <FormControl fullWidth>
                      <InputLabel>القسم</InputLabel>
                      <Select label="القسم" defaultValue="">
                        <MenuItem value="hr">الموارد البشرية</MenuItem>
                        <MenuItem value="finance">المالية</MenuItem>
                        <MenuItem value="it">تقنية المعلومات</MenuItem>
                        <MenuItem value="marketing">التسويق</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </Box>
                
                <Box>
                  <FormGroup>
                    <FormControlLabel
                      control={<Checkbox defaultChecked />}
                      label="هل هو مدير؟"
                    />
                    <FormControlLabel
                      control={<Switch defaultChecked />}
                      label="الحالة النشطة"
                    />
                  </FormGroup>
                </Box>
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end', p: 2 }} className="print-hide">
              <Button variant="outlined" color="secondary">
                إلغاء
              </Button>
              <Button variant="contained" color="primary">
                حفظ
              </Button>
            </CardActions>
          </Card>
        </Box>

        {/* DataGrid */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardHeader title="جدول الموظفين" />
            <CardContent>
              <div dir="rtl">
                <DataGrid
                  rows={rows}
                  columns={columns}
                  initialState={{
                    pagination: {
                      paginationModel: { page: 0, pageSize: 5 },
                    },
                  }}
                  pageSizeOptions={[5, 10]}
                  checkboxSelection
                  disableRowSelectionOnClick
                  autoHeight
                />
              </div>
            </CardContent>
          </Card>
        </Box>

        {/* Tabs */}
        <Box sx={{ width: '100%' }}>
          <Card>
            <CardHeader title="علامات التبويب" />
            <CardContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="مثال على علامات التبويب">
                  <Tab label="الملف الشخصي" />
                  <Tab label="الإعدادات" />
                  <Tab label="الأمان" />
                </Tabs>
              </Box>
              <Box sx={{ p: 3 }}>
                {tabValue === 0 && (
                  <Typography>
                    هذا هو محتوى علامة التبويب "الملف الشخصي". يمكنك وضع معلومات المستخدم هنا.
                  </Typography>
                )}
                {tabValue === 1 && (
                  <Typography>
                    هذا هو محتوى علامة التبويب "الإعدادات". يمكنك وضع خيارات الإعداد هنا.
                  </Typography>
                )}
                {tabValue === 2 && (
                  <Typography>
                    هذا هو محتوى علامة التبويب "الأمان". يمكنك وضع إعدادات الأمان هنا.
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Dialog Example */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>تأكيد العملية</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من رغبتك في تنفيذ هذه العملية؟ لا يمكن التراجع عنها.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>إلغاء</Button>
          <Button 
            onClick={() => {
              setOpenDialog(false);
              handleShowSnackbar('تم تنفيذ العملية بنجاح!', 'success');
            }} 
            variant="contained"
            color="primary"
          >
            تأكيد
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      />
    </Box>
  );
}