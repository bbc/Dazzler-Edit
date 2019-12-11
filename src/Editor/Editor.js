import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import Box from '@material-ui/core/Box';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import Typography from '@material-ui/core/Typography';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
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
var copiedContent = [];

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
    this.clearLoop = this.clearLoop.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleChangeMode = this.handleChangeMode.bind(this);

    this.state = {
      mode: "loop",
      schedule: [],
      scheduleDate: moment().utc().format("YYYY-MM-DD"),
      scheduleInsertionPoint: 1,
      scheduleModified: false,
      timeToFill: moment.duration(),
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

  handleChangeMode = (event) => {
    console.log('change mode', event.target.value);
    this.setState({mode: event.target.value});
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
      insertionType: "",
      versionCrid: item.version[0].crid[0].$.uri,
      pid: '',
      vpid: ''
    };
    if(this.state.mode === 'schedule') {
      this.pasteIntoSchedule(newItem);
    }
    else {
      this.pasteIntoLoop(newItem);
    }
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
    if(this.state.mode === 'schedule') {
      this.pasteIntoSchedule(newItem);
    }
    else {
      this.pasteIntoLoop(newItem);
    }
  }

  handleScheduleRowSelect = index => {
    console.log("handleScheduleDelete", index);
    this.setState({ scheduleInsertionPoint: index });
  };

  handleScheduleDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.deleteItemClosingGap(index);
    this.setState({ schedule: scheduleObject.items, });
  }
  
  handleDateChange = (date, schedule) => {
    console.log('handleDateChange', date);
    this.setState({ scheduleDate: date, schedule: schedule });
  };

  pasteIntoLoop(item) {
    console.log('pasteIntoLoop', item);
  }

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
    console.log('pasteIntoSchedule', this.state.schedule);
    scheduleObject.addFloating(index, n);
    this.setState({ schedule: scheduleObject.items, scheduleInsertionPoint: index+1 });
  }

  clearLoop() {
    this.setState({loop: [], loopDuration: moment.duration()});
  }

  deleteItemFromLoop = (index) => {
    const r = this.state.loop[index];
    let loop = [...this.state.loop];
    loop.splice(index, 1);
    this.setState({loop:loop, loopDuration: this.state.loopDuration.subtract(moment.duration(r.duration))});
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
          classes={{paper: classes.drawerPaper}}
        >
        </Drawer>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open
          })}
        >
          <div className={classes.drawerHeader} />
        <Box display="flex" flexDirection="row" p={1} m={1} bgcolor="background.paper">
          <Box width="25%" display="flex" flexDirection="column">
          <Typography variant="h4" align="center">Picklists</Typography>

          <FormControl component="fieldset" className={classes.formControl}>
          <FormLabel component="legend">Add To</FormLabel>
          <RadioGroup aria-label="mode" name="mode" value={this.state.mode} onChange={this.handleChangeMode} row>
            <FormControlLabel value="loop" control={<Radio color="primary"/>} label="Loop" />
            <FormControlLabel value="schedule" control={<Radio color="primary"/>} label="Schedule" />
          </RadioGroup>
        </FormControl>
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
          <Typography className={classes.heading}>Availabile Episodes</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Episode
          availability="available"
          sid={this.state.service.sid}
          handleClick={this.handleAddEpisode}
        />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      <ExpansionPanel>
        <ExpansionPanelSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel2bh-content"
          id="panel2bh-header"
        >
          <Typography className={classes.heading}>Upcoming Episodes</Typography>
        </ExpansionPanelSummary>
        <ExpansionPanelDetails>
        <Episode
          availability="P2D"
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
              handleClick={this.handleAddClip}
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
              handleClick={this.handleAddClip}
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
              handleClick={this.handleAddClip}
          />
        </ExpansionPanelDetails>
      </ExpansionPanel>
      </Box>      
      <Box mx="1rem" width="25%" flexGrow={1} flexDirection="column">
          <Typography variant="h4" align="center">Loop</Typography>
          <Loop
            data={this.state.loop}
            duration={this.state.loopDuration}
            timeToFill={this.state.timeToFill}
            onDelete={this.deleteItemFromLoop}
            onPaste={this.loopContent}
            onClear={this.clearLoop}
          />
          </Box>
          <Box width="50%" flexGrow={1} flexDirection="column">
          <Typography variant="h4" align="center">Schedule</Typography>
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
