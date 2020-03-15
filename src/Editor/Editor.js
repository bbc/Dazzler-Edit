import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Box } from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import ExpansionPanelDetails from "@material-ui/core/ExpansionPanelDetails";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormControl from "@material-ui/core/FormControl";
import FormLabel from "@material-ui/core/FormLabel";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import IconButton from "@material-ui/core/IconButton";
import MenuIcon from "@material-ui/icons/Menu";
import moment from "moment";
import "moment-duration-format";
import Episode from "../Episode/Episode";
import Live from "../Live/Live";
import Clips from "../Clips/Clips";
import Specials from "../Specials/Specials";
import SchedulePicker from "../SchedulePicker/SchedulePicker";
import ScheduleToolbar from "../ScheduleToolbar/ScheduleToolbar";
import ScheduleView from "../ScheduleView/ScheduleView";
import ScheduleObject from "../ScheduleObject";
import Loop from "../Loop/Loop";
import PlatformDao from "../PlatformDao/PlatformDao";
import { fetchSchedule, saveSchedule } from "../ScheduleDao/ScheduleDao";
import TimeDisplay from "../TimeDisplay";
import RefreshAndNotifications from "../RefreshAndNotifications";

const drawerWidth = 240;

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
  appBarTitle: {
    margin: theme.spacing(2),
    flexGrow: 1
  },
  appBarName: {
    margin: theme.spacing(2),
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
    padding: theme.spacing(3),
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

const services = {
  bbc_hindi_tv: {
    sid: "bbc_hindi_tv",
    name: "Hindi",
    serviceIDRef: "TVHIND01"
  },
  bbc_marathi_tv: {
    sid: "bbc_marathi_tv",
    name: "Marathi",
    serviceIDRef: "TVMAR01"
  }
};

class Editor extends React.Component {
  constructor(props) {
    super(props);

    this.handleScheduleDelete = this.handleScheduleDelete.bind(this);
    this.handleOccurenceDelete = this.handleOccurenceDelete.bind(this);
    this.handleAddLive = this.handleAddLive.bind(this);
    this.handleAddClipOrEpisode = this.handleAddClipOrEpisode.bind(this);
    this.clearLoop = this.clearLoop.bind(this);
    this.uploadLoop = this.uploadLoop.bind(this);
    this.saveLoop = this.saveLoop.bind(this);
    this.pasteIntoSchedule = this.pasteIntoSchedule.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleChangeMode = this.handleChangeMode.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.clearSchedule = this.clearSchedule.bind(this);
    this.reloadSchedule = this.reloadSchedule.bind(this);
    this.handleNewSchedule = this.handleNewSchedule.bind(this);
    this.filterUpcomingEpisodes = this.filterUpcomingEpisodes.bind(this);
    this.testLoop = this.testLoop.bind(this);

    this.state = {
      schedule: new ScheduleObject(
        "bbc_hindi_tv",
        moment()
          .utc()
          .startOf("day")
      ),
      mode: "loop",
      scheduleInsertionPoint: 1,
      scheduleModified: false,
      timeToFill: moment.duration(),
      upcomingAvailability: moment.duration("P1D"),
      open: false,
      isPaneOpen: false,
      panelShow: null,
      loop: [],
      loopDuration: moment.duration(),
      refresh: 0,
      user: { name: "anonymous", auth: true }
    };
  }

  componentDidMount() {
    PlatformDao.getUser(user => {
      this.setState({ user: user });
    });
  }

  componentDidUpdate(prevProps) {}

  handleChangeMode = event => {
    this.setState({ mode: event.target.value });
  };

  handleDrawerOpen = () => {
    //this.setState({ open: true });
  };

  handleDrawerClose = () => {
    //this.setState({ open: false });
  };

  handleAddLive(item) {
    let scheduleObject = new ScheduleObject(
      this.state.schedule.sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    const indexOfLive = scheduleObject.addLive(item);
    console.log("ITEMS", this.state.schedule.items);
    this.updateSchedule(scheduleObject, indexOfLive - 1, true);
  }

  handleAddClipOrEpisode(item) {
    //console.log('handleAddClipOrEpisode', item);
    if (this.state.mode === "schedule") {
      this.pasteIntoSchedule(item);
    } else {
      this.pasteIntoLoop(item);
    }
  }

  filterUpcomingEpisodes(items) {
    //console.log('filterUpcomingEpisodes');
    let filtered = [];
    for (let i = 0; i < items.length; i++) {
      let wanted = false;
      for (let j = 0; j < items[i].available_versions.available; j++) {
        const version = items[i].available_versions.version[j];
        //console.log(version);
        for (let k = 0; k < version.availabilities.availability.length; k++) {
          const availability = version.availabilities.availability[k];
          const start = moment(availability.scheduled_start);
          const end = moment(availability.scheduled_end);
          const sip = this.state.schedule.items[
            this.state.scheduleInsertionPoint
          ].startTime;
          //console.log(start.format(), end.format(), sip.format());
          wanted |= sip.isBetween(start, end);
        }
      }
      if (wanted) {
        filtered.push(items[i]);
      }
    }
    return filtered;
  }

  calculateTimeToFill(schedule, index) {
    for (let i = index; i < schedule.length; i++) {
      if (schedule[i].insertionType === "gap") {
        return moment.duration(schedule[i].duration);
      }
    }
    return moment.duration();
  }

  handleScheduleRowSelect = index => {
    const ttf = this.calculateTimeToFill(this.state.schedule.items, index);
    this.setState({ scheduleInsertionPoint: index, timeToFill: ttf });
  };

  handleScheduleDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.schedule.sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    const newIndex = scheduleObject.deleteItemClosingGap(index);
    this.updateSchedule(scheduleObject, newIndex, true);
  }

  handleOccurenceDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.schedule.sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    let pid = scheduleObject.items[index].asset.pid;
    const newIndex = scheduleObject.deleteAllOccurencesClosingGap(pid);
    this.updateSchedule(scheduleObject, newIndex, true);
  }

  handleNewSchedule(scheduleObject) {
    //console.log('handleNewSchedule', scheduleObject);
    //scheduleObject.sid, scheduleObject.date.format(), scheduleObject.items);
    const now = moment().startOf("hour");
    const endOfSchedule = moment(scheduleObject.date).add(1, "day");
    let upcomingAvailability = moment.duration(endOfSchedule.diff(now));
    if (upcomingAvailability.valueOf() < 0) {
      upcomingAvailability = moment.duration("P1D");
    }
    this.setState({ upcomingAvailability: upcomingAvailability });
    this.updateSchedule(scheduleObject, 1, false);
  }

  handleDateChange = date => {
    //console.log('handleDateChange', date);
    try {
      const sid = this.state.schedule.sid;
      fetchSchedule(sid, moment(date), schedule =>
        this.handleNewSchedule(schedule)
      );
    } catch (error) {
      console.log(error);
    }
  };

  pasteIntoSchedule(items) {
    let index = this.state.scheduleInsertionPoint;
    let scheduleObject = new ScheduleObject(
      this.state.schedule.sid,
      this.state.schedule.date,
      this.state.schedule.items
    );

    const newIndex = scheduleObject.addFloating(index, items);
    this.updateSchedule(scheduleObject, newIndex, true);
  }

  updateSchedule(scheduleObject, scheduleInsertionPoint, modified) {
    const ttf = this.calculateTimeToFill(
      scheduleObject.items,
      scheduleInsertionPoint
    );
    let sip = scheduleInsertionPoint;
    if (sip === scheduleObject.items.length - 1) {
      sip--; // don't point at the end sentinel
    }
    this.setState({
      schedule: scheduleObject,
      scheduleInsertionPoint: sip,
      scheduleModified: modified,
      timeToFill: ttf
    });
  }

  reloadSchedule() {
    this.handleDateChange(this.state.schedule.date);
  }

  clearSchedule() {
    this.updateSchedule(
      new ScheduleObject(this.state.schedule.sid, this.state.schedule.date),
      1,
      false
    );
  }

  testLoop() {
    this.pasteIntoLoop({
      duration: "PT55M",
      title: "A test item"
    });
  }

  pasteIntoLoop(item) {
    item.action = "";
    let loop = [...this.state.loop];
    loop.push({ ...item, insertionType: "" });
    this.setState({
      loop: loop,
      loopDuration: this.state.loopDuration.add(moment.duration(item.duration))
    });
  }

  clearLoop() {
    this.setState({ loop: [], loopDuration: moment.duration() });
  }

  uploadLoop(e) {
    try {
      var file = e.target.files[0];
      let reader = new FileReader();
      reader.onload = e => {
        try {
          let items = JSON.parse(e.target.result);
          this.setState({ loop: items });
          console.log(e.target.result);
        } catch (err) {
          alert("Invalid format");
          console.log(err);
        }
      };

      reader.readAsText(file);
    } catch (err) {
      alert("error");
      console.log(err);
    }
  }

  saveLoop() {
    const element = document.createElement("a");
    // const items = JSON.stringify(this.state.loop);
    const file = new Blob([JSON.stringify(this.state.loop)], {
      type: "application/json"
    });
    element.href = URL.createObjectURL(file);
    element.download =
      services[this.state.schedule.sid].name +
      " " +
      this.state.user.name +
      " Loop.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  deleteItemFromLoop = index => {
    const r = this.state.loop[index];
    let loop = [...this.state.loop];
    loop.splice(index, 1);
    this.setState({
      loop: loop,
      loopDuration: this.state.loopDuration.subtract(
        moment.duration(r.duration)
      )
    });
  };

  savePlaylist = () => {
    //console.log('savePlaylist');
    const This = this; // closure for callback
    saveSchedule(
      services[this.state.schedule.sid].serviceIDRef,
      this.state.schedule.items,
      function() {
        This.setState({ scheduleModified: false });
      },
      function(e) {
        console.log(e);
      }
    );
  };

  render() {
    const { classes } = this.props;
    const { open } = this.state;
    //console.log('Editor.render');
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
              {services[this.state.schedule.sid].name}
            </Typography>
            <Typography
              align="center"
              className={classes.appBarTitle}
              variant="h5"
              color="inherit"
              noWrap
            >
              This is Dazzler!
            </Typography>
            <Typography
              className={classes.appBarName}
              variant="h6"
              color="inherit"
              noWrap
            >
              {this.state.user.name}
            </Typography>
          </Toolbar>
          <Typography variant="h6">
            <TimeDisplay />
          </Typography>
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={open}
          classes={{ paper: classes.drawerPaper }}
        ></Drawer>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open
          })}
        >
          <div className={classes.drawerHeader} />
          <Box
            display="flex"
            flexDirection="row"
            p={1}
            m={1}
            bgcolor="background.paper"
          >
            <Box width="28%" display="flex" flexDirection="column">
              <Typography variant="h4" align="center">
                Picklists
              </Typography>

              <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">Add non-live to</FormLabel>
                <RadioGroup
                  aria-label="mode"
                  name="mode"
                  value={this.state.mode}
                  onChange={this.handleChangeMode}
                  row
                >
                  <FormControlLabel
                    value="loop"
                    control={<Radio color="primary" />}
                    label="Loop"
                  />
                  <FormControlLabel
                    value="schedule"
                    control={<Radio color="primary" />}
                    label="Schedule"
                  />
                  <RefreshAndNotifications buttonClass={classes.button}/>
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
                    date={this.state.schedule.date.utc().format("YYYY-MM-DD")}
                    sid={this.state.schedule.sid}
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
                  <Typography className={classes.heading}>
                    Available Episodes
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Episode
                    availability="available"
                    sid={this.state.schedule.sid}
                    handleClick={this.handleAddClipOrEpisode}
                  />
                </ExpansionPanelDetails>
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>
                    Upcoming Episodes
                  </Typography>
                </ExpansionPanelSummary>
                <ExpansionPanelDetails>
                  <Episode
                    availability={this.state.upcomingAvailability.toISOString()}
                    sid={this.state.schedule.sid}
                    handleClick={this.handleAddClipOrEpisode}
                    // resultsFilter={this.filterUpcomingEpisodes}
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
                    sid={this.state.schedule.sid}
                    handleClick={this.handleAddClipOrEpisode}
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
                    sid={this.state.schedule.sid}
                    handleClick={this.handleAddClipOrEpisode}
                  />
                </ExpansionPanelDetails>
              </ExpansionPanel>
            </Box>
            <Box mx="1rem" width="28%" flexGrow={1} flexDirection="column">
              <Typography variant="h4" align="center">
                Loop
              </Typography>
              <Loop
                onTest={this.testLoop}
                data={this.state.loop}
                duration={this.state.loopDuration}
                timeToFill={this.state.timeToFill}
                onDelete={this.deleteItemFromLoop}
                onPaste={this.pasteIntoSchedule}
                onClear={this.clearLoop}
                onUpload={this.uploadLoop}
                onSave={this.saveLoop}
              />
            </Box>
            <Box width="44%" flexGrow={1} flexDirection="column">
              <Typography variant="h4" align="center">
                Schedule
              </Typography>
              <SchedulePicker
                enabled={this.state.scheduleModified ? false : true}
                scheduleDate={this.state.schedule.date}
                onDateChange={this.handleDateChange}
              />
              <ScheduleView
                onRowSelected={this.handleScheduleRowSelect}
                onDelete={this.handleScheduleDelete}
                onOccurenceDelete={this.handleOccurenceDelete}
                data={this.state.schedule.items}
                row={this.state.scheduleInsertionPoint}
                lastUpdated=""
              />
              <ScheduleToolbar
                saveEnabled={this.state.user.auth}
                contentModified={this.state.scheduleModified}
                onSave={this.savePlaylist}
                onClear={this.clearSchedule}
                onReload={this.reloadSchedule}
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
