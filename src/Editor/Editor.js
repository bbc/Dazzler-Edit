import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Box from '@material-ui/core/Box';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import ChevronLeftIcon from "@material-ui/icons/ChevronLeft";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import LiveTv from "@material-ui/icons/LiveTv";
import MailIcon from "@material-ui/icons/Schedule";
import LoopIcon from "@material-ui/icons/Loop";
import Payment from "@material-ui/icons/VideoLibrary";
import SlowMotionVideoIcon from "@material-ui/icons/SlowMotionVideo";
import Movie from "@material-ui/icons/Movie";
import Opacity from "@material-ui/icons/Opacity";
import Picture from "@material-ui/icons/PictureInPicture";
import axios from "axios";
import moment from "moment";
import 'moment-duration-format';
import Episode from "../Episode/Episode";
import Live from "../Live/Live";
import Clips from "../Clips/Clips";
import Specials from "../Specials/Specials";
import SchedulePicker from "../SchedulePicker/SchedulePicker";
import ScheduleToolbar from "../ScheduleToolbar/ScheduleToolbar";
import ScheduleView from "../ScheduleView/ScheduleView";
import ScheduleObject from "../ScheduleObject";
import Loop from "../Loop/Loop";

const drawerWidth = 240;
var time = -2;
var scheduleItems = [];
var scratchPadItems = [];
var copiedContent = [];
var loopedContent = [];
var icons = [
  <MailIcon />,
  <Movie />,
  <Payment />,
  <Picture />,
  <SlowMotionVideoIcon />,
  <Opacity />
];
// var viewIcons = [<LiveTv />, <Assignment />, <LoopIcon />];
var viewIcons = [<LiveTv />, <LoopIcon />];
var URLPrefix = "";
//checking if running locally

if (process.env.NODE_ENV === "development") {
  URLPrefix = "http://localhost:8080";
}

const styles = theme => ({
  root: {
    display: "flex"
  },
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    })
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  appBarName: {
    marginLeft: "auto"
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20
  },
  hide: {
    display: "none"
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0
  },
  drawerPaper: {
    width: drawerWidth
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    ...theme.mixins.toolbar,
    justifyContent: "flex-end"
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen
    }),
    marginLeft: -drawerWidth
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen
    }),
    marginLeft: 0
  }
});

class Editor extends React.Component {

  constructor(props) {
    super(props);

    this.handleScheduleDelete = this.handleScheduleDelete.bind(this);
    this.handleAddLive = this.handleAddLive.bind(this);
    this.handleAddClip = this.handleAddClip.bind(this);
    this.handleAddEpisode = this.handleAddEpisode.bind(this);
    this.copyContent = this.copyContent.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.lastItem = this.lastItem.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);

