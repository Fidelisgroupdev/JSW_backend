import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid,
  Card,
  CardContent,
  Divider,
  LinearProgress,
  Tooltip,
  alpha,
  useTheme,
  InputAdornment,
  Stack,
  Chip
} from '@mui/material';
import { styled } from '@mui/material/styles';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import HistoryIcon from '@mui/icons-material/History';

// Import bag movement components
import BagMovementModal from '../components/BagMovementModal';
import BagMovementHistory from '../components/BagMovementHistory';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

// Styled components for enhanced UI
const FormCard = styled(Card)(({ theme }) => ({
  borderRadius: '16px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  overflow: 'visible',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    boxShadow: '0 6px 25px 0 rgba(0,0,0,0.08)',
  }
}));

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${theme.palette.divider}`,
  padding: theme.spacing(1.5),
  '&.MuiTableCell-head': {
    backgroundColor: alpha(theme.palette.primary.main, 0.05),
    fontWeight: 600,
    color: theme.palette.text.primary,
  }
}));

function ClusterManagement() {
  const theme = useTheme();
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newClusterName, setNewClusterName] = useState('');
  const [newClusterCount, setNewClusterCount] = useState(0);
  const [newClusterCapacity, setNewClusterCapacity] = useState(1000);
  const [editRowId, setEditRowId] = useState(null);
  const [editCount, setEditCount] = useState(0);
  const [editCapacity, setEditCapacity] = useState(0);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clusterToDelete, setClusterToDelete] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Bag movement state
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [bagMovementModalOpen, setBagMovementModalOpen] = useState(false);
  const [movementHistoryModalOpen, setMovementHistoryModalOpen] = useState(false);

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch(`${API_URL}/clusters`);
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = `HTTP error! status: ${response.status}`;
        }
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setClusters(data);
    } catch (e) {
      console.error("Failed to fetch clusters:", e);
      setError(`Failed to load clusters. ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClusters();
  }, [fetchClusters]);

  const handleRefresh = () => {
    fetchClusters();
  };

  const handleAddCluster = async (e) => {
    e.preventDefault();
    // Reset notifications
    setError('');
    setSuccess('');
    
    // Validation
    if (!newClusterName.trim()) {
      setError('Cluster name cannot be empty.');
      return;
    }
    if (isNaN(parseInt(newClusterCapacity)) || parseInt(newClusterCapacity) <= 0) {
      setError('Capacity must be a positive number greater than zero.');
      return;
    }
    
    // Convert inputs to appropriate types
    const formattedData = {
      name: newClusterName.trim(),
      bag_count: parseInt(newClusterCount, 10) || 0,
      capacity: parseInt(newClusterCapacity, 10) || 1000
    };
    
    setSubmitting(true);
    
    try {
      const response = await fetch(`${API_URL}/clusters`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formattedData),
      });
      
      // Get response data
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
      }
      
      // Success case
      setNewClusterName('');
      setNewClusterCount(0);
      setNewClusterCapacity(1000);
      setSuccess(`Cluster "${formattedData.name}" added successfully!`);
      fetchClusters(); // Refresh list
    } catch (e) {
      console.error("Failed to add cluster:", e);
      setError(`Failed to add cluster: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (cluster) => {
    setEditRowId(cluster.id);
    setEditCount(cluster.bag_count);
    setEditCapacity(cluster.capacity);
  };

  const handleCancelClick = () => {
    setEditRowId(null);
  };

  const handleSaveClick = async (clusterId) => {
     setError('');
     if (editCapacity <= 0) {
       setError('Capacity must be greater than zero.');
       return;
     }
     try {
        const response = await fetch(`${API_URL}/clusters/${clusterId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              bag_count: parseInt(editCount, 10) || 0,
              capacity: parseInt(editCapacity, 10) || 1000
            }),
        });
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || `HTTP error! status: ${response.status}`);
        }
        setEditRowId(null);
        fetchClusters(); // Refresh list
     } catch (e) {
        console.error("Failed to update cluster:", e);
        setError(`Failed to update cluster ${clusterId}: ${e.message}`);
     }
  };

  const handleDeleteClick = (cluster) => {
    setClusterToDelete(cluster);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!clusterToDelete) return;
    setError('');
    try {
      const response = await fetch(`${API_URL}/clusters/${clusterToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
         const errData = await response.json();
         throw new Error(errData.error || `HTTP error! status: ${response.status}`);
      }
      setDeleteConfirmOpen(false);
      setClusterToDelete(null);
      fetchClusters(); // Refresh list
    } catch (e) {
       console.error("Failed to delete cluster:", e);
       setError(`Failed to delete cluster ${clusterToDelete.name}: ${e.message}`);
       setDeleteConfirmOpen(false); // Close dialog even on error
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setClusterToDelete(null);
  };
  
  // Bag movement handlers
  const handleOpenBagMovementModal = (cluster) => {
    setSelectedCluster(cluster);
    setBagMovementModalOpen(true);
  };
  
  const handleCloseBagMovementModal = () => {
    setBagMovementModalOpen(false);
    // Don't reset selectedCluster immediately in case user wants to view history next
  };
  
  const handleOpenMovementHistory = (cluster) => {
    setSelectedCluster(cluster);
    setMovementHistoryModalOpen(true);
  };
  
  const handleCloseMovementHistory = () => {
    setMovementHistoryModalOpen(false);
    setSelectedCluster(null); // Reset selected cluster when closing history
  };
  
  const handleMovementSuccess = (data) => {
    // Update the cluster in the UI with the new bag count
    const updatedClusters = clusters.map(cluster => 
      cluster.id === data.cluster.id ? data.cluster : cluster
    );
    setClusters(updatedClusters);
    
    // Show success message
    const movementType = data.movement.movement_type;
    const quantity = data.movement.quantity;
    const clusterName = data.cluster.name;
    
    setSuccess(
      `Successfully recorded ${quantity} bags ${movementType === 'IN' ? 'into' : 'out of'} ${clusterName}. ` +
      `New count: ${data.cluster.bag_count} bags.`
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Cluster Management
        </Typography>
        
        <Tooltip title="Refresh cluster data">
          <IconButton 
            onClick={handleRefresh} 
            color="primary" 
            disabled={loading}
            sx={{ 
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': { backgroundColor: alpha(theme.palette.primary.main, 0.2) }
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Success alert */}
      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setSuccess('')}
        >
          {success}
        </Alert>
      )}

      {/* Error alert */}
      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: 2 }}
          onClose={() => setError('')}
        >
          {error}
        </Alert>
      )}

      {/* Add Cluster Form */}
      <FormCard sx={{ p: 3, mb: 4 }}>
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight="600" gutterBottom>
            Add New Cluster
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          <Box component="form" onSubmit={handleAddCluster}>
            <Grid container spacing={3} alignItems="flex-end">
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Cluster Name"
                  value={newClusterName}
                  onChange={(e) => setNewClusterName(e.target.value)}
                  required
                  fullWidth
                  placeholder="Enter cluster name"
                  variant="outlined"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <WarehouseIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Initial Bag Count"
                  type="number"
                  value={newClusterCount}
                  onChange={(e) => setNewClusterCount(e.target.value)}
                  fullWidth
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField
                  label="Capacity (Max Bags)"
                  type="number"
                  value={newClusterCapacity}
                  onChange={(e) => setNewClusterCapacity(e.target.value)}
                  required
                  fullWidth
                  InputProps={{ inputProps: { min: 1 } }}
                />
              </Grid>
              <Grid item xs={12} sm={2}>
                <Button 
                  variant="contained" 
                  type="submit" 
                  fullWidth
                  size="large"
                  disabled={submitting}
                  startIcon={<AddIcon />}
                  sx={{ 
                    height: 56,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600
                  }}
                >
                  {submitting ? 'Adding...' : 'Add Cluster'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </FormCard>

      {/* Loading indicator or Clusters Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
          <Typography variant="h6" fontWeight="600">
            Cluster List
          </Typography>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <StyledTableCell>ID</StyledTableCell>
                  <StyledTableCell>Name</StyledTableCell>
                  <StyledTableCell>Bag Count</StyledTableCell>
                  <StyledTableCell>Capacity</StyledTableCell>
                  <StyledTableCell align="right">Utilization</StyledTableCell>
                  <StyledTableCell align="center">Actions</StyledTableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {clusters.length === 0 ? (
                  <TableRow>
                    <StyledTableCell colSpan={6}>
                      <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <WarehouseIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 2 }} />
                        <Typography variant="subtitle1" color="text.secondary">
                          No clusters found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Add your first cluster using the form above
                        </Typography>
                      </Box>
                    </StyledTableCell>
                  </TableRow>
                ) : (
                  clusters.map((cluster) => (
                    <TableRow 
                      key={cluster.id}
                      hover
                      sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                    >
                      <StyledTableCell>{cluster.id}</StyledTableCell>
                      <StyledTableCell>
                        <Typography fontWeight="500">{cluster.name}</Typography>
                      </StyledTableCell>
                      <StyledTableCell>
                        {editRowId === cluster.id ? (
                          <TextField
                            type="number"
                            size="small"
                            value={editCount}
                            onChange={(e) => setEditCount(e.target.value)}
                            InputProps={{ inputProps: { min: 0 } }}
                            sx={{ width: '100px' }}
                          />
                        ) : (
                          <Typography fontWeight="500" color="primary.main">
                            {cluster.bag_count.toLocaleString()}
                          </Typography>
                        )}
                      </StyledTableCell>
                      <StyledTableCell>
                        {editRowId === cluster.id ? (
                          <TextField
                            type="number"
                            size="small"
                            value={editCapacity}
                            onChange={(e) => setEditCapacity(e.target.value)}
                            InputProps={{ inputProps: { min: 1 } }}
                            sx={{ width: '100px' }}
                          />
                        ) : (
                          cluster.capacity.toLocaleString()
                        )}
                      </StyledTableCell>
                      <StyledTableCell align="right">
                        <Box 
                          sx={{ 
                            width: '100%', 
                            display: 'flex', 
                            alignItems: 'center',
                            justifyContent: 'flex-end'
                          }}
                        >
                          <Typography 
                            variant="body2" 
                            sx={{
                              color: cluster.utilization > 90 ? 'error.main' : 
                                    cluster.utilization > 75 ? 'warning.main' : 
                                    'success.main',
                              fontWeight: 'bold',
                              mr: 1,
                              py: 0.5,
                              px: 1.5,
                              borderRadius: '10px',
                              backgroundColor: 
                                cluster.utilization > 90 ? alpha(theme.palette.error.main, 0.1) : 
                                cluster.utilization > 75 ? alpha(theme.palette.warning.main, 0.1) : 
                                alpha(theme.palette.success.main, 0.1),
                            }}
                          >
                            {cluster.utilization}%
                          </Typography>
                          <LinearProgress 
                            variant="determinate" 
                            value={Math.min(cluster.utilization, 100)} 
                            sx={{ 
                              width: '80px', 
                              height: 8, 
                              borderRadius: 5,
                              backgroundColor: 'grey.200',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: cluster.utilization > 90 ? 'error.main' : 
                                                cluster.utilization > 75 ? 'warning.main' : 
                                                'success.main',
                              }
                            }} 
                          />
                        </Box>
                      </StyledTableCell>
                      <StyledTableCell align="center">
                        <Stack direction="row" spacing={1} justifyContent="center">
                          {editRowId === cluster.id ? (
                            <>
                              <Tooltip title="Save changes">
                                <IconButton 
                                  onClick={() => handleSaveClick(cluster.id)} 
                                  color="primary" 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
                                >
                                  <SaveIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Cancel editing">
                                <IconButton 
                                  onClick={handleCancelClick} 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.grey[500], 0.1) }}
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          ) : (
                            <>
                              <Tooltip title="Add bags (In)">
                                <IconButton 
                                  onClick={() => handleOpenBagMovementModal(cluster)} 
                                  color="success" 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.success.main, 0.1) }}
                                >
                                  <ArrowUpwardIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="View movement history">
                                <IconButton 
                                  onClick={() => handleOpenMovementHistory(cluster)} 
                                  color="info" 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.info.main, 0.1) }}
                                >
                                  <HistoryIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Edit cluster">
                                <IconButton 
                                  onClick={() => handleEditClick(cluster)} 
                                  color="primary" 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Delete cluster">
                                <IconButton 
                                  onClick={() => handleDeleteClick(cluster)} 
                                  color="error" 
                                  size="small"
                                  sx={{ backgroundColor: alpha(theme.palette.error.main, 0.1) }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Stack>
                      </StyledTableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

        {/* Delete Confirmation Dialog */}
        <Dialog
            open={deleteConfirmOpen}
            onClose={handleDeleteCancel}
        >
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogContent>
                <DialogContentText>
                    Are you sure you want to delete the cluster "{clusterToDelete?.name}"? This action cannot be undone.
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleDeleteCancel}>Cancel</Button>
                <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                    Delete
                </Button>
            </DialogActions>
        </Dialog>
        
        {/* Bag Movement Modal */}
        <BagMovementModal 
          open={bagMovementModalOpen}
          onClose={handleCloseBagMovementModal}
          cluster={selectedCluster}
          onSuccess={handleMovementSuccess}
        />
        
        {/* Movement History Modal */}
        <BagMovementHistory
          open={movementHistoryModalOpen}
          onClose={handleCloseMovementHistory}
          cluster={selectedCluster}
        />
    </Box>
  );
}

export default ClusterManagement;
