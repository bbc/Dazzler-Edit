
import React from 'react';
import moment from 'moment';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import FastForward from '@material-ui/icons/FastForward';
import FastRewind from '@material-ui/icons/FastRewind';

var current  = 0;
class Date extends React.Component {

    constructor(){
        super() 
        this.handleClick = this.handleClick.bind(this);
        this.handleOtherClick = this.handleOtherClick.bind(this);
      }
      
      handleClick(days){
        current += days;
        return moment().add(current, 'd').format('LL')
        
      };
      handleOtherClick(days){
        current -= days;
      return moment().add(current, 'd').format('LL')
      };
  
      render() {   
    return(
      <div className ="dateContainer"> 
      <div className ="dateHeader"> 
   
      <center>
      {/* <button><FastRewind onClick= {() => {this.props.previousDay(  this.handleOtherClick(7)  )}  }/></button> */}
      <button class="ui icon button" onClick= {() => {this.props.previousDay(  this.handleOtherClick(7)  )}  } >
      <i class="angle double left icon"></i>
      </button>

      
      {/* <button><ChevronLeftIcon onClick= {() => {this.props.previousDay(  this.handleOtherClick(1)  )}  }/> </button> */}
      <button class="ui icon button" onClick= {() => {this.props.previousDay(  this.handleOtherClick(1)  )}  } >
      <i class="left arrow icon"></i>
      
      </button>
       {this.props.scheduleDate} 
      {/* <button><ChevronRightIcon onClick={() => {this.props.nextDay( this.handleClick(1) )} }  /></button> */}
      <button class="ui icon button" onClick={() => {this.props.nextDay( this.handleClick(1) )} } >
      <i class="right arrow icon"></i>
     
      </button>
      {/* <button><FastForward onClick= {() => {this.props.nextDay(  this.handleClick(7)  )}  }/></button> */}
      <button class="ui icon button" onClick={() => {this.props.nextDay(  this.handleClick(7)  )}  } >
      <i class="angle double right icon"></i>
      </button>
      </center>
    </div>
    </div>
    )
  }
}

     
export default Date;       