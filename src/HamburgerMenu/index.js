import React from "react";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import Menu from '@material-ui/core/Menu';
import MenuItem from "@material-ui/core/MenuItem";
import classNames from "classnames";

export default function HamburgerMenu({classes}) {
    const [anchorEl, setAnchorEl] = React.useState(null);
  
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleClose = () => {
      setAnchorEl(null);
    };
  
    return (
      <div>
        <IconButton
            color="inherit"
            aria-label="Open drawer"
            aria-controls="admin-menu" aria-haspopup="true"
            onClick={handleClick}
            className={classNames(classes.menuButton)}
            >
            <MenuIcon />
        </IconButton>
        <Menu
          id="admin-menu"
          anchorEl={anchorEl}
          keepMounted
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem component="a" href="https://admin.partner.platform.tools.bbc.co.uk">Add/Remove Users</MenuItem>
          <MenuItem component="a" href="https://castaway.tools.bbc.co.uk">Castaway</MenuItem>
        </Menu>
      </div>
    );
  }  