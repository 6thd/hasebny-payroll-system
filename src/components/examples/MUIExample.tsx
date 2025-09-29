'use client';

import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardActions,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup
} from '@mui/material';
import { AccountCircle, Email, Phone } from '@mui/icons-material';

export default function MUIExample() {
  return (
    <Box sx={{ p: 2, maxWidth: 600, margin: 'auto' }}>
      <Card>
        <CardHeader
          title="نموذج الموظف"
          subheader="أدخل تفاصيل الموظف"
        />
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="الاسم الكامل"
              variant="outlined"
              InputProps={{
                startAdornment: <AccountCircle sx={{ mr: 1, my: 0.5 }} />,
              }}
            />
            
            <TextField
              fullWidth
              label="البريد الإلكتروني"
              variant="outlined"
              InputProps={{
                startAdornment: <Email sx={{ mr: 1, my: 0.5 }} />,
              }}
            />
            
            <TextField
              fullWidth
              label="رقم الهاتف"
              variant="outlined"
              InputProps={{
                startAdornment: <Phone sx={{ mr: 1, my: 0.5 }} />,
              }}
            />
            
            <FormControl fullWidth>
              <InputLabel>القسم</InputLabel>
              <Select label="القسم" defaultValue="">
                <MenuItem value="hr">الموارد البشرية</MenuItem>
                <MenuItem value="finance">المالية</MenuItem>
                <MenuItem value="it">تقنية المعلومات</MenuItem>
              </Select>
            </FormControl>
            
            <FormGroup>
              <FormControlLabel
                control={<Checkbox />}
                label="هل هو مدير؟"
              />
            </FormGroup>
          </Box>
        </CardContent>
        <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
          <Button variant="outlined" color="secondary">
            إلغاء
          </Button>
          <Button variant="contained" color="primary">
            حفظ
          </Button>
        </CardActions>
      </Card>
    </Box>
  );
}