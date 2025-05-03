import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { Card, CardContent, Typography, IconButton, Box } from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

function HLSPlayer({ name, url, onDelete }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    useEffect(() => {
        let hls;
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(url);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(e => console.error("Autoplay prevented: ", e));
            });
            hls.on(Hls.Events.ERROR, (event, data) => {
                if (data.fatal) {
                    switch(data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            console.error('fatal network error encountered, try recovering');
                            hls.startLoad();
                            break;
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            console.error('fatal media error encountered, try recovering');
                            hls.recoverMediaError();
                            break;
                        default:
                            // cannot recover
                            console.error('Unrecoverable HLS error', data);
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = url;
            videoElement.addEventListener('loadedmetadata', () => {
                videoElement.play().catch(e => console.error("Autoplay prevented: ", e));
            });
        }

        const handleFullscreenChange = () => {
            setIsFullscreen(document.fullscreenElement === containerRef.current);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            if (hls) {
                hls.destroy();
            }
            if (videoElement) {
                videoElement.pause();
                videoElement.removeAttribute('src'); // clean up sources
                videoElement.load();
            }
             document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [url]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                alert(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <Card ref={containerRef} sx={{ 
            maxWidth: isFullscreen ? '100vw' : 400, 
            height: isFullscreen ? '100vh' : 'auto',
            display: 'flex', 
            flexDirection: 'column',
            position: isFullscreen ? 'fixed' : 'relative', // Fixed position for true full screen
            top: 0,
            left: 0,
            zIndex: isFullscreen ? 1400 : 'auto', // Ensure it's above other content
            backgroundColor: isFullscreen ? 'black' : 'inherit'
            }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, color: isFullscreen ? 'white' : 'inherit' }}>
                    <Typography variant="subtitle1" component="div" sx={{ml: 1}}>
                        {name}
                    </Typography>
                    <Box>
                         <IconButton onClick={toggleFullscreen} size="small" sx={{ color: isFullscreen ? 'white' : 'inherit' }}>
                            {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
                        </IconButton>
                        {!isFullscreen && onDelete && (
                            <IconButton onClick={() => onDelete(name)} size="small" color="error" sx={{ ml: 1 }}>
                                {/* Add Delete Icon if needed */}
                            </IconButton>
                        )}
                    </Box>
                </Box>
                <video 
                    ref={videoRef} 
                    style={{ 
                        width: '100%', 
                        height: isFullscreen ? 'calc(100% - 40px)' : 225, // Adjust height calculation
                        objectFit: 'contain', 
                        backgroundColor: 'black'
                    }} 
                    controls 
                    muted // Start muted to help with autoplay policies
                    playsInline // Important for iOS
                />
            </CardContent>
        </Card>
    );
}

export default HLSPlayer;
