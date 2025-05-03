import React, { useState, useEffect } from 'react';
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert, 
  Box, 
  Paper, 
  Divider,
  Stack,
  useTheme,
  LinearProgress,
  alpha,
  IconButton,
  Button,
  Tooltip,
  Table,
  TableContainer,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import BusinessIcon from '@mui/icons-material/Business';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import RefreshIcon from '@mui/icons-material/Refresh';
import StorageIcon from '@mui/icons-material/Storage';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CameraIcon from '@mui/icons-material/Camera';
import { styled } from '@mui/material/styles';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Link as RouterLink } from 'react-router-dom';
import { format } from 'date-fns';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Styled components
const StatsCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 12px 24px -10px rgba(0,0,0,0.2)'
  },
  borderRadius: '16px',
  overflow: 'hidden',
}));

const DashboardCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  overflow: 'visible',
  height: '100%',
}));

const IconWrapper = styled(Box)(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 64,
  height: 64,
  borderRadius: '16px',
  backgroundColor: color ? alpha(color, 0.2) : alpha(theme.palette.primary.main, 0.2),
  color: color || theme.palette.primary.main,
  '& .MuiSvgIcon-root': {
    fontSize: 32,
  },
}));

const GradientBox = styled(Box)(({ theme, startColor, endColor }) => ({
  background: `linear-gradient(135deg, ${startColor || theme.palette.primary.main} 0%, ${endColor || theme.palette.secondary.main} 100%)`,
  borderRadius: '16px',
  padding: theme.spacing(3, 2),
  color: theme.palette.common.white,
  position: 'relative',
  overflow: 'hidden',
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
    pointerEvents: 'none',
  },
}));

const UtilizationIndicator = styled(Box)(({ theme, value }) => {
  // Determine color based on utilization value
  let color = theme.palette.success.main; // Default green
  if (value > 90) {
    color = theme.palette.error.main; // Red for > 90%
  } else if (value > 75) {
    color = theme.palette.warning.main; // Orange for > 75%
  }
  
  return {
    position: 'relative',
    width: '100%',
    height: 10,
    backgroundColor: alpha(color, 0.2),
    borderRadius: 10,
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      height: '100%',
      width: `${Math.min(value, 100)}%`,
      backgroundColor: color,
      borderRadius: 10,
      transition: 'width 0.5s ease-in-out',
    }
  };
});

