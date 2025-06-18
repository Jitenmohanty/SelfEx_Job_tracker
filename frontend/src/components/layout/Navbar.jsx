import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  IconButton, 
  Menu, 
  MenuItem, 
  Avatar 
} from '@mui/material';
import { useState } from 'react';
import WorkIcon from '@mui/icons-material/Work';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [anchorEl, setAnchorEl] = useState(null);
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };
  
  return (
    <AppBar position="static">
      <Toolbar>
        <WorkIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component={Link} to="/" sx={{ flexGrow: 1, textDecoration: 'none', color: 'inherit' }}>
          Job Tracker
        </Typography>
        
        {user ? (
          <Box>
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user.name.charAt(0)}
              </Avatar>
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/dashboard'); }}>
                Dashboard
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : (
          <Box>
            <Button color="inherit" component={Link} to="/login">
              Login
            </Button>
            <Button color="inherit" component={Link} to="/register">
              Register
            </Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;