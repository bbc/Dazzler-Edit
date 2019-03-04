import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { withStyles } from '@material-ui/core/styles';
import Drawer from '@material-ui/core/Drawer';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import List from '@material-ui/core/List';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import InboxIcon from '@material-ui/icons/LiveTv';
import MailIcon from '@material-ui/icons/Schedule';
import Payment from '@material-ui/icons/VideoLibrary';
import Lock from '@material-ui/icons/Star';
import Opacity from '@material-ui/icons/Opacity';
import Picture from '@material-ui/icons/PictureInPicture';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import axios from 'axios'
import Specials from './Specials';
import moment from 'moment';
import Episode from './Episode';
import Live from './Live';
import Clips from './Clips';
import Date from './Date';
import Schedule from './Schedule';
import PreviousSchedule from './PreviousSchedule';
const drawerWidth = 240;

var icons = [<MailIcon />, <InboxIcon />,  <Payment />, <Picture />, <Lock />, <Opacity />]
var begin = moment().utcOffset(0);
var end = moment().add(5, 'days').utcOffset(0);
begin.set({hour:0,minute:0,second:0,millisecond:0})
begin.toISOString() 

end.set({hour:23,minute:59,second:5,millisecond:9})
end.toISOString() 
var count = 0;

const styles = theme => ({
  root: {
    display: 'flex',
  },
  appBar: {
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
  },
  appBarShift: {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: drawerWidth,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  },
  menuButton: {
    marginLeft: 12,
    marginRight: 20,
  },
  hide: {
    display: 'none',
  },
  drawer: {
    width: drawerWidth,
    flexShrink: 0,
  },
  drawerPaper: {
    width: drawerWidth,
  },
  drawerHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 8px',
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
  },
  content: {
    flexGrow: 1,
    padding: theme.spacing.unit * 3,
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: -drawerWidth,
  },
  contentShift: {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  },
});

class PersistentDrawerLeft extends React.Component {
  state = {
    open: false,
    Title: '',
    isPaneOpen: false,
    panelShow: null,
    data: [],
    count: 0,
    items: [],
    specials: [],
    episodes:[],
    live: [],
    scheduleDate: moment().add(0, 'd').format('LL'),
    display: ''
  };