    this.state = {
      mode: "writeToLoop",
      schedule: [],
      scheduleDate: moment().utc().format("YYYY-MM-DD"),
      scheduleInsertionPoint: -1,
      scheduleModified: false,
      open: false,
      Title: "",
      isPaneOpen: false,
      panelShow: null,
      itemType: "",
      count: 0,
      clips: [],
      jupiter: [],
      specials: [],
      episodes: [],
      live: [],
      loop: [],
      loopDuration: moment.duration(),
      user: { name: "anonymous", auth: true },
      service: { sid: "bbc_marathi_tv", name: "Marathi", serviceIDRef: "TVMAR01" }
    };
  }

  componentDidMount() {
    console.log("DidMount", time);
    console.log(scheduleItems);
    console.log(copiedContent);

    // get user
    axios
      .get(`${URLPrefix}/api/v1/user`)
      .then(response => {
        console.log("user", JSON.stringify(response.data));
        console.log("RESPONSE", response);
        this.setState({user: response.data});
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidUpdate(prevProps) {
    console.log('editor componentDidUpdate');
  }

  handleDrawerOpen = () => {
    //this.setState({ open: true });
  };

  handleDrawerClose = () => {
    //this.setState({ open: false });
  };

  handleAddLive(window) {
    console.log("LIVE ITEM", window);
    const startTime = moment(window.scheduled_time.start);
    const newItem = {
      captureChannel: window.service.sid, // TODO make use of this
      title: "Live broadcast segment",
      duration: window.duration.toISOString(),
      startTime: startTime,
      live: true,
      insertionType: ""
    };
    for (let i = 0; i < window.window_of.length; i++) {
      switch (window.window_of[i].result_type) {
        case "version":
          newItem.versionPid = window.window_of[i].pid;
          newItem.versionCrid = window.window_of[i].crid;
          break;
        default: // DO Nothing
      }
    }
    console.log(newItem);
    let scheduleObject = new ScheduleObject(
      this.state.service.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.addLive(newItem);
    console.log(scheduleObject.items);
    this.setState({schedule: scheduleObject.items});
  }

  handleAddEpisode(item) {
    console.log("handleAddEpisode ITEM", item);
    const version = item.available_versions.version[0]; // TODO pick a version
    const newItem = {
      title: item.title ? item.title : item.presentation_title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: ""
    };
    this.pasteIntoSchedule(newItem);
  }

  handleAddClip(item) {
    console.log("handleAddClip ITEM", item);
    const version = item.available_versions.version[0]; // TODO pick a version
    const newItem = {
      title: item.title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: ""
    };
    this.pasteIntoSchedule(newItem);
  }

  handleScheduleRowSelect = index => {
    console.log("handleScheduleDelete", index);
    //this.setState({ scheduleInsertionPoint: index });
  };

  handleScheduleDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.deleteItemClosingGap(index);
    //this.setState({ schedule: scheduleObject.items, });
  }
  
  handleDateChange = (date, schedule) => {
    console.log('handleDateChange', date);
    this.setState({ scheduleDate: date, schedule: schedule });
  };

  handleScheduleRowSelect = index => {
    console.log("handleScheduleDelete", index);
    //this.setState({ scheduleInsertionPoint: index });
  };

  pasteIntoSchedule(items, copies) {
    if (!Array.isArray(items)) items = [items];
    if (copies === undefined) copies = 1;
    console.log("pasteIntoSchedule", items, copies);
    let n = [...items];
    while (copies > 1) {
      n = n.concat(items);
      copies--;
    }
    console.log( "insert %d items at index %d", n.length, this.state.scheduleInsertionPoint);
    let index = this.state.scheduleInsertionPoint;
    let scheduleObject = new ScheduleObject(
      this.state.service.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    //scheduleObject.addFloating(index, n);
    //this.setState({ schedule: scheduleObject.items });
  }

  lastItem = scheduleTime => {
    //this.setState({ scheduleTime: scheduleTime });
  };

  loopContent = (rows, startTime, finishTime) => {
    loopedContent = [];
    if (rows.length > 0) {
      rows.map((row, index) => loopedContent.push(rows[index]));
    }
  };

  copyContent(rows) {
    copiedContent = [];
    if (rows.length > 0) {
      rows.map((row, index) => copiedContent.push(rows[index]));
    }
  }

  clearContent(loop) {
    if (loop) {
      //this.setState({loop: [], loopDuration: moment.duration()});
    } else {
      scratchPadItems = [];
    }
  }

  deleteItemFromLoop = (index) => {
    const r = this.state.loop[index];
    let loop = [...this.state.loop];
    loop.splice(index, 1);
    //this.setState({loop:loop, loopDuration: this.state.loopDuration.subtract(moment.duration(r.duration))});
  }

  deleteItem(id) {
    console.log('delete item', id);
  }
 
  render() {
    const { classes, theme } = this.props;
    const { open } = this.state;
    console.log('Editor.render');
    return (
      <div className={classes.root}>
        <AppBar
          position="fixed"
          className={classNames(classes.appBar, {
            [classes.appBarShift]: open
          })}
        >
          <Toolbar disableGutters={!open}>
            <IconButton
              color="inherit"
              aria-label="Open drawer"
              onClick={this.handleDrawerOpen}
              className={classNames(classes.menuButton, open && classes.hide)}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" color="inherit" noWrap>
              <center>{this.state.service.name}</center>
            </Typography>
            <Typography className={classes.appBarName} variant="h6" color="inherit" noWrap>
              <center>{this.state.user.name}</center>
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={open}
          classes={{
            paper: classes.drawerPaper
          }}
        >
          <div className={classes.drawerHeader}>
            <IconButton onClick={this.handleDrawerClose}>
              {theme.direction === "ltr" ? (
                <ChevronLeftIcon />
              ) : (
                <ChevronRightIcon />
              )}
            </IconButton>
          </div>
          <center>
            {" "}
            <h3> View </h3>{" "}
          </center>
          <Divider />
          <List>
            {/* {["Schedule", "Scratchpad", "Loop"].map((text, index) => ( */}
            {["Schedule", "Loop"].map((text, index) => (
              <ListItem
                button
                key={text}
                onClick={() => {
                  this.iHandleClick(text);
                }}
              >
                <ListItemIcon>{viewIcons[index]}</ListItemIcon>

                <ListItemText primary={text} />
              </ListItem>
            ))}
          </List>

          <center>
            {" "}
            <h3>Menu </h3>{" "}
          </center>
          <Divider />
          <List>
            {["Live", "Episodes", "Jupiter Clips", "Web Clips", "Specials"].map(
              (text, index) => (
                <ListItem
                  button
                  key={text}
                  onClick={() => {
                    this.iHandleClick(text);
                  }}
                >
                  <ListItemIcon>{icons[index]}</ListItemIcon>

                  <ListItemText primary={text} />
                </ListItem>
              )
            )}
          </List>
          <Divider />
        </Drawer>

        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open
          })}
        >
          <div className={classes.drawerHeader} />
        <Box display="flex" flexDirection="row" p={1} m={1} bgcolor="background.paper">
          <Box>
          <ExpansionPanel>
          <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1bh-content"
          id="panel1bh-header"
        >
          <Typography className={classes.heading}>Live</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Live
              date={this.state.scheduleDate}
	            sid={this.state.service.sid}
	            handleClick={this.handleAddLive}
	          />
        </ExpansionPanelDetails>
          </ExpansionPanel>
          <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2bh-content"
          id="panel2bh-header"
        >
          <Typography className={classes.heading}>Episodes</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Episode
              sid={this.state.service.sid}
              handleClick={this.handleAddEpisode}
            />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel3bh-content"
          id="panel2bh-header"
        >
          <Typography className={classes.heading}>Jupiter Clips</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Clips
              type="jupiter"
              sid={this.state.service.sid}
              handleClick={this.handleClick}
            />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel4bh-content"
          id="panel2bh-header"
        >
          <Typography className={classes.heading}>Web Clips</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Clips
              type="web"
              sid={this.state.service.sid}
              handleClick={this.handleClick}
            />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel5bh-content"
          id="panel2bh-header"
        >
          <Typography className={classes.heading}>Specials</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Specials
              sid={this.state.service.sid}
              handleClick={this.handleClick}
            />
        </ExpansionPanelDetails>
      </ExpansionPanel>
          </Box>
          <Box flexGrow={1}>
          <Loop
            data={this.state.loop}
            duration={this.state.loopDuration.valueOf()}
            deleteItem={this.deleteItemFromLoop}
            loopContent={this.loopContent}
            clearContent={this.clearContent}
            scheduleTime={this.state.scheduleTime}
          />
          </Box>
          <Box flexGrow={1}>
          <SchedulePicker
            enabled={!this.state.scheduleModified}
            sid={this.state.service.sid}
            scheduleDate={this.state.scheduleDate}
            onDateChange={this.handleDateChange}
          />
          <ScheduleView
            onRowSelected={this.handleScheduleRowSelect}
            onDelete={this.handleScheduleDelete}
            data={this.state.schedule}
            row={this.state.scheduleInsertionPoint}
            lastUpdated=""
          />
          <ScheduleToolbar
            saveEnabled={this.state.scheduleModified && this.state.user.auth}
            onSaveClicked={this.savePlaylist}
          />
          </Box>
        </Box>
        </main>
      </div>
    );
  }
}

Editor.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(Editor);
