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
// import Lock from "@material-ui/icons/Star";
// import Assignment from "@material-ui/icons/Assignment";
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
import Jupiter from "../Jupiter/Jupiter";
import Scratchpad from "../Scratchpad/Scratchpad";
import Date from "../Date/Date";
import Schedule from "../Schedule/Schedule";
// import PreviousSchedule from "../PreviousSchedule/PreviousSchedule";
// import NextSchedule from "../NextSchedule/NextSchedule";
// import xml2js from "xml2js";
import Loop from "../Loop/Loop";

const drawerWidth = 240;
var menuText = "Schedule";
var text = "Today's ";
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
    this.handleClick = this.handleClick.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.copyContent = this.copyContent.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.loopContent = this.loopContent.bind(this);
    this.lastItem = this.lastItem.bind(this);
    this.handleDrawerOpen = this.handleDrawerOpen.bind(this);
    this.handleDrawerClose = this.handleDrawerClose.bind(this);
    this.handleDateChange = this.handleDateChange.bind(this);

    this.state = {
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
      scheduleDate: moment().utc().format(),
      display: "",
      user: { name: "anonymous" },
      service: {
        sid: "bbc_marathi_tv",
        name: "Marathi",
        serviceIDRef: "TVMAR01"
      }
    };
  }

  componentDidMount() {
    console.log("DidMount", time);
    console.log(scheduleItems);
    console.log(copiedContent);
    this.setState({
      display: (
        <Schedule
          onDateChange={this.handleDateChange}
          service={this.state.service}
          lastItem={this.lastItem}
          clipTime={time}
          length={scheduleItems.length}
          pasted={copiedContent}
          loopedContent={""}
          deleteItem={this.deleteItem}
          text="Today's "
          loadPlaylist={this.loadPlaylist}
          nextSchedule={this.nextDay}
          scheduleDate={this.state.scheduleDate}
        />
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
    this.render();
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

  handleDateChange = (d) => {
    console.log('handleDateChange', d.toString() );
    this.setState({ scheduleDate: d });
  };

  loopContent = (rows, startTime, finishTime) => {
    loopedContent = [];
    if (rows.length > 0) {
      rows.map((row, index) => loopedContent.push(rows[index]));
    }

    menuText = "Schedule";
    this.setState({
      display: (
        <Schedule
          onDateChange={this.handleDateChange}
          service={this.state.service}
          lastItem={this.lastItem}
          clipTime={time}
          length={scheduleItems.length}
          loopedContent={loopedContent}
          addedLoop={true}
          startLoop={startTime}
          finishTime={finishTime}
          deleteItem={this.deleteItem}
          added={false}
          text={text}
          loadPlaylist={this.loadPlaylist}
          nextSchedule={this.nextDay}
          scheduleDate={this.state.scheduleDate}
        />
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

  deleteItem(id) {
    this.setState({
      display: (
        <Schedule
          onDateChange={this.handleDateChange}
          service={this.state.service}
          lastItem={this.lastItem}
          loopedContent={""}
          clipTime={time}
          deleteId={id}
          length={scheduleItems.length}
          pasted={copiedContent}
          deleteItem={this.deleteItem}
          added={false}
          text={text}
          loadPlaylist={this.loadPlaylist}
          nextSchedule={this.nextDay}
          scheduleDate={this.state.scheduleDate}
        />
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
            deleteItem={this.deleteItem}
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
          <Schedule
            onDateChange={this.handleDateChange}
            service={this.state.service}
            lastItem={this.lastItem}
            clipTime={time}
            item={newItem2}
            length={scheduleItems.length}
            pasted={copiedContent}
            loopedContent={""}
            text="Today's "
            added={true}
            deleteItem={this.deleteItem}
            nextSchedule={this.nextDay}
            scheduleDate={this.state.scheduleDate}
          />
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
              type={this.state.itemType}
              sid={this.state.service.sid}
              handleClick={this.handleClick}
            />
          )
        });
        break;
        case "Jupiter Clips":
        this.setState({ 
          isPaneOpen: true,
          title: "Jupiter Clips",
          panelShow: (
            <Jupiter
              sid={this.state.service.sid}
              handleClick={this.handleClick}
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
	            handleClick={this.handleClick}
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
              handleClick={this.handleClick}
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
              handleClick={this.handleClick}
            />
          )
        });
        break;
      case "Schedule":
        menuText = text;
        this.setState({
          display: (
            <Schedule
              onDateChange={this.handleDateChange}
              service={this.state.service}
              lastItem={this.lastItem}
              clipTime={time}
              nextSchedule={this.nextDay}
              loopedContent={""}
              length={scheduleItems.length}
              pasted={copiedContent}
              text="Today's "
              deleteItem={this.deleteItem}
              scheduleDate={this.state.scheduleDate}
            />
          )
        });
        break;
      case "Scratchpad":
        menuText = text;
        this.setState({
          display: (
            <Scratchpad
              data={scratchPadItems}
              deleteItem={this.deleteItem}
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
