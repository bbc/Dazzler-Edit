import React /*, { Fragment }*/ from "react";
import Box from '@material-ui/core/Box';
import ReactDataGrid from "react-data-grid";
import moment from "moment";
import 'moment-duration-format';
import { Typography } from "@material-ui/core";

const durationFormatter = ({ value }) => {
  return moment.duration(value).format('HH:mm:ss');
};

const columns = [
  { key: "title", name: "Title", width: 200 },
  { key: "duration", name: "Duration", width: 80, formatter: durationFormatter },
  { key: "action", name: "Action", width: 80 }
];

class Loop extends React.Component {
  constructor(props) {
    super(props);
    this.pasteToFill = this.pasteToFill.bind(this);
    this.state = {
    };
  }

  componentDidMount() {
  }

  pasteToFill() {
    const count = this.props.timeToFill / this.props.duration;
    console.log('pasteToFill', count, Math.ceil(count));
    this.props.onPaste(this.props.data, Math.ceil(count));
  }

  render() {
    const active = (this.props.data.length>0)?"ui button active":"ui button"
    return (
      <div style={{ width: '100%' }}>
      <Box>
        <Box display="flex" flexDirection="row">
          <Box width="50%">
          <Typography>
          Duration:&nbsp;{this.props.duration.format('HH:mm:ss')}
          </Typography>
          </Box>
          <Box width="50%">
          <Typography>
            Time to fill:&nbsp;{this.props.timeToFill.format('HH:mm:ss')}
          </Typography>
          </Box>
        </Box>
        <ReactDataGrid
          columns={columns}
          rowGetter={i => {const item = {...this.props.data[i], index:i}; return item;}}
          rowsCount={this.props.data.length}
          enableCellSelect={true}
          getCellActions={this.getCellActions}
          minHeight={300}
        />
        <Box display="flex" flexDirection="row" flexGrow={1}>
          <button className={active} onClick={this.props.onClear}>
            <i className="trash icon"><Typography>Clear</Typography></i>
          </button>
          <button className={active} onClick={() => {
                this.props.onPaste(this.props.data);
              }}
          ><Typography>Paste</Typography>
          </button>
          <button className={active} onClick={this.pasteToFill}
          ><Typography>Paste to Fill</Typography>
          </button>
          <button className="ui button" onClick={this.props.onTest}
          ><Typography>Test</Typography>
          </button>
        </Box>
      </Box>
      </div>
    );
  }

  getCellActions = (column, row) => {
    const cellActions = [
      {
        icon: <i className="trash icon" />,
        callback: () => {this.props.onDelete(row.index);}
      }
    ];
    return column.key === "action" ? cellActions : null;
  }
}
export default Loop;
