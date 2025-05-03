import React from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Container, 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Drawer, 
  CssBaseline,
  ListItemIcon,
  Avatar,
  Divider,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
  Tooltip,
  Stack,
  Badge,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import VideocamIcon from '@mui/icons-material/Videocam';
import PersonIcon from '@mui/icons-material/Person';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const drawerWidth = 280;

function Layout() {
  const theme = useTheme();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = React.useState(null);
  
  // Mock user data - this would normally come from authentication
  const user = {
    name: 'Admin User',
    email: 'admin@jsw.com',
    avatar: null, // No avatar, will use initial instead
  };

  // Menu items configuration
  const menuItems = [
    { text: 'Dashboard', path: '/', icon: <DashboardIcon /> },
    { text: 'Cluster Management', path: '/clusters', icon: <GroupWorkIcon /> },
    { text: 'Camera Feed', path: '/cameras', icon: <VideocamIcon /> },
  ];

  // Check if path is active (for highlighting current route)
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };
  
  // User menu handlers
  const handleOpenMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      {/* Top AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: '#101f44', // Darker blue for app bar
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.3)'
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          {/* Left side: Logo and title */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/jsw-logo.png" 
              alt="JSW Logo" 
              height="36" 
              style={{ marginRight: '12px' }} 
            />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ 
                fontWeight: 'bold', 
                letterSpacing: '0.5px',
                fontSize: '1.2rem',
              }}
            >
              Inventory Management
            </Typography>
          </Box>
          
          {/* Right side: User profile and notifications */}
          <Stack direction="row" spacing={2} alignItems="center">
            {/* Notification bell */}
            <Tooltip title="Notifications">
              <IconButton color="inherit" size="large">
                <Badge badgeContent={3} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            
            {/* User profile */}
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, mr: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                  {user.name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  {user.email}
                </Typography>
              </Box>
              
              <Tooltip title="Account settings">
                <IconButton 
                  onClick={handleOpenMenu} 
                  size="small" 
                  sx={{ ml: 1 }}
                  color="inherit"
                >
                  <Avatar sx={{ width: 36, height: 36, bgcolor: theme.palette.secondary.main }}>
                    {user.name.charAt(0)}
                  </Avatar>
                  <ArrowDropDownIcon sx={{ color: 'white' }} />
                </IconButton>
              </Tooltip>
              
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleCloseMenu}
                PaperProps={{
                  elevation: 3,
                  sx: {
                    overflow: 'visible',
                    mt: 1.5,
                    '&:before': {
                      content: '""',
                      display: 'block',
                      position: 'absolute',
                      top: 0,
                      right: 14,
                      width: 10,
                      height: 10,
                      bgcolor: 'background.paper',
                      transform: 'translateY(-50%) rotate(45deg)',
                      zIndex: 0,
                    },
                  },
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleCloseMenu}>
                  <ListItemIcon>
                    <PersonIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleCloseMenu}>Logout</MenuItem>
              </Menu>
            </Box>
          </Stack>
        </Toolbar>
      </AppBar>
      
      {/* Sidebar Drawer - DARK VERSION */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#111827', // Dark sidebar
            borderRight: '1px solid #1f2937', // Dark border
            color: 'white',
          },
        }}
      >
        <Toolbar sx={{ backgroundColor: '#101f44' }} /> {/* Matching app bar color */}
        
        {/* Company branding section */}
        <Box sx={{ 
          p: 3, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-start',
          gap: 2
        }}>
          <Box 
            sx={{ 
              bgcolor: 'white',
              width: 44, 
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '8px',
              p: 0.5
            }}
          >
            <img 
              src="/images/jsw-logo.png" 
              alt="JSW Logo" 
              width="40" 
              height="40" 
              style={{ objectFit: 'contain' }}
            />
          </Box>
          <Box>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 700, 
                color: 'white',
                fontSize: '1.1rem',
                letterSpacing: '0.5px'
              }}
            >
              JSW CEMENT
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#9ca3af',
                fontSize: '0.75rem'
              }}
            >
              Inventory Management
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ mx: 2, borderColor: '#374151' }} />
        
        {/* Navigation Menu */}
        <Box sx={{ overflow: 'auto', py: 2 }}>
          <List>
            {menuItems.map((item) => {
              const active = isActive(item.path);
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                  <ListItemButton 
                    component={RouterLink} 
                    to={item.path}
                    selected={active}
                    sx={{
                      borderRadius: '0 20px 20px 0',
                      mx: 1,
                      position: 'relative',
                      '&.Mui-selected': {
                        backgroundColor: '#1e40af', // Highlighted blue when selected
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          top: '20%',
                          height: '60%',
                          width: '4px',
                          backgroundColor: '#60a5fa',
                          borderRadius: '0 4px 4px 0',
                        },
                        '&:hover': {
                          backgroundColor: '#1e4dd8',
                        }
                      },
                      '&:hover': {
                        backgroundColor: '#1f2937',
                      }
                    }}
                  >
                    <ListItemIcon sx={{ color: active ? '#60a5fa' : '#9ca3af', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{ 
                        fontWeight: active ? 600 : 400,
                        color: active ? 'white' : '#d1d5db'
                      }} 
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
        
        {/* Footer area in sidebar */}
        <Box sx={{ mt: 'auto', p: 2, borderTop: '1px solid #374151' }}>
          <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', textAlign: 'center' }}>
            © JSW Inventory {new Date().getFullYear()}
          </Typography>
        </Box>
      </Drawer>
      
      {/* Main Content */}
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3, 
          backgroundColor: '#f3f4f6',
          height: '100vh',
          overflow: 'auto'
        }}
      >
        <Toolbar /> {/* Spacer for AppBar */}
        <Container maxWidth="xl" sx={{ mt: 2 }}>
          <Outlet /> {/* Nested routes render here */}
        </Container>
      </Box>
    </Box>
  );
}

export default Layout;
