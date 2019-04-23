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
import Assignment from '@material-ui/icons/Assignment';
import Movie from '@material-ui/icons/Movie';
import Opacity from '@material-ui/icons/Opacity';
import Picture from '@material-ui/icons/PictureInPicture';
import SlidingPane from 'react-sliding-pane';
import 'react-sliding-pane/dist/react-sliding-pane.css';
import axios from 'axios'
import Specials from '../Specials/Specials';
import moment from 'moment';
import Episode from '../Episode/Episode';
import Live from '../Live/Live';
import Clips from '../Clips/Clips';
import Scratchpad from '../Scratchpad/Scratchpad';
import Date from '../Date/Date';
import Schedule from '../Schedule/Schedule';
import PreviousSchedule from '../PreviousSchedule/PreviousSchedule';
import NextSchedule from '../NextSchedule/NextSchedule';
const drawerWidth = 240;
var menuText = "Schedule";
var text = "Today's ";
var s = [];
var n = [];
var copiedContent = [];
var icons = [<MailIcon />, <Movie />,  <Payment />, <Picture />, <Lock />, <Opacity />]
var viewIcons = [<InboxIcon />, <Assignment />]
var begin = moment().utcOffset(0);
var end = moment().utcOffset(0);
begin.set({hour:0,minute:0,second:0,millisecond:0})
begin.toISOString() 

end.set({hour:23,minute:59,second:5,millisecond:9})
end.toISOString() 
var count = -1;

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

class Demo extends React.Component {
  state = {
    open: false,
    Title: '',
    isPaneOpen: false,
    panelShow: null,
    count: 0,
    items: [],
    specials: [],
    episodes:[],
    live: [],
    scheduleDate: moment().add(0, 'd').format('LL'),
    display: '',
    
  };

  componentDidMount() {
   
    this.handleClick = this.handleClick.bind(this);
    this.previousDay = this.previousDay.bind(this);
    this.nextDay = this.nextDay.bind(this);
    this.copyContent = this.copyContent.bind(this);
    this.clearContent = this.clearContent.bind(this);
   


    this.setState({
      display: <Schedule data={n} dataLength = {n.length} pasted ={copiedContent} data={s} deleteItem={this.deleteItem} text="Today's " loadPlaylist = {this.loadPlaylist}/>

    })
      //Clips
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/clip?language=marathi').then((response) => {
      console.log(response, 'response')
        this.setState({
            items: response.data,
        })
        
    }).catch(e => {
       console.log(e);
    });

    //get request for specials
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/special').then((response) => {
     
      this.setState({
        specials: response.data
    })
    
    }).catch(e => {
       console.log(e);
    });


    //get request for webcasts 
    axios.get('https://iqvp3l4nzg.execute-api.eu-west-1.amazonaws.com/live/webcast?brand=w13xttvl&start=' 
    + begin.format() + '&end=' + end.format()).then((response) => {
      console.log("WEBCAST", response)
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

  copyContent(rows){
    copiedContent = [];
    if(rows.length > 0){  
      rows.map((row, index) => (
      copiedContent.push(rows[index])
    ))
  }
}
clearContent(){
  s = [];
  this.setState({ display: <Scratchpad data={s} deleteItem={this.deleteItem} copyContent={this.copyContent} clearContent={this.clearContent}/>})


}


 previousDay = (CDate) => {
     
     text = moment(CDate).isAfter(moment()) ? "Future " : "Previous ";
   
    if(moment(CDate).format('LL') === moment().format('LL')){
     text = "Today's ";
    this.setState({
      scheduleDate: CDate,
      display: <Schedule data={n} dataLength = {n.length} pasted ={copiedContent} data={s} deleteItem={this.deleteItem} text={text} loadPlaylist = {this.loadPlaylist}/>
    })
    }else{
    
    this.setState({
      scheduleDate: CDate,
      display: <PreviousSchedule scheduleDate={moment(CDate).utcOffset(0).format()} text={text}/>
     }) 
  }
}
  nextDay= (CDate) => {
    
     text = moment(CDate).isBefore(moment()) ? "Previous " : "Future ";
    
    if(moment(CDate).format('LL') === moment().format('LL')){
     text = "Today's ";
      this.setState({
        scheduleDate: CDate,
        display: <Schedule data={n} dataLength = {n.length} pasted ={copiedContent} data={s} deleteItem={this.deleteItem} text={text} loadPlaylist = {this.loadPlaylist}/>
      })
      }else{
  
      this.setState({
        scheduleDate: CDate,
        display: <NextSchedule scheduleDate={moment(CDate).utcOffset(0).format()}text={text}/>
       }) 
    }

  }
  handleClick = (item, isLive) => {
    
    count++;
   
    const newItem2 = {
      ...item
    };  
   
   if(isLive){
     
      if(newItem2.startTime === undefined){
        newItem2.versionPid = item.pid
        newItem2.isLive = false;
        newItem2.id = count;

      }else{
        newItem2.versionPid = item.pid
        newItem2.isLive = true;
        newItem2.id = count;
      }
    }else{

      if(item.available_versions !== undefined){
      newItem2.duration = item.available_versions.version[0].duration
      newItem2.versionPid = item.available_versions.version[0].pid
      newItem2.id = count;

      }else {
        newItem2.duration = moment(item.scheduled_time.end) - moment(item.scheduled_time.start);
        newItem2.versionPid = item.pid;
        newItem2.id = count;
      }

      newItem2.isLive = false;
      
     
         
      }  
    if(menuText === 'Scratchpad') {s.push(newItem2)}else{n.push(newItem2)};
    if(menuText === 'Scratchpad'){
        this.setState({ display: <Scratchpad data={s} deleteItem={this.deleteItem} copyContent={this.copyContent} clearContent={this.clearContent}/>})
    }   
    if (menuText === 'Schedule'){
      this.setState({ display: <Schedule data={n} dataLength = {n.length} pasted = {copiedContent} text="Today's "  deleteItem={this.deleteItem} /> });
    }

    
  }

  
  iHandleClick = (text) => {

    if(text === 'Clips'){
      
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
    if(text === 'Schedule'){
      menuText = text;
      return this.setState({ display: <Schedule data={n} dataLength = {n.length} pasted = {copiedContent} text="Today's "  deleteItem={this.deleteItem} /> });
    }
    if(text === 'Scratchpad'){
      menuText = text;
      return this.setState({ display: <Scratchpad data={s} deleteItem={this.deleteItem} clearContent = {this.clearContent} copyContent={this.copyContent}/>});
    }  
  }
  
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
          <center> <h3> View </h3> </center>
          <Divider />
          <List> 
          
          {['Schedule', 'Scratchpad'].map((text, index) => (
            <ListItem button key={text} onClick = {() => {this.iHandleClick(text)}}> 
              <ListItemIcon>{viewIcons[index]}</ListItemIcon> 
             
              
              <ListItemText primary={text} /> 
            
            </ListItem>
          ))}
      
        </List>
        
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
          {this.state.display}
        
          
          </Typography>
          
        </main>
      </div>
    );
  }
}

Demo.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
};

export default withStyles(styles, { withTheme: true })(Demo);