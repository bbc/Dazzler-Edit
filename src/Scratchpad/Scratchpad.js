import React, { Fragment } from 'react';
import Hamburger from '@material-ui/icons/Menu';
import ReactDataGrid from 'react-data-grid';
var rows = [];
var copiedContent = [];
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
    status: ''
  };

  componentDidMount(){

    this.setState({data: this.props.data})
    this.setState({status: 'Copy'})

  } 

  render() {
    rows = [];
      
      if(this.state.data.length > 0){
      length = this.state.data.length;
      this.state.data.map((item, idx) => (
      rows.push(this.state.data[idx]) ))
      }
    return (
    <div>
    <ReactDataGrid
      columns={columns}
      rowGetter={i => rows[i]}
      rowsCount={length}
      minHeight={300} />
      <button class="ui button active" onClick  = { () => {this.props.copyContent(rows)}} ><i class="download icon"></i> {this.state.status}</button>
      
      </div>
      
    );
  }
}

export default Scratchpad;