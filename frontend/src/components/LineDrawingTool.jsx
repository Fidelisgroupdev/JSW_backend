import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Stack,
  Alert,
  CircularProgress
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import DirectionsIcon from '@mui/icons-material/Directions';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LineDrawingTool = ({ cameraName, onLineChange }) => {
  const [drawing, setDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [inDirection, setInDirection] = useState('right');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingLine, setExistingLine] = useState(null);
  
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const lastFrameUrl = useRef(`${API_URL}/cameras/${cameraName}/detection/frame?t=${Date.now()}`);
  const refreshInterval = useRef(null);
  
  // Load existing line on mount
  useEffect(() => {
    fetchExistingLine();
    
    // Set up refresh interval for the frame
    refreshInterval.current = setInterval(() => {
      const timestamp = Date.now();
      lastFrameUrl.current = `${API_URL}/cameras/${cameraName}/detection/frame?t=${timestamp}`;
      
      // Only reload image if not drawing
      if (!drawing && imgRef.current) {
        imgRef.current.src = lastFrameUrl.current;
      }
    }, 1000);
    
    return () => {
      if (refreshInterval.current) {
        clearInterval(refreshInterval.current);
      }
    };
  }, [cameraName]);
  
  // When the canvas or existing line changes, redraw
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw existing line if available
    if (existingLine) {
      const { start, end } = existingLine;
      drawLine(ctx, start[0], start[1], end[0], end[1]);
      drawArrow(ctx, start[0], start[1], end[0], end[1]);
    }
    // Draw current line if in drawing mode
    else if (drawing && startPoint && endPoint) {
      drawLine(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    }
  }, [existingLine, drawing, startPoint, endPoint]);
  
  const fetchExistingLine = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_URL}/cameras/${cameraName}/counting-line`);
      if (response.ok) {
        const data = await response.json();
        setExistingLine(data.line);
        
        // Also set the in direction
        if (data.line.in_direction) {
          setInDirection(data.line.in_direction);
        }
      } else if (response.status !== 404) {
        // Only show error if it's not a 404 (no line defined yet)
        const errorData = await response.json();
        setError(`Failed to fetch line: ${errorData.error}`);
      }
    } catch (err) {
      setError(`Error fetching line: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCanvasClick = (e) => {
    if (!drawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (!startPoint) {
      setStartPoint({ x, y });
    } else if (!endPoint) {
      setEndPoint({ x, y });
      // Automatically stop drawing mode once line is complete
      setDrawing(false);
    }
  };
  
  const handleCanvasMouseMove = (e) => {
    if (!drawing || !startPoint || endPoint) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Update temporary end point while moving
    setEndPoint({ x, y });
  };
  
  const drawLine = (ctx, x1, y1, x2, y2) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Draw start and end dots
    ctx.beginPath();
    ctx.arc(x1, y1, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#00FF00';
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(x2, y2, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF0000';
    ctx.fill();
  };
  
  const drawArrow = (ctx, x1, y1, x2, y2) => {
    const headLength = 15;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    
    // Draw arrowhead
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle - Math.PI / 6),
      y2 - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.moveTo(x2, y2);
    ctx.lineTo(
      x2 - headLength * Math.cos(angle + Math.PI / 6),
      y2 - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.strokeStyle = '#FFFF00';
    ctx.lineWidth = 3;
    ctx.stroke();
  };
  
  const handleStartDrawing = () => {
    setDrawing(true);
    setStartPoint(null);
    setEndPoint(null);
    setExistingLine(null);
    setSuccess('');
  };
  
  const handleCancelDrawing = () => {
    setDrawing(false);
    setStartPoint(null);
    setEndPoint(null);
    fetchExistingLine();
  };
  
  const handleSaveLine = async () => {
    if (!startPoint || !endPoint) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const lineData = {
        start_point: [startPoint.x, startPoint.y],
        end_point: [endPoint.x, endPoint.y],
        in_direction: inDirection
      };
      
      const response = await fetch(`${API_URL}/cameras/${cameraName}/counting-line`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(lineData)
      });
      
      if (response.ok) {
        const data = await response.json();
        setExistingLine(data.line);
        setSuccess('Counting line saved successfully!');
        if (onLineChange) {
          onLineChange(data.line);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to save line: ${errorData.error}`);
      }
    } catch (err) {
      setError(`Error saving line: ${err.message}`);
    } finally {
      setSaving(false);
      setDrawing(false);
    }
  };
  
  const handleDeleteLine = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch(`${API_URL}/cameras/${cameraName}/counting-line`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setExistingLine(null);
        setStartPoint(null);
        setEndPoint(null);
        setSuccess('Counting line deleted successfully!');
        if (onLineChange) {
          onLineChange(null);
        }
      } else {
        const errorData = await response.json();
        setError(`Failed to delete line: ${errorData.error}`);
      }
    } catch (err) {
      setError(`Error deleting line: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  
  const handleImageLoad = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Match canvas dimensions to the loaded image
    canvas.width = e.target.width;
    canvas.height = e.target.height;
    
    // Redraw line if needed
    const ctx = canvas.getContext('2d');
    if (existingLine) {
      const { start, end } = existingLine;
      drawLine(ctx, start[0], start[1], end[0], end[1]);
      drawArrow(ctx, start[0], start[1], end[0], end[1]);
    } else if (drawing && startPoint && endPoint) {
      drawLine(ctx, startPoint.x, startPoint.y, endPoint.x, endPoint.y);
    }
  };
  
  const handleInDirectionChange = (event) => {
    setInDirection(event.target.value);
  };

  return (
    <Paper elevation={0} sx={{ p: 2, border: '1px solid #E0E0E0', borderRadius: 2 }}>
      <Typography variant="h6" gutterBottom>
        Counting Line Setup
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
      {loading && <CircularProgress size={20} sx={{ mb: 2, ml: 2 }} />}
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" sx={{ mb: 1 }}>
          Draw a line across the video feed to count bags as they cross it.
        </Typography>

        <FormControl component="fieldset" sx={{ mb: 2 }}>
          <FormLabel component="legend">Select "In" Direction</FormLabel>
          <RadioGroup row value={inDirection} onChange={handleInDirectionChange}>
            <FormControlLabel value="left" control={<Radio />} label="Left" />
            <FormControlLabel value="right" control={<Radio />} label="Right" />
            <FormControlLabel value="up" control={<Radio />} label="Up" />
            <FormControlLabel value="down" control={<Radio />} label="Down" />
          </RadioGroup>
        </FormControl>
        
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          {!drawing && (
            <>
              <Button 
                variant="outlined" 
                startIcon={<EditIcon />}
                onClick={handleStartDrawing}
                disabled={loading || saving}
              >
                Draw Line
              </Button>
              {existingLine && (
                <Button 
                  variant="outlined" 
                  color="error"
                  startIcon={<DeleteOutlineIcon />}
                  onClick={handleDeleteLine}
                  disabled={loading || saving}
                >
                  Delete Line
                </Button>
              )}
            </>
          )}
          
          {drawing && (
            <>
              {startPoint && endPoint && (
                <Button 
                  variant="contained" 
                  color="success"
                  startIcon={<CheckIcon />}
                  onClick={handleSaveLine}
                  disabled={saving}
                >
                  Save Line
                </Button>
              )}
              <Button 
                variant="outlined" 
                color="inherit"
                startIcon={<BlockIcon />}
                onClick={handleCancelDrawing}
                disabled={saving}
              >
                Cancel
              </Button>
            </>
          )}
        </Stack>
      </Box>
      
      <Box 
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: 'auto',
          border: drawing ? '2px dashed #2196f3' : '1px solid #ccc',
          borderRadius: 2,
          overflow: 'hidden',
          cursor: drawing ? 'crosshair' : 'default',
        }}
      >
        <img 
          ref={imgRef}
          src={lastFrameUrl.current}
          alt="Camera Feed"
          style={{
            width: '100%',
            height: 'auto',
            display: 'block'
          }}
          onLoad={handleImageLoad}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: drawing ? 'auto' : 'none'
          }}
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMouseMove}
        />
        {drawing && (
          <Box sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 1,
            fontSize: 14
          }}>
            {!startPoint ? 'Click to set start point' : 'Click to set end point'}
          </Box>
        )}
        {existingLine && !drawing && (
          <Box sx={{
            position: 'absolute',
            bottom: 10,
            left: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: 1,
            fontSize: 14,
            display: 'flex',
            alignItems: 'center'
          }}>
            <DirectionsIcon sx={{ mr: 0.5, fontSize: 16 }} />
            Counting line active
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default LineDrawingTool;
