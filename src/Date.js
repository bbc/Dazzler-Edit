
import React from 'react';

import moment from 'moment';


var current  = 0;
class Date extends React.Component {

    constructor(){
        super() 
        this.handleClick = this.handleClick.bind(this);
        this.handleOtherClick = this.handleOtherClick.bind(this);
      }
      
      handleClick(){
        current += 1;
        return moment().add(current, 'd').format('LL')
        
      };
      handleOtherClick(){
        current -= 1;
      return moment().add(current, 'd').format('LL')
      };
  
      render() {


          
    return(
     <div>
      <center>
      <button onClick= {() => {this.props.previousDay(  this.handleOtherClick()  )}  }> Previous </button>
        {this.props.scheduleDate}
      <button onClick={() => {this.props.nextDay( this.handleClick() )} }  >Next</button>
      </center>
    </div>
    )
  }
}

     
export default Date;       