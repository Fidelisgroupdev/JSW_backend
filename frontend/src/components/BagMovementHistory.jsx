import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  TextField,
  Divider,
  Grid,
  Card,
  CardContent,
  useTheme,
  alpha,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RefreshIcon from '@mui/icons-material/Refresh';
import CloseIcon from '@mui/icons-material/Close';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
  '&.MuiTableCell-head': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    fontWeight: 600,
    color: theme.palette.text.primary,
  }
}));

const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-5px)',
  },
  borderRadius: '12px',
  overflow: 'hidden',
}));

const BagMovementHistory = ({ open, onClose, cluster }) => {
  const theme = useTheme();
  const [movements, setMovements] = useState([]);
  const [summary, setSummary] = useState({ in_total: 0, out_total: 0, net_change: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const fetchMovements = async (date) => {
    if (!cluster) return;
    
    setLoading(true);
    setError('');
    
    try {
      // Format date as YYYY-MM-DD
      const formattedDate = date ? format(date, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`${API_URL}/clusters/${cluster.id}/movements?date=${formattedDate}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setMovements(data.movements);
      setSummary(data.summary);
      
    } catch (err) {
      console.error('Error fetching bag movements:', err);
      setError(`Failed to load movements: ${err.message}`);
      setMovements([]);
      setSummary({ in_total: 0, out_total: 0, net_change: 0 });
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch movements when the modal opens or date changes
  useEffect(() => {
    if (open && cluster) {
      fetchMovements(selectedDate);
    }
  }, [open, cluster?.id, selectedDate]);
  
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };
  
  const handleRefresh = () => {
    fetchMovements(selectedDate);
  };
  
  if (!cluster) return null;
  
  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflowY: 'visible',
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Bag Movement History - {cluster.name}
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ mb: 4, mt: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Filter by Date"
              value={selectedDate}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} size="small" />}
            />
          </LocalizationProvider>
          
          <Button 
            startIcon={<RefreshIcon />} 
            onClick={handleRefresh} 
            disabled={loading}
            variant="outlined"
            size="small"
          >
            Refresh
          </Button>
        </Box>
        
        {/* Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={4}>
            <StatsCard>
              <Box sx={{ 
                bgcolor: alpha(theme.palette.success.main, 0.1), 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Bags In
                </Typography>
                <ArrowUpwardIcon color="success" />
              </Box>
              <CardContent sx={{ pt: 2 }}>
                <Typography variant="h4" fontWeight={600} color="success.main">
                  {summary.in_total}
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatsCard>
              <Box sx={{ 
                bgcolor: alpha(theme.palette.error.main, 0.1), 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Bags Out
                </Typography>
                <ArrowDownwardIcon color="error" />
              </Box>
              <CardContent sx={{ pt: 2 }}>
                <Typography variant="h4" fontWeight={600} color="error.main">
                  {summary.out_total}
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
          
          <Grid item xs={12} sm={4}>
            <StatsCard>
              <Box sx={{ 
                bgcolor: alpha(theme.palette.info.main, 0.1), 
                p: 2, 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Net Change
                </Typography>
                {summary.net_change >= 0 ? (
                  <ArrowUpwardIcon color="info" />
                ) : (
                  <ArrowDownwardIcon color="info" />
                )}
              </Box>
              <CardContent sx={{ pt: 2 }}>
                <Typography 
                  variant="h4" 
                  fontWeight={600} 
                  color={summary.net_change >= 0 ? 'info.main' : 'info.main'}
                >
                  {summary.net_change >= 0 ? '+' : ''}{summary.net_change}
                </Typography>
              </CardContent>
            </StatsCard>
          </Grid>
        </Grid>
        
        <Typography variant="h6" sx={{ mb: 2 }}>
          Transaction History
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : movements.length === 0 ? (
          <Alert severity="info" sx={{ mb: 2 }}>
            No movement records found for the selected date.
          </Alert>
        ) : (
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>Time</StyledTableCell>
                  <StyledTableCell>Type</StyledTableCell>
                  <StyledTableCell align="right">Quantity</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {movements.map((movement) => (
                  <TableRow key={movement.id} hover>
                    <StyledTableCell>
                      {new Date(movement.timestamp).toLocaleTimeString()}
                    </StyledTableCell>
                    <StyledTableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {movement.movement_type === 'IN' ? (
                          <>
                            <ArrowUpwardIcon fontSize="small" color="success" sx={{ mr: 1 }} />
                            <Typography>Bags In</Typography>
                          </>
                        ) : (
                          <>
                            <ArrowDownwardIcon fontSize="small" color="error" sx={{ mr: 1 }} />
                            <Typography>Bags Out</Typography>
                          </>
                        )}
                      </Box>
                    </StyledTableCell>
                    <StyledTableCell align="right">
                      <Typography 
                        fontWeight={600}
                        color={movement.movement_type === 'IN' ? 'success.main' : 'error.main'}
                      >
                        {movement.movement_type === 'IN' ? '+' : '-'}{movement.quantity}
                      </Typography>
                    </StyledTableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DialogContent>
      
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BagMovementHistory;
