import React, { Fragment } from "react";
import ReactDataGrid from "react-data-grid";
import moment from "moment";
import Flatpickr from 'react-flatpickr'
import 'flatpickr/dist/themes/material_green.css'





var rows = [];
var copiedContent = [];
var length = 0;
var duration = 0;
const columns = [
  { key: "pid", name: "pid" },
  { key: "title", name: "Title" },
  { key: "newDuration", name: "duration" },
  { key: "Delete", name: "Delete" }
];
class Loop extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      status: "",
      current: "",
      refresh: 0,
      startDate: new Date(),
      finishDate: '',
    };
  }

  componentDidMount() {
    this.setState({ data: this.props.data });
    this.setState({ status: "Copy" });
    this.setState({ current: "Clear" });
  }
  componentDidUpdate(prevProps) {
    if (prevProps.data.length !== this.props.data.length) {
      if (this.props.data.length === 0) {
        this.setState({ current: "Clear" });
        this.setState({ refresh: 1 });
      }
    }
  }
  render() {  
   
    const { startDate, finishDate } = this.state;
    console.log(finishDate)
    rows = [];
    duration = 0;
    copiedContent = this.state.data;
    if (copiedContent.length > 0) {
      length = copiedContent.length;
      copiedContent.map((item, idx) => {
        return (
          (duration += moment.duration(item.duration)._milliseconds),
          (item.newDuration =
            moment.duration(item.duration)._data.minutes +
            " minutes " +
            moment.duration(item.duration)._data.seconds +
            " seconds"),
          rows.push(item)
        );
      });
    }
    return (
      <div>
        <center>
          {" "}
          <h1> Loop</h1>
        </center>
        <button class="ui left floated button">
          {" "}
          Duration:{" "}
          {moment(duration)
            .utcOffset(0)
            .format("HH:mm:ss")}{" "}
        </button>
        <ReactDataGrid
          columns={columns}
          rowGetter={i => rows[i]}
          rowsCount={length}
          minHeight={300}
        />
        <button
          class="ui button active"
          onClick={() => {
            this.props.clearContent();
          }}
        >
          <i class="trash icon"></i> {this.state.current}
        </button>

        <div class="ui text container">
        Start:   <Flatpickr data-enable-time
        value={startDate}
        onChange={startDate => { this.setState({startDate}) }} />
        <br/>
        <br/>
        <br/>
        Finish by: <Flatpickr data-enable-time
        value={finishDate}
        onChange={finishDate => { this.setState({finishDate}) }} />
      </div>
      </div>
    );
  }
}

export default Loop;