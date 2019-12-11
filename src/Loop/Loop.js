import React /*, { Fragment }*/ from "react";
import Box from '@material-ui/core/Box';
import ReactDataGrid from "react-data-grid";
import moment from "moment";
import 'moment-duration-format';
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";
import { Typography } from "@material-ui/core";

const columns = [
  //{ key: "pid", name: "pid" },
  { key: "title", name: "Title", width: 200 },
  { key: "durationAsString", name: "Duration", width: 80 },
  { key: "action", name: "Action", width: 80 }
];

class Loop extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
      status: "",
      current: "",
      startDate: moment(),
      finishDate: moment().add(2, 'hours'),
      duration: moment.duration('PT0S')
    };
  }

  componentDidMount() {
    /*
    this.setState({
      data: this.props.data,
      duration: this.props.duration,
      status: "Copy",
      current: "Clear",
      startDate: moment(),
      finishDate:  moment().add(2, 'hours')
    });
    */
  }

  componentDidUpdate(prevProps) {
    console.log('update loop', this.props);
    if (prevProps.data.length !== this.props.data.length) {
      if (this.props.data.length === 0) {
        /*
        this.setState({ 
          current: "Clear", 
          data: [],
          duration: 0
        });
        */
      }
      else {
        /*
        this.setState({ 
          data: this.props.data,
          duration: this.props.duration
        });
        */
      }
    }
  }

  getCellActions = (column, row) => {
    const cellActions = [
      {
        icon: <i className="trash icon" />,
        callback: () => {
          console.log('delete row', row.index);
          const d = moment.duration(row.duration).valueOf();
          this.props.onDelete(row.index);
          const rows = [...this.state.data];
          rows.splice(row.index, 1);
          // do the following until round trip from the editor works
          /*
          this.setState({ 
            data: rows,
            duration: this.state.duration - d
          });
          */
        }
      }
    ];
    return column.key === "action" ? cellActions : null;
  }

  onGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    this.setState(state => {
      const rows = state.data.slice();
      for (let i = fromRow; i <= toRow; i++) {
        rows[i] = { ...rows[i], ...updated };
      }
      return { data: rows };
    });
  }

  render() {
    return (
      <Box>
        <Box display="flex" flexDirection="row">
          <Typography>
          Duration:
          {moment.duration(this.state.duration).format("HH:mm:ss")}
          </Typography>
          <Typography>
            Time to fill:
          {moment.duration(this.props.timeToFill).format("HH:mm:ss")}
          </Typography>
        </Box>
        <ReactDataGrid
          columns={columns}
          rowGetter={i => this.state.data[i]}
          rowsCount={this.state.data.length}
          onGridRowsUpdated={this.onGridRowsUpdated}
          enableCellSelect={true}
          getCellActions={this.getCellActions}
          minHeight={300}
        />
        <button
          class="ui button active"
          onClick={() => {
            this.props.onClear();
          }}
        >
          <i class="trash icon"></i> {this.state.current}
        </button>

        <div class="ui text container">
          Start:{" "}
          <Flatpickr
            data-enable-time
            value={this.state.startDate}
            onChange={startDate => {
              //this.setState({ startDate });
            }}
          />
          <br/>
          <br/>
          <br/>
          Finish by:{" "}
          <Flatpickr
            data-enable-time
            value={this.state.finishDate}
            onChange={finishDate => {
              //this.setState({ finishDate });
            }}
          />
          <br />
          <br />
          <div class="ui form">
            <div class="inline field"></div>
          </div>
          <button
            onClick={() => {
              this.props.onPaste(this.state.data, this.state.startDate, this.state.finishDate);
            }}
          >
            {" "}
            Go{" "}
          </button>
        </div>
      </Box>
    );
  }
}
export default Loop;