function Dashboard() {
  const theme = useTheme();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Calculate summary stats
  const [stats, setStats] = useState({
    totalBags: 0,
    totalCapacity: 0,
    averageUtilization: 0,
    highestUtilization: { value: 0, cluster: null },
    lowestUtilization: { value: 100, cluster: null },
  });
  
  // Prepare data for bar chart
  const [chartData, setChartData] = useState([]);
  const [dailyMovement, setDailyMovement] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    summaries: [],
    overall: { in_total: 0, out_total: 0, net_change: 0 }
  });
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [movementError, setMovementError] = useState('');
  
  // Calculate stats from clusters
  useEffect(() => {
    if (clusters.length > 0) {
      const totalBags = clusters.reduce((sum, cluster) => sum + cluster.bag_count, 0);
      const totalCapacity = clusters.reduce((sum, cluster) => sum + cluster.capacity, 0);
      
      // Prepare chart data
      setChartData(clusters.map(cluster => ({
        name: cluster.name,
        bags: cluster.bag_count,
        capacity: cluster.capacity,
        utilization: cluster.utilization
      })));
      const avgUtilization = Math.round(totalBags / totalCapacity * 100 * 10) / 10;
      
      // Find highest and lowest utilization
      let highest = { value: 0, cluster: null };
      let lowest = { value: 100, cluster: null };
      
      clusters.forEach(cluster => {
        const util = cluster.utilization;
        if (util > highest.value) {
          highest = { value: util, cluster: cluster.name };
        }
        if (util < lowest.value) {
          lowest = { value: util, cluster: cluster.name };
        }
      });
      
      setStats({
        totalBags,
        totalCapacity,
        averageUtilization: avgUtilization,
        highestUtilization: highest,
        lowestUtilization: lowest,
      });
    }
  }, [clusters]);
  
  const fetchClusters = async () => {
    setError('');
    setRefreshing(true);
    try {
      const response = await fetch(`${API_URL}/clusters`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClusters(data);
      setLastUpdated(new Date());
    } catch (e) {
      console.error("Failed to fetch clusters:", e);
      setError(`Failed to load clusters. ${e.message}`);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };
  
  const fetchDailyMovements = async () => {
    setMovementError('');
    setLoadingMovements(true);
    try {
      // Get today's date in YYYY-MM-DD format
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const response = await fetch(`${API_URL}/clusters/daily-summary?date=${today}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setDailyMovement(data);
    } catch (e) {
      console.error("Failed to fetch daily movements:", e);
      setMovementError(`Failed to load daily movement summary. ${e.message}`);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleRefresh = () => {
    fetchClusters();
    fetchDailyMovements();
  };
  
  // Initial data load
  useEffect(() => {
    fetchClusters();
    fetchDailyMovements();
    
    // Set up polling for real-time updates
    const intervalId = setInterval(fetchClusters, 60000); // Refresh every 60 seconds
    return () => clearInterval(intervalId);

  }, []);

  if (loading) {
    return (
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <CircularProgress size={60} thickness={4} color="secondary" />
        <Typography variant="h6" sx={{ mt: 2 }}>Loading dashboard data...</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Dashboard Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom fontWeight="bold" color="primary" sx={{ mb: 1 }}>
            JSW CEMENT Inventory Dashboard
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Overview of cement bag inventory across all clusters
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ mr: 2, textAlign: 'right' }}>
            <Typography variant="caption" color="text.secondary">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </Typography>
          </Box>
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh} 
              color="primary" 
              disabled={refreshing}
            >
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            p: 2, 
            display: 'flex', 
            alignItems: 'center' 
          }}
        >
          {error}
        </Alert>
      )}

      {/* Summary Stats with Modern Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Total Bags vs Capacity Card */}
        <Grid item xs={12} md={6}>
          <GradientBox startColor="#1e3a8a" endColor="#3949ab">
            <Stack direction="row" spacing={3} alignItems="stretch" sx={{ height: '100%' }}>
              <Box>
                <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1 }}>
                  TOTAL INVENTORY
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ my: 1 }}>
                  {stats.totalBags.toLocaleString()}
                </Typography>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                  cement bags
                </Typography>
                
                <Box sx={{ mt: 3, width: '100%' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption">
                      {stats.averageUtilization}% of capacity
                    </Typography>
                    <Typography variant="caption" fontWeight="bold">
                      {stats.totalCapacity.toLocaleString()}
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={Math.min(stats.averageUtilization, 100)}
                    sx={{ 
                      height: 6, 
                      borderRadius: 3,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': {
                        backgroundColor: 'white'
                      }
                    }}
                  />
                </Box>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                position: 'relative'
              }}>
                <InventoryIcon sx={{ fontSize: 100, opacity: 0.2, position: 'absolute' }} />
                <IconWrapper sx={{ 
                  backgroundColor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  width: 80,
                  height: 80
                }}>
                  <InventoryIcon sx={{ fontSize: 40 }} />
                </IconWrapper>
              </Box>
            </Stack>
          </GradientBox>
        </Grid>

        {/* Cluster Stats */}
        <Grid item xs={12} md={6}>
          <Grid container spacing={2} sx={{ height: '100%' }}>
            {/* Active Clusters */}
            <Grid item xs={12} sm={6}>
              <StatsCard>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <IconWrapper color="#1e40af">
                      <BusinessIcon />
                    </IconWrapper>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Active Clusters
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold" color="primary.dark">
                        {clusters.length}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
            
            {/* Total Capacity */}
            <Grid item xs={12} sm={6}>
              <StatsCard>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <IconWrapper color="#0891b2">
                      <StorageIcon />
                    </IconWrapper>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Total Capacity
                      </Typography>
                      <Typography variant="h4" component="div" fontWeight="bold" color="info.dark">
                        {stats.totalCapacity.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
            
            {/* Highest Utilization */}
            <Grid item xs={12} sm={6}>
              <StatsCard>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Highest Utilization
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" component="div" fontWeight="bold" color={stats.highestUtilization.value > 90 ? 'error.main' : 'warning.main'}>
                        {stats.highestUtilization.value}%
                      </Typography>
                      <TrendingUpIcon color={stats.highestUtilization.value > 90 ? 'error' : 'warning'} />
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {stats.highestUtilization.cluster || 'N/A'}
                    </Typography>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
            
            {/* Lowest Utilization */}
            <Grid item xs={12} sm={6}>
              <StatsCard>
                <CardContent>
                  <Stack spacing={1}>
                    <Typography variant="body2" color="text.secondary">
                      Lowest Utilization
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h5" component="div" fontWeight="bold" color="success.main">
                        {stats.lowestUtilization.value}%
                      </Typography>
                      <TrendingDownIcon color="success" />
                    </Box>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {stats.lowestUtilization.cluster || 'N/A'}
                    </Typography>
                  </Stack>
                </CardContent>
              </StatsCard>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      {/* Daily Bag Movement Summary */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="600" gutterBottom>
          Today's Bag Movement
        </Typography>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 3 }}>
          {format(new Date(), 'MMMM d, yyyy')} - Summary of all bag movements across clusters
        </Typography>
        
        {movementError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {movementError}
          </Alert>
        )}
        
        <Grid container spacing={3}>
          {/* Bags In Card */}
          <Grid item xs={12} sm={4}>
            <GradientBox 
              startColor="#4caf50" 
              endColor="#81c784" 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }} gutterBottom>
                  BAGS IN
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {loadingMovements ? (
                    <CircularProgress size={30} sx={{ color: '#fff' }} />
                  ) : (
                    dailyMovement.overall.in_total.toLocaleString()
                  )}
                </Typography>
              </Box>
              <IconWrapper sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <ArrowUpwardIcon sx={{ fontSize: 30 }} />
              </IconWrapper>
            </GradientBox>
          </Grid>
          
          {/* Bags Out Card */}
          <Grid item xs={12} sm={4}>
            <GradientBox 
              startColor="#f44336" 
              endColor="#e57373" 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }} gutterBottom>
                  BAGS OUT
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {loadingMovements ? (
                    <CircularProgress size={30} sx={{ color: '#fff' }} />
                  ) : (
                    dailyMovement.overall.out_total.toLocaleString()
                  )}
                </Typography>
              </Box>
              <IconWrapper sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <ArrowDownwardIcon sx={{ fontSize: 30 }} />
              </IconWrapper>
            </GradientBox>
          </Grid>
          
          {/* Net Change Card */}
          <Grid item xs={12} sm={4}>
            <GradientBox 
              startColor="#2196f3" 
              endColor="#64b5f6" 
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Box>
                <Typography variant="subtitle2" sx={{ opacity: 0.8 }} gutterBottom>
                  NET CHANGE
                </Typography>
                <Typography variant="h3" fontWeight="bold">
                  {loadingMovements ? (
                    <CircularProgress size={30} sx={{ color: '#fff' }} />
                  ) : (
                    <>
                      {dailyMovement.overall.net_change > 0 && '+'}
                      {dailyMovement.overall.net_change.toLocaleString()}
                    </>
                  )}
                </Typography>
              </Box>
              <IconWrapper sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff' }}>
                <CompareArrowsIcon sx={{ fontSize: 30 }} />
              </IconWrapper>
            </GradientBox>
          </Grid>
          
          {/* Table of cluster movement summaries */}
          {!loadingMovements && dailyMovement.summaries.length > 0 && (
            <Grid item xs={12}>
              <DashboardCard>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Cluster</TableCell>
                        <TableCell align="right">Bags In</TableCell>
                        <TableCell align="right">Bags Out</TableCell>
                        <TableCell align="right">Net Change</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dailyMovement.summaries.map((summary) => (
                        <TableRow key={summary.cluster_id} hover>
                          <TableCell>{summary.cluster_name}</TableCell>
                          <TableCell align="right">
                            <Typography color="success.main" fontWeight="medium">
                              {summary.in_total.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography color="error.main" fontWeight="medium">
                              {summary.out_total.toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              color={summary.net_change > 0 ? 'success.main' : 
                                   summary.net_change < 0 ? 'error.main' : 'text.secondary'}
                              fontWeight="medium"
                            >
                              {summary.net_change > 0 && '+'}{summary.net_change.toLocaleString()}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </DashboardCard>
            </Grid>
          )}
          
          {!loadingMovements && dailyMovement.summaries.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                No bag movements recorded today.
              </Alert>
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Inventory Visualization - Bar Chart */}
      <DashboardCard sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight="600">
              Inventory Utilization
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Bag counts vs capacity across clusters
            </Typography>
          </Box>
        </Box>
        
        {clusters.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <WarehouseIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, opacity: 0.3 }} />
            <Typography variant="subtitle1" color="text.secondary" sx={{ mt: 2 }}>
              No cluster data available
            </Typography>
          </Box>
        ) : (
          <Box sx={{ width: '100%', height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                  angle={-45}
                  textAnchor="end"
                  height={70}
                />
                <YAxis 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <RechartsTooltip 
                  formatter={(value, name) => {
                    if (name === 'bags') return [`${value.toLocaleString()} bags`, 'Current'];
                    if (name === 'capacity') return [`${value.toLocaleString()} bags`, 'Capacity'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Cluster: ${label}`}
                />
                <Legend verticalAlign="top" height={36} />
                <Bar 
                  name="Capacity" 
                  dataKey="capacity" 
                  fill={alpha(theme.palette.primary.main, 0.15)}
                  radius={[4, 4, 0, 0]}
                  strokeWidth={1}
                  stroke={theme.palette.primary.main}
                  barSize={30}
                />
                <Bar 
                  name="Current" 
                  dataKey="bags" 
                  fill={theme.palette.primary.main}
                  radius={[4, 4, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        )}
      </DashboardCard>
      
      {/* Cluster Cards Section */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5" fontWeight="600">
          Cluster Details
        </Typography>
        
        {clusters.length > 0 && (
          <Button 
            variant="outlined" 
            size="small"
            sx={{ textTransform: 'none' }}
            href="/clusters"
            component={RouterLink}
            to="/clusters"
          >
            Manage Clusters
          </Button>
        )}
      </Box>
      <Divider sx={{ mb: 3 }} />

      {clusters.length === 0 ? (
        <Paper 
          sx={{
            p: 5, 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 4,
            border: '1px dashed #CBD5E1'
          }}
        >
          <WarehouseIcon sx={{ fontSize: 60, color: theme.palette.text.secondary, opacity: 0.3, mb: 2 }} />
          <Typography variant="h6" color="text.secondary" align="center">
            No clusters found
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1, mb: 3, maxWidth: 400 }}>
            Add clusters in the Cluster Management page to track inventory across different locations
          </Typography>
          <Button 
            variant="contained" 
            component={RouterLink} 
            to="/clusters"
            startIcon={<BusinessIcon />}
          >
            Add Your First Cluster
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {clusters.map((cluster) => {
            // Determine color based on utilization
            let color = theme.palette.success.main;
            if (cluster.utilization > 90) {
              color = theme.palette.error.main;
            } else if (cluster.utilization > 75) {
              color = theme.palette.warning.main;
            }
              
            return (
              <Grid item xs={12} sm={6} md={4} key={cluster.id}>
                <Card 
                  elevation={0}
                  sx={{ 
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" component="div" fontWeight="600" gutterBottom>
                      {cluster.name}
                    </Typography>
                    
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="overline" color="text.secondary" fontSize="0.7rem">
                          CURRENT
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 0.5 }} color="primary.main" fontWeight="600">
                          {cluster.bag_count.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="overline" color="text.secondary" fontSize="0.7rem">
                          CAPACITY
                        </Typography>
                        <Typography variant="h4" sx={{ mt: 0.5 }} color="text.secondary" fontWeight="500">
                          {cluster.capacity.toLocaleString()}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mb: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="600">
                          Utilization
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight="700"
                          sx={{ 
                            color, 
                            backgroundColor: alpha(color, 0.1),
                            py: 0.5,
                            px: 1.5,
                            borderRadius: 10,
                          }}
                        >
                          {cluster.utilization}%
                        </Typography>
                      </Box>
                      <UtilizationIndicator value={cluster.utilization} />
                    </Box>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right', mt: 1 }}>
                      ID: {cluster.id}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </>
  );
}

export default Dashboard;
