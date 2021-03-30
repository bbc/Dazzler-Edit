import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Box } from "@material-ui/core";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import moment from "moment";
import "moment-duration-format";
import Episode from "../Episode/Episode";
import Live from "../Live/Live";
import Clips from "../Clips/Clips";
import Specials from "../Specials/Specials";
import SchedulePicker from "../SchedulePicker/SchedulePicker";
import ScheduleToolbar from "../ScheduleToolbar/ScheduleToolbar";
//import ScheduleView from "../ScheduleView/ScheduleView";
import ScheduleView from "../NewScheduleView";
import ScheduleObject from "../ScheduleObject";
import Loop from "../Loop/Loop";
import PlatformDao from "../PlatformDao/PlatformDao";
import {
  fetchSchedule,
  saveSchedule,
  getLanguages,
} from "../ScheduleDao/ScheduleDao";
import TimeDisplay from "../TimeDisplay";
import Refresh from "../Refresh";
import PushControl from "../PushControl";
import HamburgerMenu from "../HamburgerMenu";

const drawerWidth = 240;

const styles = (theme) => ({
  root: {
    display: "flex",
  },
  appBar: {
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(["margin", "width"], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  appBarTitle: {
    margin: theme.spacing(2),
    flexGrow: 1,
  },
  appBarName: {
    margin: theme.spacing(2),
    marginLeft: "auto",
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
  hide: {
    display: "none",
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: "flex",
    alignItems: "center",
    padding: "0 8px",
    ...theme.mixins.toolbar,
    justifyContent: "flex-end",
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create("margin", {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
});

var start = moment().utc().startOf("day");
var end = moment().utc().add(1, "day");
start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
end.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

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
    this.handleTo = this.handleTo.bind(this);
    this.handleFrom = this.handleFrom.bind(this);
    this.handleDayTo = this.handleDayTo.bind(this);
    this.handleDayFrom = this.handleDayFrom.bind(this);
    this.handleChangeMode = this.handleChangeMode.bind(this);
    this.handleChangeLanguage = this.handleChangeLanguage.bind(this);
    this.handleRefresh = this.handleRefresh.bind(this);
    this.savePlaylist = this.savePlaylist.bind(this);
    this.clearSchedule = this.clearSchedule.bind(this);
    this.reloadSchedule = this.reloadSchedule.bind(this);
    this.handleNewSchedule = this.handleNewSchedule.bind(this);
    this.filterUpcomingEpisodes = this.filterUpcomingEpisodes.bind(this);
    this.testLoop = this.testLoop.bind(this);

    this.state = {
      schedule: new ScheduleObject(
        "bbc_hindi_tv",
        moment().utc().startOf("day")
      ),
      mode: "loop",
      scheduleInsertionPoint: 1,
      scheduleModified: false,
      language: localStorage.getItem("language") || "Hindi",
      configObj: (() => {
        if (localStorage.getItem("configObj")) {
          return JSON.parse(localStorage.getItem("configObj"));
        } else {
          console.log(localStorage.getItem("configObj"));
          return {
            Hindi: {
              sid: "bbc_hindi_tv",
            },
          };
        }
      })(),
      timeToFill: moment.duration(),
      upcomingAvailability: moment.duration("P1D"),
      open: false,
      isPaneOpen: false,
      panelShow: null,
      loop: [],
      loopDuration: moment.duration(),
      user: { name: "anonymous", auth: true },
      side: true,
      languageList: [],
      from: start,
      to: end,
    };
  }

  componentDidMount() {
    const language = localStorage.getItem("language") || "Hindi";
    try {
      getLanguages((configObj) => {
        localStorage.setItem("configObj", JSON.stringify(configObj));
        const sid = configObj[language].sid;
        PlatformDao.getUser(sid, (user) => {
          this.setState({
            user: user,
            languageList: Object.keys(configObj),
            configObj: configObj,
            language: language,
            schedule: new ScheduleObject(
              this.state.language,
              moment().utc().startOf("day")
            ),
          });
          this.reloadSchedule();
        });  
      });
    } catch (error) {
      console.log(error);
    }
  }

  componentDidUpdate(prevProps) {}

  handleRefresh = (event) => {
    this.setState({ side: this.state.side ? false : true });
  };

  handleChangeMode = (event) => {
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
      this.state.configObj[this.state.language].sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    const indexOfLive = scheduleObject.addLive(item);
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

  handleScheduleRowSelect = (index) => {
    const ttf = this.calculateTimeToFill(this.state.schedule.items, index);
    this.setState({ scheduleInsertionPoint: index, timeToFill: ttf });
  };

  handleScheduleDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.configObj[this.state.language].sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    const newIndex = scheduleObject.deleteItemClosingGap(index);
    this.updateSchedule(scheduleObject, newIndex, true);
  }

  handleOccurenceDelete(index, value) {
    let scheduleObject = new ScheduleObject(
      this.state.configObj[this.state.language].sid,
      this.state.schedule.date,
      this.state.schedule.items
    );
    let pid = scheduleObject.items[index].asset.pid;
    console.log("pid is from editor", pid);
    const newIndex = scheduleObject.deleteAllOccurencesClosingGap(
      pid,
      index,
      value
    );
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

  handleDateChange = (date) => {
    try {
      const sid = this.state.configObj[this.state.language].sid;
      fetchSchedule(sid, moment(date), (schedule) =>
        this.handleNewSchedule(schedule)
      );
    } catch (error) {
      console.log(error);
    }
  };

  pasteIntoSchedule(items) {
    let index = this.state.scheduleInsertionPoint;
    let scheduleObject = new ScheduleObject(
      this.state.configObj[this.state.language].sid,
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
    // sip should be the gap
    for (let x of scheduleObject.items) {
      if (x.insertionType === "gap") {
        sip = scheduleObject.items.indexOf(x);
      }
    }

    this.setState({
      schedule: scheduleObject,
      scheduleInsertionPoint: sip,
      scheduleModified: modified,
      timeToFill: ttf,
    });
  }

  reloadSchedule() {
    this.handleDateChange(this.state.schedule.date);
  }

  clearSchedule() {
    this.updateSchedule(
      new ScheduleObject(
        this.state.configObj[this.state.language].sid,
        this.state.schedule.date
      ),
      1,
      false
    );
  }

  testLoop() {
    this.pasteIntoLoop({
      duration: "PT55M",
      title: "A test item",
    });
  }

  pasteIntoLoop(item) {
    item.action = "";
    let loop = [...this.state.loop];
    loop.push({ ...item, insertionType: "" });
    this.setState({
      loop: loop,
      loopDuration: this.state.loopDuration.add(moment.duration(item.duration)),
    });
  }

  clearLoop() {
    this.setState({ loop: [], loopDuration: moment.duration() });
  }

  uploadLoop(e) {
    try {
      var file = e.target.files[0];
      let reader = new FileReader();
      reader.onload = (e) => {
        try {
          let items = JSON.parse(e.target.result);
          items.forEach((item) => {
            this.pasteIntoLoop(item);
          });
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
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download =
      [this.state.configObj[this.state.language].sid].name +
      " " +
      this.state.user.name +
      " Loop.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  deleteItemFromLoop = (index) => {
    const r = this.state.loop[index];
    let loop = [...this.state.loop];
    loop.splice(index, 1);
    this.setState({
      loop: loop,
      loopDuration: this.state.loopDuration.subtract(
        moment.duration(r.duration)
      ),
    });
  };

  savePlaylist = () => {
    //console.log('savePlaylist');

    // const This = this; // closure for callback
    saveSchedule(
      [this.state.configObj[this.state.language].sid].serviceIDRef,
      this.state.schedule.items,
      this.state.schedule.date,
      this.state.configObj[this.state.language].sid,
      () => {
        this.setState({ scheduleModified: false });
      },
      function (e) {
        console.log(e);
      }
    );
  };

  handleChangeLanguage = (event) => {
    const language = event.target.innerText;
    const sid = this.state.configObj[language].sid;
    this.setState({ language }, () => {
      PlatformDao.getUser(sid, (user) => {
        this.setState({ user: user });
        localStorage.setItem("language", language);

        // const sid = this.state.configObj[this.state.language].sid;
        this.reloadSchedule();
        this.handleRefresh();
      });
    });
  };

  handleFrom = (direction) => {
    let { from, to } = this.state;
    try {
      if (direction === 'back') {
        if (moment(to).diff(moment(from), "hours") < 24) {
          this.setState({ from: moment(from).subtract(6, "hours") });
          if (
            moment(from).isAfter(moment(from).subtract(6, "hours"), "day")
          ) {
            this.handleDateChange(moment(from).subtract(6, "hours"));
          }
        }
      }
      if (direction === 'forward') {
        if (!moment(from).isSameOrAfter(moment(to))) {
          this.setState({ from: moment(from).add(6, "hours") });
          if (moment(from).add(6, "hours").hour() === 0) {
            this.handleDateChange(moment(from).add(6, "hours"));
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  handleTo = (direction) => {
    let { to, from } = this.state;
    try {
      if (direction === 'back') {
        if (!moment(to).isSameOrBefore(moment(from))) {
          this.setState({ to: moment(to).subtract(6, "hours") });
        }
      }
      if (direction === 'forward') {
        if (moment(to).isBefore(moment(from).add(24, "hour"), "hour")) {
          this.setState({ to: moment(to).add(6, "hours") });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  handleDayTo = (direction) => {
    let { to, from } = this.state;
    try {
      if (direction === 'back') {
        if (moment(to).isAfter(moment(from), "day")) {
          this.setState({ to: moment(to).subtract(1, "day") });
        }
      }
      if (direction === 'forward') {
        if (moment(to).isBefore(moment(from).add(24, "hour"), "hour")) {
          this.setState({ to: moment(to).add(1, "day") });
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  handleDayFrom = (direction) => {
    let { to, from } = this.state;
    try {
      if (direction === 'back') {
        if (
          moment(to).diff(moment(from).subtract(24, "hour"), "hours") <= 24
        ) {
          this.setState({ from: moment(from).subtract(1, "day") });
          this.handleDateChange(moment(from).subtract(1, "day"));
        }
      }
      if (direction === 'forward') {
        if (moment(from).isBefore(moment(to), "day")) {
          this.setState({ from: moment(from).add(1, "day") });
          this.handleDateChange(moment(from).add(1, "day"));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // available episodes need to be available.
  // this is for simplicity
  // available episodes need to be still available by the end of the day being scheduled
  // we might relax this in future if we have short availability episodes we want to schedule
  // early in the selected day
  // or we could make it the middle of the day but then we should disable episodes depending
  // on where the cursor is.
  // but paste to fill assumes availability goes to the end of the current day!
  // upcoming episodes need a start of availability in the near future, ideally by the cursor
  // upcoming episodes need to be still available to the end of the day being scheduled

  render() {
    let { from, to } = this.state;
    const mustBeAvailableBy = moment.utc().format();
    const mustBeAvailableUntil = moment
      .utc(this.state.schedule.date)
      .add(1, "d")
      .format();
    const upcomingMustBeAvailableBy = mustBeAvailableUntil;
    const upcomingMustBeAvailableUntil = moment
      .utc(upcomingMustBeAvailableBy)
      .add(1, "d")
      .format();

    const { classes } = this.props;
    const { open, languageList, language } = this.state;

    let welcome = 'This is Dazzler!';

    if (window.location.hostname.includes('test')) {
      welcome = 'This is Dazzler Test!';
    }

    //console.log('Editor.render');
    return (
      <div className={classes.root}>
        <AppBar
          position="fixed"
          className={classNames(classes.appBar, {
            [classes.appBarShift]: open,
          })}
        >
          <Toolbar disableGutters={!open}>
            <HamburgerMenu classes={classes} open={open} />
            <Select
              id="demo-simple-select-outlined"
              labelId="demo-simple-select-outlined-label"
              style={{ fontSize: 17, color: "white" }}
              value={language}
              onChange={this.handleChangeLanguage}
            >
              {languageList.map((item) => {
                return (
                  <MenuItem value={item} style={{ fontSize: 17 }}>
                    {" "}
                    {item}
                  </MenuItem>
                );
              })}
            </Select>
            <Typography variant="h6" color="inherit" noWrap>
              {/* {[this.state.configObj[this.state.language].sid].name} */}
            </Typography>
            <Typography
              align="center"
              className={classes.appBarTitle}
              variant="h5"
              color="inherit"
              noWrap
            >
              {welcome}
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
            <PushControl />
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
            [classes.contentShift]: open,
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
            <Box width="31%" display="flex" flexDirection="column">
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
                  <Refresh
                    buttonClass={classes.button}
                    onRefresh={this.handleRefresh}
                  />
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

                <Live
                  flip={this.state.side}
                  date={this.state.schedule.date.utc().format("YYYY-MM-DD")}
                  sid={this.state.configObj[language].sid}
                  handleClick={this.handleAddLive}
                />
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

                <Episode
                  flip={this.state.side}
                  availability={"available"}
                  mustBeAvailableBy={mustBeAvailableBy}
                  mustBeAvailableUntil={mustBeAvailableUntil}
                  sid={this.state.configObj[language].sid}
                  handleClick={this.handleAddClipOrEpisode}
                />
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

                <Episode
                  flip={this.state.side}
                  availability={"P1D"}
                  mustBeAvailableBy={upcomingMustBeAvailableBy}
                  mustBeAvailableUntil={upcomingMustBeAvailableUntil}
                  sid={this.state.configObj[language].sid}
                  handleClick={this.handleAddClipOrEpisode}
                  // resultsFilter={this.filterUpcomingEpisodes}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel4bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>Web Clips</Typography>
                </ExpansionPanelSummary>

                <Clips
                  flip={this.state.side}
                  type="web"
                  sid={this.state.configObj[language].sid}
                  handleClick={this.handleAddClipOrEpisode}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel5bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>Specials</Typography>
                </ExpansionPanelSummary>

                <Specials
                  sid={this.state.configObj[language].sid}
                  handleClick={this.handleAddClipOrEpisode}
                />
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
                sid={this.state.configObj[language].sid}
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
                handleFrom={this.handleFrom}
                handleTo={this.handleTo}
                handleDayTo={this.handleDayTo}
                handleDayFrom={this.handleDayFrom}
                from={from}
                to={to}
              />
              <ScheduleView
                onRowSelected={this.handleScheduleRowSelect}
                onDelete={this.handleScheduleDelete}
                onOccurenceDelete={this.handleOccurenceDelete}
                data={this.state.schedule.items}
                row={this.state.scheduleInsertionPoint}
                lastUpdated=""
                from={from}
                to={to}
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
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(Editor);
