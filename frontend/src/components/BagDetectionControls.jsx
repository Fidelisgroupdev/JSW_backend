import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Switch, 
  FormControlLabel,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const BagDetectionControls = ({ cameraName }) => {
  const [detectionEnabled, setDetectionEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectionResults, setDetectionResults] = useState(null);
  const [pollInterval, setPollInterval] = useState(null);

  // Check detection status on component mount
  useEffect(() => {
    fetchDetectionResults();
    
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  // Set up polling when detection is enabled
  useEffect(() => {
    if (detectionEnabled) {
      const interval = setInterval(fetchDetectionResults, 2000);
      setPollInterval(interval);
    } else if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [detectionEnabled]);

  const fetchDetectionResults = async () => {
    try {
      const response = await fetch(`${API_URL}/cameras/${cameraName}/detection/results`);
      if (response.ok) {
        const results = await response.json();
        setDetectionResults(results);
        setDetectionEnabled(results.detection_enabled);
        setError('');
      } else if (response.status !== 404) {
        // Only show error if it's not a 404 (camera not found)
        const errorData = await response.json();
        console.error('Detection results error:', errorData);
        setError(`Failed to get detection results: ${errorData.error}`);
      }
    } catch (err) {
      console.error('Failed to fetch detection results:', err);
    }
  };

  const toggleDetection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const endpoint = detectionEnabled 
        ? `${API_URL}/cameras/${cameraName}/detection/stop` 
        : `${API_URL}/cameras/${cameraName}/detection/start`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Detection toggled:', data);
        setDetectionEnabled(!detectionEnabled);
      } else {
        const errorData = await response.json();
        setError(`Failed to toggle detection: ${errorData.error}`);
      }
    } catch (err) {
      setError(`Detection error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Cement Bag Detection</Typography>
          <FormControlLabel
            control={
              <Switch 
                checked={detectionEnabled} 
                onChange={toggleDetection}
                disabled={loading}
              />
            }
            label={detectionEnabled ? "Enabled" : "Disabled"}
          />
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2">Processing...</Typography>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {detectionResults && detectionEnabled && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body1" gutterBottom>
              <strong>Bags Detected:</strong> {detectionResults.bags_detected || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last updated: {detectionResults.timestamp ? new Date(detectionResults.timestamp).toLocaleTimeString() : 'N/A'}
            </Typography>
          </Box>
        )}

        {detectionEnabled && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Detection is running. The video feed will show detected cement bags with bounding boxes.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BagDetectionControls;