  componentDidMount() {
  
    this.handleClick = this.handleClick.bind(this);
    this.deleteItem = this.deleteItem.bind(this);
    this.previousDay = this.previousDay.bind(this);
    this.nextDay = this.nextDay.bind(this);
    // this.loadPlaylist = this.loadPlaylist.bind(this);

    this.setState({
      display: <Schedule data={this.state.data} deleteItem={this.deleteItem} scheduleDate={moment(this.state.scheduleDate).utcOffset(0).format()}/>

    })
      //Clips
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/test/clip?language=marathi').then((response) => {
        this.setState({
            items: response.data,
        })
        
    }).catch(e => {
       console.log(e);
    });

    //get request for specials
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/test/special').then((response) => {
     
      this.setState({
        specials: response.data
    })
    
    }).catch(e => {
       console.log(e);
    });


    //get request for webcasts 
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/test/webcast?brand=w13xttvl&start=' 
    + begin.format() + '&end=' + end.format()).then((response) => {

            for(let i =0; i < response.data.length; i++){

        if(!moment().isAfter(response.data[i].scheduled_time.start)){
          
          this.setState({
            live:  [...this.state.live, response.data[i]]
            
        })
        
      }else if(moment().isAfter(response.data[i].scheduled_time.start)){
          this.setState({
            episodes:  [...this.state.episodes, response.data[i]]
        })
      
        }
     
    }
       
    }).catch(e => {
       console.log(e);
    });
    
  }
  
   handleDrawerOpen = () => {
    this.setState({ open: true });

  };

  handleDrawerClose = () => {
    this.setState({ open: false });
  };

  deleteItem(id){
    
  }

  previousDay(CDate){

    this.setState({
      scheduleDate: CDate,
      display: <PreviousSchedule data={this.state.data} scheduleDate={moment(CDate).utcOffset(0).format()}/>
     }) 
  }
  nextDay(CDate){

    this.setState({
      scheduleDate: CDate,
      display: <Schedule data={this.state.data} deleteItem={this.deleteItem} scheduleDate={moment(CDate).utcOffset(0).format()}/>
     }) 
    

  }

  handleClick(item, isLive) {
    count++;
    const newItem2 = {
      ...item
    };  
   if(isLive){
      if(newItem2.startTime === undefined){
        newItem2.versionPid = item.pid
        newItem2.id = count;
        newItem2.startTime = moment.utc(this.state.data[this.state.data.length - 1].startTime, "HH:mm:ss").add(moment.duration(this.state.data[this.state.data.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
        this.setState({
          data: [...this.state.data, newItem2],   
        });
      }else{
        newItem2.id = count;
        newItem2.versionPid = item.pid
        this.setState({
          data: [...this.state.data, newItem2],    
        });
      }
    }else{

    if(this.state.data.length === 0){

      newItem2.id = count;
      newItem2.startTime = moment.utc("00:00", "HH:mm:ss").format("HH:mm:ss");
      newItem2.duration = item.available_versions.version[0].duration
      newItem2.versionPid = item.available_versions.version[0].pid
    }else{
      newItem2.id = count;
      newItem2.startTime = moment.utc(this.state.data[this.state.data.length - 1].startTime, "HH:mm:ss").add(moment.duration(this.state.data[this.state.data.length - 1].duration)._milliseconds, 'milliseconds').format("HH:mm:ss");
      newItem2.duration = item.available_versions.version[0].duration
      newItem2.versionPid = item.available_versions.version[0].pid
    }
    this.setState({
      data: [...this.state.data, newItem2],    
    });
    
  } 

  }

  iHandleClick = (text) => {

    
    if(text === 'Clips'){
      console.log("tsd", this.state.data)
      this.setState({ isPaneOpen: true })
      this.setState({title: "Available Clips"})
      this.setState({ panelShow:   <Clips items={this.state.items}  handleClick={this.handleClick} />});
      

     
    }

    if(text === 'Live'){
      this.setState({ isPaneOpen: true })
      this.setState({title: "Live"})
      this.setState({ panelShow:   <Live live={this.state.live}  handleClick={this.handleClick}  />});
    }
    if(text === 'a'){
    
      return this.setState({ show: <Date /> });
    }
  
    if(text === 'Episodes'){
      this.setState({ isPaneOpen: true })
      this.setState({title: "Episodes"})
      this.setState({ panelShow:   <Episode episodes={this.state.episodes}  handleClick={this.handleClick}  />});
    }
    if(text === 'Specials'){
      
      this.setState({ isPaneOpen: true })
      this.setState({title: "Specials"})
      this.setState({ panelShow:   <Specials specials={this.state.specials}  handleClick={this.handleClick}  />});
      
    }
    if(text === 'Extra'){
     
      return this.setState({ show: <Date /> });
    }

  
  };

  render() {
    const { items, data, count } = this.state;
    const { classes, theme } = this.props;
    const { open } = this.state;
    

    return (
      <div className={classes.root}>
    
       
    <SlidingPane
               closeIcon={<div>Some div containing custom close icon.</div>}
                className='some-custom-class'
                overlayClassName='some-custom-overlay-class'
                isOpen={ this.state.isPaneOpen }
                title='Hey, it is optional pane title.  I can be React component too.'
                width = '30%'
                subtitle='Optional subtitle.'
                onRequestClose={ () => {
                    // triggered on "<" on left top click or on outside click
                    this.setState({ isPaneOpen: false });
                } }>
                
                <h1>{this.state.title}</h1>
                  {this.state.panelShow}
                <div></div>
                <br />
              
            </SlidingPane>

           
        <CssBaseline />
        <AppBar
          position="fixed"
          className={classNames(classes.appBar, {
            [classes.appBarShift]: open,
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
             <center>Marathi</center> 
            </Typography>
          </Toolbar>
        </AppBar>
        <Drawer
          className={classes.drawer}
          variant="persistent"
          anchor="left"
          open={open}
          classes={{
            paper: classes.drawerPaper,
          }}
        >
          <div className={classes.drawerHeader}>
          
            <IconButton onClick={this.handleDrawerClose}>
              {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
          
          </div>
          <center> <h3>Menu </h3> </center>
          <Divider />
          
          <List> 
          
            {['Live', 'Clips', 'Episodes', 'Specials', 'Extra'].map((text, index) => (
              <ListItem button key={text} onClick = {() => {this.iHandleClick(text)}}> 
                <ListItemIcon>{icons[index]}</ListItemIcon> 
               
                
                <ListItemText primary={text} /> 
              
              </ListItem>
            ))}
        
          </List>
       
          <Divider />
         
        </Drawer>
        <main
          className={classNames(classes.content, {
            [classes.contentShift]: open,
          })}
          
        >
          <div className={classes.drawerHeader} />
          <Typography paragraph>
         
          <Date nextDay ={this.nextDay} previousDay = {this.previousDay} scheduleDate={this.state.scheduleDate}/>
          <Schedule data={this.state.data} deleteItem={this.deleteItem} scheduleDate={moment(this.state.scheduleDate).utcOffset(0).format()}/>  
       
          </Typography>
          
        </main>
      </div>
    );
  }
}

PersistentDrawerLeft.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(PersistentDrawerLeft);