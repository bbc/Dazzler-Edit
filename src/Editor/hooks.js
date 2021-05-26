import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import classNames from "classnames";
import { Box } from "@material-ui/core";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import Typography from "@material-ui/core/Typography";
import { withStyles } from "@material-ui/core/styles";
import AppBar from "@material-ui/core/AppBar";
import Toolbar from "@material-ui/core/Toolbar";
import moment from "moment";
import "moment-duration-format";
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
import PushControl from "../PushControl";
import HamburgerMenu from "../HamburgerMenu";
// import { getConfigFileParsingDiagnostics } from "typescript";
import PickLists from "../PickLists";

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

function Editor ({classes}) {
  const [configObj, setConfigObj] = useState({Hindi: {sid: "bbc_hindi_tv"}});
  const [loading, setLoading] = useState(true);
  const [languageList, setLanguageList] = useState([]);

  useEffect(() => {
    getLanguages(
      (configObj) => {
        setLoading(false);
        setConfigObj(configObj);
        setLanguageList(Object.keys(configObj));
      }
    );
  }, [loading,configObj,languageList]);

    const [schedule, setSchedule] = useState(
        new ScheduleObject(
            "bbc_hindi_tv",
            moment().utc().startOf("day")
          )
    );
    const [scheduleInsertionPoint, setScheduleInsertionPoint] = useState(1);
    const [scheduleModified, setScheduleModified] = useState(false);
    const [language, setLanguage] = useState(localStorage.getItem("language") || "Hindi");
    const [timeToFill, setTimeToFill] = useState(moment.duration());
    const [loop, setLoop] = useState([]);
    const [loopDuration, setLoopDuration] = useState(moment.duration());
    const [user, setUser] = useState({ name: "anonymous", auth: true });
    const [side, setSide] = useState([]);
    const [from, setFrom] = useState(start);
    const [to, setTo] = useState(end);  

  const handleRefresh = (event) => {
    setSide(side ? false : true);
  };

  const handleAddLive = (item) => {
    let scheduleObject = new ScheduleObject(
      configObj[language].sid,
      schedule.date,
      schedule.items
    );
    const indexOfLive = scheduleObject.addLive(item);
    updateSchedule(scheduleObject, indexOfLive - 1, true);
  }

  const calculateTimeToFill = (schedule, index) => {
    for (let i = index; i < schedule.length; i++) {
      if (schedule[i].insertionType === "gap") {
        return moment.duration(schedule[i].duration);
      }
    }
    return moment.duration();
  }

  const handleScheduleRowSelect = (index) => {
    const ttf = calculateTimeToFill(schedule.items, index);
    setScheduleInsertionPoint(index);
    setTimeToFill(ttf);
  };

  const handleScheduleDelete = (index) => {
    const scheduleObject = new ScheduleObject(
      configObj[language].sid,
      schedule.date,
      schedule.items
    );
    const newIndex = scheduleObject.deleteItemClosingGap(index);
    updateSchedule(scheduleObject, newIndex, true);
  }

  const handleOccurenceDelete = (index, value) => {
    const scheduleObject = new ScheduleObject(
      configObj[language].sid,
      schedule.date,
      schedule.items
    );
    let pid = scheduleObject.items[index].asset.pid;
    console.log("pid is from editor", pid);
    const newIndex = scheduleObject.deleteAllOccurencesClosingGap(
      pid,
      index,
      value
    );
    updateSchedule(scheduleObject, newIndex, true);
  }

  const handleNewSchedule = (scheduleObject) => {
    updateSchedule(scheduleObject, 1, false);
  }

  const handleDateChange = (date) => {
    try {
      const sid = configObj[language].sid;
      fetchSchedule(sid, moment(date), (schedule) =>
        handleNewSchedule(schedule)
      );
    } catch (error) {
      console.log(error);
    }
  };

  const pasteIntoSchedule = (items) => {
    const index = scheduleInsertionPoint;
    const scheduleObject = new ScheduleObject(
      configObj[language].sid,
      schedule.date,
      schedule.items
    );

    const newIndex = scheduleObject.addFloating(index, items);
    updateSchedule(scheduleObject, newIndex, true);
  }

  const updateSchedule = (scheduleObject, scheduleInsertionPoint, modified) => {
    const ttf = calculateTimeToFill(
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
    setSchedule(scheduleObject);
    setScheduleInsertionPoint(sip);    
    setScheduleModified(modified);
    setTimeToFill(ttf);
  }

  const reloadSchedule = () => {
    handleDateChange(schedule.date);
  }

  const clearSchedule = () => {
    updateSchedule(
      new ScheduleObject(
        configObj[language].sid,
        schedule.date
      ),
      1,
      false
    );
  }

  const testLoop = () => {
    pasteIntoLoop({
      duration: "PT55M",
      title: "A test item",
    });
  }

  const pasteIntoLoop = (item) => {
    item.action = "";
    setLoop(loop.push({ ...item, insertionType: "" }));
    const d = moment.duration(loopDuration);
    d.add(moment.duration(item.duration));
    setLoopDuration(d);
  }

  const clearLoop = () => {
    setLoop([]);
    setLoopDuration(moment.duration());
  }

  const uploadLoop = (e) => {
    try {
      var file = e.target.files[0];
      let reader = new FileReader();
      reader.onload = (e) => {
        try {
          let items = JSON.parse(e.target.result);
          items.forEach((item) => {
            pasteIntoLoop(item);
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

  const saveLoop = () => {
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(loop)], {
      type: "application/json",
    });
    element.href = URL.createObjectURL(file);
    element.download =
      [configObj[language].sid].name +
      " " +
      user.name +
      " Loop.json";
    document.body.appendChild(element); // Required for this to work in FireFox
    element.click();
  }

  const deleteItemFromLoop = (index) => {
    const r = loop[index];
    loop.splice(index, 1);
    setLoop(loop);
    setLoopDuration(loopDuration.subtract(
        moment.duration(r.duration)
      )
    );
  };

  const savePlaylist = () => {
    //console.log('savePlaylist');

    // const This = this; // closure for callback
    saveSchedule(
      [configObj[language].sid].serviceIDRef,
      schedule.items,
      schedule.date,
      configObj[language].sid,
      () => {
        setScheduleModified(false);
      },
      function (e) {
        console.log(e);
      }
    );
  };

  const handleChangeLanguage = (event) => {
    const language = event.value;
    PlatformDao.getUser(configObj[language].sid, (user) => {
        setUser(user);
        setLanguage(language);
        localStorage.setItem("language", language);
        reloadSchedule();
        handleRefresh();
    });
  };

  const handleFrom = (direction) => {
    try {
      if (direction === 'back') {
        if (moment(to).diff(moment(from), "hours") < 24) {
          setFrom(moment(from).subtract(6, "hours"));
          if (
            moment(from).isAfter(moment(from).subtract(6, "hours"), "day")
          ) {
            handleDateChange(moment(from).subtract(6, "hours"));
          }
        }
      }
      if (direction === 'forward') {
        if (!moment(from).isSameOrAfter(moment(to))) {
          setFrom(moment(from).add(6, "hours"));
          if (moment(from).add(6, "hours").hour() === 0) {
            handleDateChange(moment(from).add(6, "hours"));
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleTo = (direction) => {
    try {
      if (direction === 'back') {
        if (!moment(to).isSameOrBefore(moment(from))) {
          setTo(moment(to).subtract(6, "hours"));
        }
      }
      if (direction === 'forward') {
        if (moment(to).isBefore(moment(from).add(24, "hour"), "hour")) {
          setTo(moment(to).add(6, "hours"));
        } 
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDayTo = (direction) => {
    try {
      if (direction === 'back') {
        if (moment(to).isAfter(moment(from), "day")) {
          setTo(moment(to).subtract(1, "day"));
        }
      }
      if (direction === 'forward') {
        if (moment(to).isBefore(moment(from).add(24, "hour"), "hour")) {
          setTo(moment(to).add(1, "day"));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDayFrom = (direction) => {
    try {
      if (direction === 'back') {
        if (
          moment(to).diff(moment(from).subtract(24, "hour"), "hours") <= 24
        ) {
          setFrom(moment(from).subtract(1, "day"));
          handleDateChange(moment(from).subtract(1, "day"));
        }
      }
      if (direction === 'forward') {
        if (moment(from).isBefore(moment(to), "day")) {
          setFrom( moment(from).add(1, "day"));
          handleDateChange(moment(from).add(1, "day"));
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

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
            [classes.appBarShift]: false,
          })}
        >
          <Toolbar disableGutters={true}>
            <HamburgerMenu classes={classes} />
            <Select
              id="demo-simple-select-outlined"
              labelId="demo-simple-select-outlined-label"
              style={{ fontSize: 17, color: "white" }}
              value={language}
              onChange={handleChangeLanguage}
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
              {user.name}
            </Typography>
          </Toolbar>
          <Typography variant="h6">
            <TimeDisplay />
            <PushControl />
          </Typography>
        </AppBar>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: true,
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
              <PickLists
                classes={classes}
                side={side}
                sid={configObj[language].sid}
                date={schedule.date}
                pasteIntoSchedule={pasteIntoSchedule}
                pasteIntoLoop={pasteIntoLoop}
                handleAddLive={handleAddLive}
                handleRefresh={handleRefresh}
              />
            </Box>
            <Box mx="1rem" width="28%" flexGrow={1} flexDirection="column">
              <Typography variant="h4" align="center">
                Loop
              </Typography>
              <Loop
                onTest={testLoop}
                data={loop}
                duration={loopDuration}
                timeToFill={timeToFill}
                onDelete={deleteItemFromLoop}
                onPaste={pasteIntoSchedule}
                onClear={clearLoop}
                onUpload={uploadLoop}
                onSave={saveLoop}
                sid={configObj[language].sid}
              />
            </Box>
            <Box width="44%" flexGrow={1} flexDirection="column">
              <Typography variant="h4" align="center">
                Schedule
              </Typography>
              <SchedulePicker
                enabled={scheduleModified ? false : true}
                scheduleDate={schedule.date}
                onDateChange={handleDateChange}
                handleFrom={handleFrom}
                handleTo={handleTo}
                handleDayTo={handleDayTo}
                handleDayFrom={handleDayFrom}
                from={from}
                to={to}
              />
              <ScheduleView
                onRowSelected={handleScheduleRowSelect}
                onDelete={handleScheduleDelete}
                onOccurenceDelete={handleOccurenceDelete}
                data={schedule.items}
                row={scheduleInsertionPoint}
                lastUpdated=""
                from={from}
                to={to}
              />
              <ScheduleToolbar
                saveEnabled={user.auth}
                contentModified={scheduleModified}
                onSave={savePlaylist}
                onClear={clearSchedule}
                onReload={reloadSchedule}
              />
            </Box>
          </Box>
        </main>
      </div>
    );  
}

Editor.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(Editor);
