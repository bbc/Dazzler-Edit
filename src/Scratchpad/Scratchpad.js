import React /*, { Fragment }*/ from "react";
import ReactDataGrid from "react-data-grid";
import moment from "moment";
var rows = [];
var length = 0;
var duration = 0;
const columns = [
  { key: "pid", name: "pid" },
  { key: "title", name: "Title" },
  { key: "newDuration", name: "duration" },
  { key: "Delete", name: "Delete" }
];
class Scratchpad extends React.Component {
  state = {
    data: [],
    status: "",
    current: ""
  };

  componentDidMount() {
    this.setState({ data: this.props.data });
    this.setState({ status: "Copy" });
    this.setState({ current: "Clear" });
  }
  componentDidUpdate(prevProps) {
    if (prevProps.data.length !== this.props.data.length) {
      if (this.props.data.length === 0) {
        //this.setState({ current: "Clear" });
      }
    }
  }
  render() {
    rows = [];
    duration = 0;
    if (this.props.data.length > 0) {
      length = this.props.data.length;
      this.props.data.map((item, idx) => {
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
          <h1> Scratchpad</h1>
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
            this.props.copyContent(rows);
          }}
        >
          <i class="download icon"></i> {this.state.status}
        </button>
        <button
          class="ui button active"
          onClick={() => {
            this.props.clearContent(false);
          }}
        >
          <i class="trash icon"></i> {this.state.current}
        </button>
      </div>
    );
  }
}

export default Scratchpad;