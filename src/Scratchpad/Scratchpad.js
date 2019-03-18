import React, { Fragment } from 'react';
import Hamburger from '@material-ui/icons/Menu';
import ReactDataGrid from 'react-data-grid';
var rows = [];
var copiedContent = [];
const columns = [
  { key: 'pid', name: 'pid' },
  { key: 'title', name: 'Title' },
  { key: 'duration', name: 'duration' } ];
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

      this.state.data.map((item, idx) => (
      rows.push(this.state.data[idx]) ))

    return (
    <div>
    <ReactDataGrid
      columns={columns}
      rowGetter={i => rows[i]}
      rowsCount={this.state.data.length}
      minHeight={300} />

<button class="ui left floated button" onClick  = { () => {this.props.copyContent(rows)}} >{this.state.status} </button>
  </div>
      
    );
  }
}

export default Scratchpad;