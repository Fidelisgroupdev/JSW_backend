import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BagMovementModal = ({ open, onClose, cluster, onSuccess }) => {
  const [movementType, setMovementType] = useState('IN');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (quantity <= 0) {
      setError('Quantity must be greater than zero');
      return;
    }
    
    // For OUT movements, check if quantity exceeds available bags
    if (movementType === 'OUT' && quantity > cluster.bag_count) {
      setError(`Cannot remove more bags than available (${cluster.bag_count} bags)`);
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(`${API_URL}/clusters/${cluster.id}/movement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          movement_type: movementType,
          quantity: parseInt(quantity, 10),
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Reset form
      setMovementType('IN');
      setQuantity(1);
      
      // Call the success callback with updated data
      if (onSuccess) onSuccess(data);
      
      // Close the modal
      onClose();
      
    } catch (err) {
      console.error('Error recording bag movement:', err);
      setError(`Failed to record movement: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!cluster) return null;
  
  return (
    <Dialog open={open} onClose={loading ? null : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Record Bag Movement for "{cluster.name}"
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
            {error}
          </Alert>
        )}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, mt: 2 }}>
          <Typography variant="body1">
            Current Bag Count: <strong>{cluster.bag_count}</strong>
          </Typography>
          <Typography variant="body1">
            Capacity: <strong>{cluster.capacity}</strong>
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />
        
        <FormControl component="form" onSubmit={handleSubmit} fullWidth>
          <FormLabel id="movement-type-label">Movement Type</FormLabel>
          <RadioGroup
            row
            aria-labelledby="movement-type-label"
            name="movement-type"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value)}
          >
            <FormControlLabel 
              value="IN" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpwardIcon color="success" sx={{ mr: 0.5 }} />
                  <Typography>Bags In</Typography>
                </Box>
              } 
            />
            <FormControlLabel 
              value="OUT" 
              control={<Radio />} 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowDownwardIcon color="error" sx={{ mr: 0.5 }} />
                  <Typography>Bags Out</Typography>
                </Box>
              } 
            />
          </RadioGroup>
          
          <TextField
            margin="normal"
            label="Quantity"
            type="number"
            fullWidth
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            inputProps={{ min: 1 }}
            required
            sx={{ mt: 3 }}
            helperText={movementType === 'OUT' 
              ? `Available bags: ${cluster.bag_count}` 
              : `Capacity: ${cluster.capacity} (${cluster.utilization}% utilized)`
            }
          />
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color={movementType === 'IN' ? 'success' : 'error'}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Recording...' : `Record ${movementType === 'IN' ? 'Inward' : 'Outward'} Movement`}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BagMovementModal;
