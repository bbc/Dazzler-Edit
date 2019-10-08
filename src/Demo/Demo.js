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
import InboxIcon from "@material-ui/icons/LiveTv";
import MailIcon from "@material-ui/icons/Schedule";
import Payment from "@material-ui/icons/VideoLibrary";
import Lock from "@material-ui/icons/Star";
import Assignment from "@material-ui/icons/Assignment";
import Movie from "@material-ui/icons/Movie";
import Opacity from "@material-ui/icons/Opacity";
import Picture from "@material-ui/icons/PictureInPicture";
import SlidingPane from "react-sliding-pane";
import "react-sliding-pane/dist/react-sliding-pane.css";
import axios from "axios";
import Specials from "../Specials/Specials";
import moment from "moment";
import Episode from "../Episode/Episode";
import Live from "../Live/Live";
import Clips from "../Clips/Clips";
import Scratchpad from "../Scratchpad/Scratchpad";
import Date from "../Date/Date";
import Schedule from "../Schedule/Schedule";
import PreviousSchedule from "../PreviousSchedule/PreviousSchedule";
import NextSchedule from "../NextSchedule/NextSchedule";

const drawerWidth = 240;
var menuText = "Schedule";
var text = "Today's ";
var time = -2;
var scheduleItems = [];
var scratchPadItems = [];
var copiedContent = [];
var icons = [
  <MailIcon />,
  <Movie />,
  <Payment />,
  <Picture />,
  <Lock />,
  <Opacity />
];
var viewIcons = [<InboxIcon />, <Assignment />];
var count = -1;

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

