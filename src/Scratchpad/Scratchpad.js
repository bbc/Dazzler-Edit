import React, { Fragment } from 'react';
import Hamburger from '@material-ui/icons/Menu';
import ReactDataGrid from 'react-data-grid';
var rows = [];
var copiedContent = [];
var deleted = 0;
var length = 0;
const columns = [
  { key: 'pid', name: 'pid' },
  { key: 'title', name: 'Title' },
  { key: 'duration', name: 'duration' },
  { key: 'Delete', name: 'Delete' }
 ];
class Scratchpad extends React.Component {
  state = {
    data: [],
    status: '',
    current: '',
    refresh: 0
  };

  componentDidMount(){

    this.setState({data: this.props.data})
    this.setState({status: 'Copy'})
    this.setState({current: 'Clear'})
    

  } 

  componentDidUpdate(prevProps){

    if(prevProps.data.length !== this.props.data.length){
      if(this.props.data.length === 0){
      this.setState({current: 'clear'})
      this.setState({refresh : 1})
      
    
    }
  }
}
  render() {
    rows = [];
    
      if(this.props.data.length > 0){
      console.log(this.props.data)
      length = this.props.data.length;
      this.props.data.map((item, idx) => (
      rows.push(this.props.data[idx]) ))
      }
      
    return (
    <div>
      <h1> Scratchpad</h1>
    <ReactDataGrid
      columns={columns}
      rowGetter={i => rows[i]}
      rowsCount={length}
      minHeight={300} />
      <button class="ui button active" onClick  = { () => {this.props.copyContent(rows)}} ><i class="download icon"></i> {this.state.status}</button>
      <button class="ui button active" onClick  = { () => {this.props.clearContent()}} ><i class="trash icon"></i> {this.state.current}</button>
      </div>
      
    );
  }
}

export default Scratchpad;