import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Button,
    TextField,
    Grid,
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
    Tab,
    Tabs,
    Container,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardMedia,
    CardContent,
    CardActions,
    Divider,
    Switch,
    FormControlLabel,
    Slider,
    List,
    ListItem,
    ListItemText,
    Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CameraIcon from '@mui/icons-material/Camera';
import ViewInArIcon from '@mui/icons-material/ViewInAr';
import RefreshIcon from '@mui/icons-material/Refresh';
import HLSPlayer from '../components/HLSPlayer';
import BagDetectionControls from '../components/BagDetectionControls';
import LineDrawingTool from '../components/LineDrawingTool';
import { useNavigate } from 'react-router-dom';

// Component for auto-refreshing detection feed image
const DetectionFeedImage = ({ camera, autoRefresh = true, thumbnailMode = false }) => {
    const [imgSrc, setImgSrc] = useState(`${API_URL}/cameras/${camera}/detection/frame?quality=${thumbnailMode ? 'thumbnail' : 'low'}`);
    const [error, setError] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const refreshInterval = useRef(null);
    const refreshTimestamp = useRef(Date.now());
    const imageRef = useRef(null);

    // Use Intersection Observer for lazy loading
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                setIsVisible(entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (imageRef.current) {
            observer.observe(imageRef.current);
        }

        return () => {
            if (imageRef.current) {
                observer.unobserve(imageRef.current);
            }
        };
    }, []);

    useEffect(() => {
        // Clear existing interval if camera changes
        if (refreshInterval.current) {
            clearInterval(refreshInterval.current);
        }

        // Reset error state and image source with new camera
        setError(false);
        setImgSrc(`${API_URL}/cameras/${camera}/detection/frame?quality=${thumbnailMode ? 'thumbnail' : 'low'}&t=${Date.now()}`);

        // Only set up auto-refresh if enabled AND the component is visible
        if (autoRefresh && isVisible) {
            refreshInterval.current = setInterval(() => {
                refreshTimestamp.current = Date.now();
                setImgSrc(`${API_URL}/cameras/${camera}/detection/frame?quality=${thumbnailMode ? 'thumbnail' : 'low'}&t=${refreshTimestamp.current}`);
            }, thumbnailMode ? 3000 : 1000); // Refresh less frequently for thumbnails
        }

        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [camera, autoRefresh, isVisible, thumbnailMode]);

    const handleImageError = () => {
        setError(true);
        // Don't stop refreshing, but show error state
    };

    const handleImageLoad = () => {
        setError(false);
    };

    // For thumbnail mode, use a more compact size
    if (thumbnailMode) {
        return (
            <Box 
                ref={imageRef}
                sx={{
                width: '100%',
                height: '160px',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                borderRadius: 2
            }}>
                {error ? (
                    <Box sx={{ textAlign: 'center', p: 1 }}>
                        <CircularProgress size={24} sx={{ mb: 1 }} />
                        <Typography variant="caption">Loading...</Typography>
                    </Box>
                ) : (
                    <img 
                        src={isVisible ? imgSrc : ''} // Only load image if visible
                        alt={`${camera} Feed`}
                        onError={handleImageError}
                        onLoad={handleImageLoad}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'cover'
                        }}
                    />
                )}
            </Box>
        );
    }

    return (
        <Box 
            ref={imageRef}
            sx={{
            width: '100%',
            height: '400px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 2
        }}>
            {error ? (
                <Box sx={{ textAlign: 'center', p: 2 }}>
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography>Connecting to camera stream...</Typography>
                </Box>
            ) : (
                <img 
                    src={isVisible ? imgSrc : ''} // Only load image if visible
                    alt="Detection Feed"
                    onError={handleImageError}
                    onLoad={handleImageLoad}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain'
                    }}
                />
            )}
            <Box sx={{
                position: 'absolute',
                bottom: 10,
                right: 10,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                padding: '4px 8px',
                borderRadius: 1,
                fontSize: 12
            }}>
                Live YOLOv8 Detection
            </Box>
        </Box>
    );
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const HLS_BASE_URL = process.env.REACT_APP_HLS_URL || 'http://localhost:8888'; // MediaMTX HLS endpoint