class Demo extends React.Component {

  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.fetchTime = this.fetchTime.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.previousDay = this.previousDay.bind(this);
    this.nextDay = this.nextDay.bind(this);
    this.copyContent = this.copyContent.bind(this);
    this.clearContent = this.clearContent.bind(this);
    this.state = {
      open: false,
      Title: "",
      isPaneOpen: false,
      panelShow: null,
      count: 0,
      clips: [],
      specials: [],
      episodes: [],
      live: [],
      schedules: {}, // state store for loaded and/or edited schedules
      scheduleDate: moment()
        .add(0, "d")
        .format("LL"),
      display: "",
      user: null,
      service: { sid: "bbc_marathi_tv", name: "Marathi", serviceIDRef: "TVMAR01" }
    };
  }

  componentDidMount() {
console.log('DidMount',time);
console.log(scheduleItems);
console.log(copiedContent);
    this.setState({
      display: (
        <Schedule
          serviceIDRef={this.state.service.serviceIDRef}
          fetchTime={this.fetchTime}
          clipTime={time}
          data={scheduleItems}
          length={scheduleItems.length}
          pasted={copiedContent}
          deleteItem={this.deleteItem}
          text="Today's "
          loadPlaylist={this.loadPlaylist}
        />
      )
    });

    // Episodes
    axios
      .get(
        "http://localhost:8080/api/v1/episode?sid=" + this.state.service.sid
      )
      .then(response => {
        this.setState({
          episodes: response.data.items
        });
      })
      .catch(e => {
        console.log(e);
      });

    // get user
    axios
      .get(
        "http://localhost:8080/api/v1/user"
      )
      .then(response => {
        console.log('user', JSON.stringify(response.data));
        console.log("RESPONSE", response)
        this.setState({
          user: response.data
        });
      })
      .catch(e => {
        console.log(e);
      });

    //get request for specials
    axios
      .get(
        "http://localhost:8080/api/v1/special?sid=" + this.state.service.sid
      )
      .then(response => {
        this.setState({
          specials: response.data.items
        });
      })
      .catch(e => {
        console.log(e);
      });

    //get request for webcasts
    const day = moment().millisecond(0).second(0).add(5, 'minutes').utc(); // TODO DAZZLER-68
    const days = 5; // to allow us to edit future schedules
    axios
      .get(
        "http://localhost:8080/api/v1/webcast?sid=bbc_marathi_tv&start=2019-10-09T13:41:00Z&end=2019-10-13T13:41:00Z"
          // "?sid=" + this.state.service.sid +
          // "&start=" + day.format() +
          // "&end=" + day.add(days, 'days').utc().format()
      )
      .then(response => {
        const items = response.data.items;
        for (let i = 0; i < items.length; i++) {
          this.setState({
            live: [...this.state.live, items[i]]
          });
        }
      })
      .catch(e => {
        console.log(e);
      });
  }

  handleDrawerOpen = () => {
    this.setState({ open: true });
  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  copyContent(rows) {
    copiedContent = [];
    if (rows.length > 0) {
      rows.map((row, index) => copiedContent.push(rows[index]));
    }
  }
  clearContent() {
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
  deleteItem(id) {
    this.setState({
      display: (
        <Schedule
          serviceIDRef={this.state.service.serviceIDRef}
          fetchTime={this.fetchTime}
          clipTime={time}
          deleteId={id}
          data={scheduleItems}
          length={scheduleItems.length}
          pasted={copiedContent}
          deleteItem={this.deleteItem}
          text={text}
          loadPlaylist={this.loadPlaylist}
        />
      )
    });
  }

  previousDay = CDate => {
    text = moment(CDate).isAfter(moment()) ? "Future " : "Previous ";
    console.log('previousDay',time);
    console.log(scheduleItems);
    console.log(copiedContent);
    
    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
      this.setState({
        scheduleDate: CDate,
        display: (
          <Schedule
            serviceIDRef={this.state.service.serviceIDRef}
            fetchTime={this.fetchTime}
            clipTime={time}
            data={scheduleItems}
            pasted={copiedContent}
            length={scheduleItems.length}
            deleteItem={this.deleteItem}
            text={text}
            loadPlaylist={this.loadPlaylist}
          />
        )
      });
    } else {
      this.setState({
        scheduleDate: CDate,
        display: (
          <PreviousSchedule
            sid={this.state.service.sid}
            scheduleDate={moment(CDate)
              .utcOffset(0)
              .format()}
            text={text}
          />
        )
      });
    }
  };
  nextDay = CDate => {
    text = moment(CDate).isBefore(moment()) ? "Previous " : "Future ";
    console.log('nextDay',time);
    console.log(scheduleItems);
    console.log(copiedContent);

    if (moment(CDate).format("LL") === moment().format("LL")) {
      text = "Today's ";
      this.setState({
        scheduleDate: CDate,
        display: (
          <Schedule
            serviceIDRef={this.state.service.serviceIDRef}
            fetchTime={this.fetchTime}
            clipTime={time}
            data={scheduleItems}
            length={scheduleItems.length}
            pasted={copiedContent}
            deleteItem={this.deleteItem}
            text={text}
            loadPlaylist={this.loadPlaylist}
          />
        )
      });
    } else {
      this.setState({
        scheduleDate: CDate,
        display: (
          <NextSchedule
            sid={this.state.service.sid}
            scheduleDate={moment(CDate).utcOffset(0).format()}
            text={text}
          />
        )
      });
    }
  };
  handleClick = (item, isLive) => {
    count++;

    const newItem2 = {
      ...item
    };
    console.log("NEW ITEM ", newItem2)

    switch(item.item_type) {
      case "episode":
      {
        const version = 0; // TODO pick a version
        newItem2.duration = item.available_versions.version[version].duration;
        newItem2.versionPid = item.available_versions.version[version].pid;
        newItem2.versionCrid = item.available_versions.version[version].crid;
        newItem2.id = count;
        newItem2.isLive = false;
        if(newItem2.title == null) {
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
        newItem2.id = count;
      }
      break;      
      case "window":
        for(let i = 0; i < item.window_of.length; i++ ) {
          switch(item.window_of[i].result_type) {
            case "version":
              newItem2.versionPid = item.window_of[i].pid;
              newItem2.versionCrid = item.window_of[i].crid;
              break;
            case "episode":
              // do we want anything from the episode level?
            break;
            default: // DO Nothing
          }
        }
        newItem2.captureChannel = item.service.sid; // TODO make use of this
        newItem2.isLive = true;
        newItem2.id = count;
      break;
      default:
        console.log(item.item_type, isLive);
    }
      
    if (menuText === "Scratchpad") {
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
    } else {
      scheduleItems.push(newItem2);
      console.log("in schedule")
      this.setState({
        display: (
          <Schedule
            serviceIDRef={this.state.service.serviceIDRef}
            fetchTime={this.fetchTime}
            clipTime={time}
            data={scheduleItems}
            length={scheduleItems.length}
            pasted={copiedContent}
            text="Today's "
            deleteItem={this.deleteItem}
          />
        )
      });
    }
  };

  iHandleClick = text => {
    switch(text) {

      case "Clips": 
        this.setState({ isPaneOpen: true });
        this.setState({ title: "Available Clips" });
        this.setState({
          panelShow: (
            <Clips sid={this.state.service.sid} handleClick={this.handleClick} />
          )
        });
      break;
      case "Live":
          this.setState({ isPaneOpen: true });
          this.setState({ title: "Upcoming Live Broadcasts" });
          this.setState({
            panelShow: (
              <Live live={this.state.live} handleClick={this.handleClick} />
            )
          });
      case "a":
          return this.setState({ show: <Date /> });
      case "Episodes":
          this.setState({ isPaneOpen: true });
          this.setState({ title: "Recent Episodes" });
          this.setState({
            panelShow: (
              <Episode
                episodes={this.state.episodes}
                handleClick={this.handleClick}
              />
            )
          });
          break;
      case "Specials":
          this.setState({ isPaneOpen: true });
          this.setState({ title: "Specials" });
          this.setState({
            panelShow: (
              <Specials
                specials={this.state.specials}
                handleClick={this.handleClick}
              />
            )
          });
          break;
      case "Extra":
          return this.setState({ show: <Date /> });
      case "Schedule":
          menuText = text;
          return this.setState({
            display: (
              <Schedule
                serviceIDRef={this.state.service.serviceIDRef}
                fetchTime={this.fetchTime}
                clipTime={time}
                data={scheduleItems}
                length={scheduleItems.length}
                pasted={copiedContent}
                text="Today's "
                deleteItem={this.deleteItem}
              />
            )
          });;
      case "Scratchpad":        
        menuText = text;
        return this.setState({
          display: (
            <Scratchpad
              data={scratchPadItems}
              deleteItem={this.deleteItem}
              clearContent={this.clearContent}
              copyContent={this.copyContent}
            />
          )
        });
      }
    }
    
  fetchTime(clipTime) {
    var time = clipTime;
    this.setState({
      display: (
        <Schedule
          serviceIDRef={this.state.service.serviceIDRef}
          fetchTime={this.fetchTime}
          clipTime={time}
          length = {scheduleItems.length}
          data={scheduleItems}
          pasted={copiedContent}
          text="Today's "
          deleteItem={this.deleteItem}
        />
      )
    });
  }

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
            {["Schedule", "Scratchpad"].map((text, index) => (
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
            {["Live", "Clips", "Episodes", "Specials", "Extra"].map(
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
            <Date
              nextDay={this.nextDay}
              previousDay={this.previousDay}
              scheduleDate={this.state.scheduleDate}
            />
            {this.state.display}
          </Typography>
        </main>
      </div>
    );
  }
}

Demo.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired
};

export default withStyles(styles, { withTheme: true })(Demo);
