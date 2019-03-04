import React, { Component } from 'react';
import axios from 'axios';
import Schedule from './Schedule';
import Date from './Date';
import Spinner from './Spinner';
import Demo from './Demo';


class App extends Component {
    constructor(props){
      super(props);
      this.state = {
        items: [],
        data: [],
        live: [],
        episodes: [],
        count: 0
      };
      
   }

   
   
   handleClick(pid) {
   
    this.setState({
      data: [...this.state.data, pid],
      count: this.state.count + 1,
      
      
    });
    alert('boom');
  }

  render() {
    
    const { items, data, count } = this.state;
    console.log('count:', this.state.count)
    
    return (
        <div>
          <Demo />
          
          
           
    
        
        </div>
    ); 
  }
}

export default App;