import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { withStyles } from "@material-ui/core/styles";
import Drawer from "@material-ui/core/Drawer";
import CssBaseline from "@material-ui/core/CssBaseline";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import List from "@material-ui/core/List";
import Typography from "@material-ui/core/Typography";
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
import SlidingPane from "react-sliding-pane";
import "react-sliding-pane/dist/react-sliding-pane.css";
import axios from "axios";
import Specials from "../Specials/Specials";
import moment from "moment";
import 'moment-duration-format';
import Episode from "../Episode/Episode";
import Live from "../Live/Live";
import Clips from "../Clips/Clips";
import Scratchpad from "../Scratchpad/Scratchpad";
import Date from "../Date/Date";
import SchedulePicker from "../SchedulePicker/SchedulePicker";
import ScheduleToolbar from "../ScheduleToolbar/ScheduleToolbar";
import ScheduleView from "../ScheduleView/ScheduleView";
import Loop from "../Loop/Loop";
import ScheduleObject from "../ScheduleObject";

const drawerWidth = 240;
var menuText = "Schedule";
var time = -2;
var scheduleItems = [];
var scratchPadItems = [];
var copiedContent = [];
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
    this.handleClick = this.handleClick.bind(this);
    this.copyContent = this.copyContent.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.lastItem = this.lastItem.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleScheduleDelete = this.handleScheduleDelete.bind(this);

    this.state = {
      schedule:[],
      scheduleDate: moment().utc().format('YYYY-MM-DD'),
      scheduleInsertionPoint: -1,
      scheduleModified: false,
      open: false,
      Title: "",
      isPaneOpen: false,
      panelShow: null,
      itemType: '',
      count: 0,
      clips: [],
      jupiter: [],
      specials: [],
      episodes: [],
      live: [],
      loop: [],
      loopDuration: moment.duration(),
      schedules: {}, // state store for loaded and/or edited schedules
      display: "",
      user: { name: "anonymous", auth: true },
      service: {
        sid: "bbc_marathi_tv",
        name: "Marathi",
        serviceIDRef: "TVMAR01"
      }
    };
  }

  componentDidMount() {
    console.log("Editor DidMount", time);
    this.setState({
      display: (
      <div>
        <SchedulePicker
          enabled={!this.state.scheduleModified}
          sid={this.state.service.sid}
          scheduleDate={this.state.scheduleDate}
          onDateChange={this.handleDateChange}
        />
        <ScheduleView 
          onRowSelected={this.handleScheduleRowSelect}
          onDelete={this.handleScheduleDelete} 
          data={this.state.schedule} lastUpdated=""
        />
        <ScheduleToolbar
          saveEnabled={this.state.scheduleModified && this.state.user.auth}
          onSaveClicked={this.savePlaylist}
        />
      </div>
      )
    });

    // get user
    axios
      .get(`${URLPrefix}/api/v1/user`)
      .then(response => {
        console.log("user", JSON.stringify(response.data));
        console.log("RESPONSE", response);
        this.setState({
          user: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });
  }

  componentDidUpdate(prevProps) {
    console.log('editor componentDidUpdate');
  }

  lastItem = scheduleTime => {
    this.setState({ scheduleTime: scheduleTime });
  };

  handleDrawerOpen = () => {
    this.setState({ open: true });
  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  handleScheduleDelete(index) {
    let scheduleObject = new ScheduleObject(
      this.state.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.deleteItemClosingGap(index);
    this.setState({
      schedule: scheduleObject.items,
      display: (
        <div>
          <SchedulePicker
          enabled={!this.state.scheduleModified}
            sid={this.state.service.sid}
            scheduleDate={this.state.scheduleDate}
            onDateChange={this.handleDateChange}
          />
          <ScheduleView 
          onRowSelected={this.handleScheduleRowSelect}
            onDelete={this.handleScheduleDelete} 
            data={scheduleObject.items} lastUpdated=""
          />
          <ScheduleToolbar
          saveEnabled={this.state.scheduleModified && this.state.user.auth}
            onSaveClicked={this.savePlaylist}
          />
        </div>
        )
    });
  }
  
  handleDateChange = (date, schedule) => {
    this.setState({
      scheduleDate: date,
      schedule: schedule,
      display: (
        <div>
          <SchedulePicker
          enabled={!this.state.scheduleModified}
            sid={this.state.service.sid}
            scheduleDate={date}
            onDateChange={this.handleDateChange}
          />
          <ScheduleView 
          onRowSelected={this.handleScheduleRowSelect}
            onDelete={this.handleScheduleDelete} 
            data={schedule} lastUpdated=""
          />
          <ScheduleToolbar
          saveEnabled={this.state.scheduleModified && this.state.user.auth}
            onSaveClicked={this.savePlaylist}
          />
        </div>
        )
    });
  };

  copyContent(rows) {
    copiedContent = [];
    if (rows.length > 0) {
      rows.map((row, index) => copiedContent.push(rows[index]));
    }
  }
  clearContent(loop) {
    if (loop) {
      this.setState({
        loop: [],
        loopDuration: moment.duration(),
        display: (
          <Loop
            data={this.state.loop}
            duration={this.state.loopDuration.valueOf()}
            deleteItem={this.deleteItemFromLoop}
            loopContent={this.loopContent}
            clearContent={this.clearContent}
            scheduleTime={this.state.scheduleTime}
          />
        )
      });
    } else {
      scratchPadItems = [];
      this.setState({
        display: (
          <Scratchpad
            data={scratchPadItems}
            deleteItem={this.deleteItem}
            copyContent={this.copyContent}
            clearContent={this.clearContent}
          />
        )
      });
    }
  }

  deleteItemFromLoop = (index) => {
    const r = this.state.loop[index];
    let loop = [...this.state.loop];
    loop.splice(index, 1);
    this.setState({
      loop:loop,
      loopDuration: this.state.loopDuration.subtract(moment.duration(r.duration)),
      display: (
          <Loop
            data={this.state.loop}
            duration={this.state.loopDuration.valueOf()}
            deleteItem={this.deleteItemFromLoop}
            loopContent={this.loopContent}
            clearContent={this.clearContent}
            scheduleTime={this.state.scheduleTime}
          />
        )
    });
  }

  handleDelete(id) {
    this.setState({
      display: (
      <div>
        <SchedulePicker
        enabled={!this.state.scheduleModified}
          sid={this.state.service.sid}
          scheduleDate={this.state.scheduleDate}
          onDateChange={this.handleDateChange}
        />
        <ScheduleView 
        onRowSelected={this.handleScheduleRowSelect}
          onDelete={this.handleScheduleDelete} 
          data={this.state.schedule} lastUpdated=""
        />
        <ScheduleToolbar
        saveEnabled={this.state.scheduleModified && this.state.user.auth}
          onSaveClicked={this.savePlaylist}
        />
      </div>
      )
    });
  }

  handleAddLive(item) {
    console.log("LIVE ITEM", item);
    const startTime = moment(item.scheduled_time.start);
    const newItem = {
      captureChannel: item.service.sid, // TODO make use of this
      title: 'Live broadcast segment',
      duration: item.duration.toISOString(),
      startTime:startTime,
      live: true,
      insertionType: ''
    }
    for (let i = 0; i < item.window_of.length; i++) {
      switch (item.window_of[i].result_type) {
        case "version":
          newItem.versionPid = item.window_of[i].pid;
          newItem.versionCrid = item.window_of[i].crid;
          break;
        default: // DO Nothing
      }
    }
    console.log(newItem);
    let scheduleObject = new ScheduleObject(
      this.state.serviceIDRef.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.addLive(newItem);
    console.log(scheduleObject.items);
    this.setState({
      schedule: scheduleObject.items,
      display: (
      <div>
        <SchedulePicker
        enabled={!this.state.scheduleModified}
          sid={this.state.service.sid}
          scheduleDate={this.state.scheduleDate}
          onDateChange={this.handleDateChange}
        />
        <ScheduleView 
        onRowSelected={this.handleScheduleRowSelect}
          onDelete={this.handleScheduleDelete} 
          data={this.state.schedule} lastUpdated=""
        />
        <ScheduleToolbar
        saveEnabled={this.state.scheduleModified && this.state.user.auth}
          onSaveClicked={this.savePlaylist}
        />
      </div>
      )
    });
  }

  handleAddEpisode(item) {
    console.log("ITEM", item);
    const version = item.available_versions.version[0]; // TODO pick a version
    const newItem = {
      title: item.title?item.title:item.presentation_title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: ''
    };
    this.pasteIntoSchedule(newItem);
  }

  handleScheduleRowSelect = (index) => {
    console.log('handleScheduleDelete', index);
    this.setState({scheduleInsertionPoint: index});
  }

  handleAddClip(item) {
    console.log("ITEM", item);
    const version = item.available_versions.version[0]; // TODO pick a version
    const newItem = {
      title: item.title,
      duration: moment.duration(version.duration).toISOString(),
      live: false,
      insertionType: ''
    };
    this.pasteIntoSchedule(newItem);
  }

  pasteIntoSchedule(items, copies) {
    if(!Array.isArray(items))
      items = [items];
    if(copies === undefined) copies = 1;
    console.log('pasteIntoSchedule', items, copies);
    let n = [...items];
    while(copies>1) {
      n = n.concat(items);
      copies--;
    }
    console.log("insert %d items at index %d", n.length, this.state.scheduleInsertionPoint);
    let index = this.state.scheduleInsertionPoint;
    let scheduleObject = new ScheduleObject(
      this.state.service.sid,
      this.state.scheduleDate,
      this.state.schedule
    );
    scheduleObject.addFloating(index, n);    
    this.setState({
      schedule: scheduleObject.items,
      display: (
        <div>
          <SchedulePicker
          enabled={!this.state.scheduleModified}
            sid={this.state.service.sid}
            scheduleDate={this.state.scheduleDate}
            onDateChange={this.handleDateChange}
          />
          <ScheduleView 
          onRowSelected={this.handleScheduleRowSelect}
            onDelete={this.handleScheduleDelete} 
            data={scheduleObject.items} lastUpdated=""
          />
          <ScheduleToolbar
          saveEnabled={this.state.scheduleModified && this.state.user.auth}
            onSaveClicked={this.savePlaylist}
          />
        </div>
        )
    });
  }

  handleClick = (item, isLive) => {
    console.log("ITEM", item);
    //count++;
    const newItem2 = { ...item };

    switch (item.item_type) {
      case "episode":
        {
          const version = 0; // TODO pick a version
          newItem2.duration = item.available_versions.version[version].duration;
          newItem2.versionPid = item.available_versions.version[version].pid;
          newItem2.versionCrid = item.available_versions.version[version].crid;
          // newItem2.id = count;
          newItem2.isLive = false;
          if (newItem2.title == null) {
            newItem2.title = newItem2.presentation_title;
          }
        }
        break;
      case "clip":
        {
          const version = 0; // TODO pick a version
          newItem2.duration = item.available_versions.version[version].duration;
          newItem2.versionPid = item.available_versions.version[version].pid;
          newItem2.versionCrid = item.available_versions.version[version].crid;
          newItem2.isLive = false;
          // newItem2.id = count;
        }
        break;
      case "window":
        for (let i = 0; i < item.window_of.length; i++) {
          switch (item.window_of[i].result_type) {
            case "version":
              newItem2.versionPid = item.window_of[i].pid;
              //newItem2.versionCrid = newItem2.versionCrid;
              console.log('window version', newItem2, item);
              break;
            case "episode":
              // do we want anything from the episode level?
              break;
            default: // DO Nothing
          }
        }
        newItem2.captureChannel = item.service.sid; // TODO make use of this
        newItem2.isLive = true;

        // newItem2.startTime = moment(item.scheduled_time.start);
        // newItem2.scheduled_time = item.scheduled_time.start;
        // newItem2.id = count;
        break;
      default:
        console.log(item.item_type, isLive);
    }

    console.log(newItem2);

    switch (menuText) {
      case "Scratchpad":
      scratchPadItems.push(newItem2);
      this.setState({
        display: (
          <Scratchpad
            data={scratchPadItems}
            deleteItem={this.deleteItemFromScratchpad}
            copyContent={this.copyContent}
            clearContent={this.clearContent}
          />
        )
      });
      break
    case "Schedule":
      scheduleItems.push(newItem2);
      this.setState({
        display: (
      <div>
        <SchedulePicker
        enabled={!this.state.scheduleModified}
          sid={this.state.service.sid}
          scheduleDate={this.state.scheduleDate}
          onDateChange={this.handleDateChange}
        />
        <ScheduleView 
          onDelete={this.handleScheduleDelete} 
          onRowSelected={this.handleScheduleRowSelect}
          data={this.state.schedule} lastUpdated=""
        />
        <ScheduleToolbar
        saveEnabled={this.state.scheduleModified && this.state.user.auth}
          onSaveClicked={this.savePlaylist}
        />
      </div>
      )
      });
      break;
    case "Loop":
      newItem2.durationAsString = moment.duration(newItem2.duration).format("HH:mm:ss");
      newItem2.index = this.state.loop.length;
      console.log('add item to loop', newItem2);
      const n = this.state.loop.concat(newItem2);
      this.setState({
        loop: n,
        loopDuration: this.state.loopDuration.add(newItem2.duration),
        display: (
          <Loop
            data={n}
            duration={this.state.loopDuration.valueOf()}
            deleteItem={this.deleteItemFromLoop}
            loopContent={this.loopContent}
            clearContent={this.clearContent}
            scheduleTime={this.state.scheduleTime}
          />
        )
      });
      break;
    default:
    }
  };

  iHandleClick = text => {
    switch (text) {
      case "Web Clips":
        this.setState({ 
          isPaneOpen: true,
          title: "Web Clips",
          itemType: "web",
          panelShow: (
            <Clips
              type="web"
              sid={this.state.service.sid}
              handleClick={this.handleAddClip}
            />
          )
        });
        break;
        case "Jupiter Clips":
        this.setState({ 
          isPaneOpen: true,
          title: "Jupiter Clips",
          panelShow: (
            <Clips
            type="jupiter"
              sid={this.state.service.sid}
              handleClick={this.handleAddClip}
            />
          )
        });
        break;
      case "Live":
        console.log('show live', this.state.scheduleDate);
        this.setState({ 
          isPaneOpen: true,
          title: "Upcoming Live Broadcasts",
          panelShow: (
            <Live
              date={this.state.scheduleDate}
	            sid={this.state.service.sid}
	            handleClick={this.handleAddLive}
	          />
          )
        });
        break;
      case "a":
        this.setState({ show: <Date /> });
        break;
      case "Episodes":
        this.setState({
          isPaneOpen: true,
          title: "Episodes",
          panelShow: (
            <Episode
              date={this.state.scheduleDate}
              sid={this.state.service.sid}
              handleClick={this.handleAddEpisode}
            />
          )
        });
        break;
      case "Specials":
        this.setState({
          isPaneOpen: true,
          title: "Specials",
          panelShow: (
            <Specials
              sid={this.state.service.sid}
              handleClick={this.handleAddClip}
            />
          )
        });
        break;
      case "Schedule":
        menuText = text;
        this.setState({
          display: (
      <div>
        <SchedulePicker
        enabled={!this.state.scheduleModified}
          sid={this.state.service.sid}
          scheduleDate={this.state.scheduleDate}
          onDateChange={this.handleDateChange}
        />
        <ScheduleView 
          onRowSelected={this.handleScheduleRowSelect}
          onDelete={this.handleScheduleDelete} 
          data={this.state.schedule} lastUpdated=""
        />
        <ScheduleToolbar
        saveEnabled={this.state.scheduleModified && this.state.user.auth}
          onSaveClicked={this.savePlaylist}
        />
      </div>
          )
        });
        break;
      case "Scratchpad":
        menuText = text;
        this.setState({
          display: (
            <Scratchpad
              data={scratchPadItems}
              deleteItem={this.deleteItemFromScratchpad}
              clearContent={this.clearContent}
              copyContent={this.copyContent}
            />
          )
        });
        break;
      case "Loop":
        menuText = text;
        this.setState({
          display: (
            <Loop
              data={this.state.loop}
              duration={this.state.loopDuration.valueOf()}
              deleteItem={this.deleteItemFromLoop}
              clearContent={this.clearContent}
              loopContent={this.loopContent}
              scheduleTime={this.state.scheduleTime}
            />
          )
        });
        break;
      default: // DO NOTHING
    }
  };

  render() {
    const { classes, theme } = this.props;
    const { open } = this.state;

    return (
      <div className={classes.root}>
        <SlidingPane
          closeIcon={<div>Some div containing custom close icon.</div>}
          className="some-custom-class"
          overlayClassName="some-custom-overlay-class"
          isOpen={this.state.isPaneOpen}
          width="36%"
          onRequestClose={() => {
            // triggered on "<" on left top click or on outside click
            this.setState({ isPaneOpen: false });
          }}
        >
          <h1>{this.state.title}</h1>
          {this.state.panelShow}
          <div></div>
          <br />
        </SlidingPane>

        <CssBaseline />
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
          <Typography paragraph>
            {/* <Date
              nextDay={this.nextDay}
              previousDay={this.previousDay}
              scheduleDate={this.state.scheduleDate}
            /> */}
            {this.state.display}
          </Typography>
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