function CameraFeed() {
    const [cameras, setCameras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCameraName, setNewCameraName] = useState('');
    const [newCameraUrl, setNewCameraUrl] = useState(''); // Full RTSP URL input
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [cameraToDelete, setCameraToDelete] = useState(null);
    const [tabValue, setTabValue] = useState(0);
    const [selectedCamera, setSelectedCamera] = useState(null);
    const [detectionEnabled, setDetectionEnabled] = useState(false);
    const [detectionResults, setDetectionResults] = useState(null);
    const [lastFrameUrl, setLastFrameUrl] = useState('');
    const [confidence, setConfidence] = useState(50);
    const [detectionStatus, setDetectionStatus] = useState({});
    const [cameraCounts, setCameraCounts] = useState({});

    const fetchCameras = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${API_URL}/cameras`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            // Filter out potentially invalid entries if needed, e.g., where name or url is missing
            setCameras(data.filter(cam => cam.name && cam.url));
        } catch (e) {
            console.error("Failed to fetch cameras:", e);
            setError(`Failed to load cameras. ${e.message}`);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCameras();
    }, [fetchCameras]);

    const handleAddCamera = async (e) => {
        e.preventDefault();
        if (!newCameraName.trim() || !newCameraUrl.trim()) {
            setError('Camera name and RTSP URL cannot be empty.');
            return;
        }
         if (!newCameraUrl.toLowerCase().startsWith('rtsp://')) {
            setError('URL must start with rtsp://');
            return;
        }
        setError('');
        try {
            const response = await fetch(`${API_URL}/add_camera_url`, { // Use the correct endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newCameraName, url: newCameraUrl }),
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            setNewCameraName('');
            setNewCameraUrl('');
            // Optimistically add or wait a bit for MediaMTX restart?
            // For now, just refetch after a delay
            setTimeout(fetchCameras, 2000); // Refresh list after 2s
        } catch (e) {
            console.error("Failed to add camera:", e);
            setError(`Failed to add camera: ${e.message}`);
        }
    };

     const handleDeleteClick = (cameraName) => {
        setCameraToDelete(cameraName);
        setDeleteConfirmOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!cameraToDelete) return;
        setError('');
        try {
            const response = await fetch(`${API_URL}/delete_camera/${cameraToDelete}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }
            setDeleteConfirmOpen(false);
            setCameraToDelete(null);
            // Refresh list after a short delay to allow server restart
            setTimeout(fetchCameras, 2000); 
        } catch (e) {
            console.error("Failed to delete camera:", e);
            setError(`Failed to delete camera ${cameraToDelete}: ${e.message}`);
            setDeleteConfirmOpen(false);
        }
    };

    const handleDeleteCancel = () => {
        setDeleteConfirmOpen(false);
        setCameraToDelete(null);
    };

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    const handleCameraChange = (cameraName) => {
        setSelectedCamera(cameraName);
    };

    const fetchDetectionStatus = async (cameraName) => {
        try {
            const response = await fetch(`${API_URL}/cameras/${cameraName}/detection/status`);
            if (response.ok) {
                const data = await response.json();
                setDetectionStatus(data);
            }
        } catch (err) {
            console.error(`Error fetching detection status for camera ${cameraName}:`, err);
        }
    };

    const fetchCameraCounts = async (cameraName) => {
        if (!cameraName) return;
        
        try {
            const response = await fetch(`${API_URL}/cameras/${cameraName}/counts`);
            if (response.ok) {
                const data = await response.json();
                setCameraCounts(prev => ({
                    ...prev,
                    [cameraName]: data.counts
                }));
            }
        } catch (err) {
            console.error(`Error fetching counts for camera ${cameraName}:`, err);
        }
    };

    const resetCameraCounts = async (cameraName) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/cameras/${cameraName}/counts/reset`, {
                method: 'POST'
            });
            
            if (response.ok) {
                // Update the counts
                fetchCameraCounts(cameraName);
            } else {
                const errorData = await response.json();
                setError(`Failed to reset counts: ${errorData.error}`);
            }
        } catch (err) {
            setError(`Error resetting counts: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCameras();
        
        // Set up polling interval for detection status
        const statusInterval = setInterval(() => {
            if (selectedCamera) {
                fetchDetectionStatus(selectedCamera);
                fetchCameraCounts(selectedCamera);
            }
        }, 2000); // Poll every 2 seconds
        
        return () => {
            clearInterval(statusInterval);
        };
    }, [selectedCamera]);

    // Fetch counts for all cameras
    useEffect(() => {
        const fetchAllCounts = async () => {
            try {
                const response = await fetch(`${API_URL}/cameras/counts`);
                if (response.ok) {
                    const data = await response.json();
                    setCameraCounts(data);
                }
            } catch (err) {
                console.error('Error fetching all camera counts:', err);
            }
        };
        
        fetchAllCounts();
        
        // Set up interval to refresh all counts
        const countsInterval = setInterval(fetchAllCounts, 10000); // Every 10 seconds
        
        return () => {
            clearInterval(countsInterval);
        };
    }, []);

    return (
        <Box sx={{ p: 3 }}>
            <Typography variant="h4" component="h1" gutterBottom>
                Camera Management
            </Typography>
            
            <Tabs
                value={tabValue}
                onChange={handleTabChange}
                variant="fullWidth"
                sx={{ mb: 3 }}
            >
                <Tab label="Camera Feeds" icon={<CameraIcon />} iconPosition="start" />
                <Tab label="Bag Detection" icon={<ViewInArIcon />} iconPosition="start" />
            </Tabs>

            {tabValue === 0 ? (
                <Box>
                    <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E0E0E0', borderRadius: 2 }}>
                        {/* Camera Addition Form */}
                        <Typography variant="h6" sx={{ mb: 2 }}>Add Camera</Typography>
                        <Box component="form" onSubmit={handleAddCamera} sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Camera Name"
                                variant="outlined"
                                size="small"
                                value={newCameraName}
                                onChange={(e) => setNewCameraName(e.target.value)}
                                required
                                helperText="Used in the HLS URL (e.g., cam1)"
                            />
                            <TextField
                                label="Full RTSP URL"
                                variant="outlined"
                                size="small"
                                value={newCameraUrl}
                                onChange={(e) => setNewCameraUrl(e.target.value)}
                                required
                                sx={{flexGrow: 1}}
                                placeholder="rtsp://user:pass@host:port/path"
                            />
                            <Button type="submit" variant="contained" color="primary">
                                Add Camera
                            </Button>
                        </Box>
                    </Paper>

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Camera Grid */} 
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        cameras.length === 0 ? (
                            <Typography sx={{mt: 2}}>No cameras configured yet. Add one using the form above.</Typography>
                        ) : (
                            <Grid container spacing={2}>
                                {cameras.map((cam) => (
                                    <Grid item key={cam.name} xs={12} sm={6} md={4} lg={3}> 
                                        <Box sx={{ position: 'relative'}}> 
                                            <HLSPlayer 
                                                name={cam.name} 
                                                url={`${HLS_BASE_URL}/${cam.name}/index.m3u8`} 
                                                onDelete={null} // Pass delete handler if needed inside HLSPlayer
                                                onClick={() => setSelectedCamera(cam.name)}
                                            />
                                            {/* Add delete button externally if preferred */}
                                            <IconButton 
                                                onClick={() => handleDeleteClick(cam.name)} 
                                                size="small" 
                                                color="error"
                                                sx={{
                                                    position: 'absolute',
                                                    top: 8,
                                                    right: 8,
                                                    backgroundColor: 'rgba(0, 0, 0, 0.4)',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                                    },
                                                    color: 'white',
                                                    padding: '2px' // Smaller padding
                                                }}
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </Grid>
                                ))}
                            </Grid>
                        )
                    )}
                </Box>
            ) : (
                <Paper elevation={0} sx={{ p: 3, mb: 3, border: '1px solid #E0E0E0', borderRadius: 2 }}>
                    <Typography variant="h6" sx={{ mb: 3 }}>Cement Bag Detection</Typography>
                    
                    {cameras.length === 0 ? (
                        <Alert severity="info" sx={{ mb: 2 }}>
                            No cameras configured yet. Add cameras in the Camera Feeds tab first.
                        </Alert>
                    ) : (
                        <>
                            <Typography variant="subtitle1" gutterBottom>
                                Select a camera to enable bag detection:
                            </Typography>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid container spacing={2}>
                                    {cameras.map((cam) => (
                                        <Grid item key={cam.name} xs={12} sm={6} md={4} lg={3}>
                                            <Paper 
                                                elevation={selectedCamera === cam.name ? 8 : 1}
                                                sx={{ 
                                                    p: 1, 
                                                    border: selectedCamera === cam.name ? '2px solid #1976d2' : '1px solid #e0e0e0',
                                                    cursor: 'pointer',
                                                    '&:hover': { boxShadow: 3 }
                                                }}
                                                onClick={() => setSelectedCamera(cam.name)}
                                            >
                                                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                                    {cam.name}
                                                </Typography>
                                                <DetectionFeedImage 
                                                    camera={cam.name} 
                                                    autoRefresh={false} 
                                                    thumbnailMode={true} 
                                                />
                                                {cameraCounts[cam.name] && (
                                                    <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-around' }}>
                                                        <Box sx={{ textAlign: 'center' }}>
                                                            <Typography variant="caption" color="success.main">IN</Typography>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {cameraCounts[cam.name].in || 0}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ textAlign: 'center' }}>
                                                            <Typography variant="caption" color="error.main">OUT</Typography>
                                                            <Typography variant="body2" fontWeight="bold">
                                                                {cameraCounts[cam.name].out || 0}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                )}
                                            </Paper>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Grid>
                            
                            {selectedCamera ? (
                                <>
                                    <Box sx={{ mb: 3 }}>
                                        <Tabs value={tabValue} onChange={handleTabChange} centered>
                                            <Tab label="Detection Controls" />
                                            <Tab label="Counting Line Setup" />
                                        </Tabs>
                                    </Box>
                                    
                                    {tabValue === 0 ? (
                                        <>
                                            <BagDetectionControls cameraName={selectedCamera} />
                                            
                                            {cameraCounts[selectedCamera] && (
                                                <Paper elevation={0} sx={{ p: 2, my: 2, border: '1px solid #E0E0E0', borderRadius: 2 }}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                        <Typography variant="h6">Bag Counting Statistics</Typography>
                                                        <Button 
                                                            startIcon={<RefreshIcon />}
                                                            size="small"
                                                            onClick={() => resetCameraCounts(selectedCamera)}
                                                        >
                                                            Reset Counts
                                                        </Button>
                                                    </Box>
                                                    <Grid container spacing={2} sx={{ mt: 1 }}>
                                                        <Grid item xs={6}>
                                                            <Box sx={{ p: 2, bgcolor: 'success.light', color: 'white', borderRadius: 1, textAlign: 'center' }}>
                                                                <Typography variant="h4">{cameraCounts[selectedCamera].in || 0}</Typography>
                                                                <Typography>Bags IN</Typography>
                                                            </Box>
                                                        </Grid>
                                                        <Grid item xs={6}>
                                                            <Box sx={{ p: 2, bgcolor: 'error.light', color: 'white', borderRadius: 1, textAlign: 'center' }}>
                                                                <Typography variant="h4">{cameraCounts[selectedCamera].out || 0}</Typography>
                                                                <Typography>Bags OUT</Typography>
                                                            </Box>
                                                        </Grid>
                                                    </Grid>
                                                </Paper>
                                            )}
                                            
                                            <Box sx={{ mt: 3 }}>
                                                <Typography variant="h6" gutterBottom>Live Detection Feed</Typography>
                                                <DetectionFeedImage camera={selectedCamera} />
                                            </Box>
                                        </>
                                    ) : (
                                        <LineDrawingTool 
                                            cameraName={selectedCamera} 
                                            onLineChange={() => fetchCameraCounts(selectedCamera)}
                                        />
                                    )}
                                </>
                            ) : (
                                <Alert severity="info">
                                    Please select a camera to enable bag detection.
                                </Alert>
                            )}
                        </>
                    )}
                </Paper>
            )}

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={handleDeleteCancel}
            >
                <DialogTitle>Confirm Camera Deletion</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to delete the camera feed "{cameraToDelete}"? 
                        This will remove it from the MediaMTX configuration.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default CameraFeed;
