import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import moment from "moment";
import axios from "axios";
import { TablePaginationActionsWrapped } from "../TablePaginationActions/TablePaginationActions";

export const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing.unit * 3
  },
  table: {
    minWidth: 250
  },
  tableWrapper: {
    overflowX: "hidden"
  }
});

//checking if we are running locally
var URLPrefix = "";
if (process.env.NODE_ENV === "development") {
  URLPrefix = "http://localhost:8080";
}

export class Live extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spinner: false,
      totalRows: 0,
      rows: [],
      page: 0,
      previousPage: -1,
      rowsPerPage: 5,
      data: [],
      sid: "",
      date: moment().utc().format()
    };
  }

  componentDidMount = () => {
    this.setState({ sid: this.props.sid, date: this.props.date });
  };

  componentDidUpdate(prevProps) {
    //get request for webcasts
    const start = moment(this.props.date).utc().format();
    const end = moment(this.props.date).add(1, 'days').utc().format();
    if ((this.state.page !== this.state.previousPage)
      ||
      (this.props.date !== prevProps.date)
    ) {
      //console.log("have page %d want page %d", this.state.page, this.state.previousPage);
      axios
        .get(`${URLPrefix}/api/v1/webcast?sid=${this.props.sid}&start=${start}&end=${end}`)
        .then(response => {
          let rows = [];
          if (response.data.total > 0) {
            response.data.items.forEach(item => {
              var durationTime =
                moment(item.scheduled_time.end) -
                moment(item.scheduled_time.start);

              item.isLive = true;
              item.startTime = moment(item.scheduled_time.start).format("HH:mm:ss");
              item.title = "Live programme at " + item.scheduled_time.start;
              item.duration = moment.duration(durationTime, "milliseconds");
            });
            rows = response.data.items;
            let new_page = 0;
            if (response.data.hasOwnProperty('page')) {
              new_page = response.data.page - 1;
            }
            this.setState({
              rows: rows,
              previousPage: new_page,
              page: new_page,
              totalRows: response.data.total
            });
          }
        })
        .catch(e => {
          console.log(e);
        });
    }
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  };

  formattedDuration(clip) {
    const duration = clip.duration;
    const formatted = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
    return formatted;
  }

  window2Item(window) {
    const r = {};
    r.startTime = moment(window.scheduled_time.start);
    for (let i = 0; i < window.window_of.length; i++) {
      switch (window.window_of[i].result_type) {
        case "version":
          r.versionPid = window.window_of[i].pid;
          r.versionCrid = window.window_of[i].crid;
          break;
        case "episode":
          r.pid = window.window_of[i].pid;
          r.crid = window.window_of[i].crid;
          break;
        default: // DO Nothing
      }
    }
    r.captureChannel= window.service.sid; // TODO make use of this
    r.title = "Live broadcast segment";
    r.duration = window.duration.toISOString();
    r.live = true;
    r.insertionType = "live";
    return r;
  }

  addButton(window) {
    return (
      <button
        className="ui compact icon button"
        onClick={() => {
          this.props.handleClick(this.window2Item(window));
        }}
      >
        <i className="plus icon"></i>
      </button>
    );
  }

  render() {
    const { classes } = this.props;
    const { rows, rowsPerPage, page, totalRows } = this.state;
    const emptyRows =
      rowsPerPage - Math.min(rowsPerPage, rows.length - page * rowsPerPage);

    //if(rows.length === 0){
    //  this.setState({spinner : true})
    //  return <Spinner />
    // }

    return (
      <div>
        <Paper className={classes.root}>
          <div className={classes.tableWrapper}>
            <Table className={classes.table}>
              <TableHead>
                <th>Title</th>
                <th>Duration</th>
                <th>Add</th>
              </TableHead>
              <TableBody>

                {rows.map(row => (
                  <TableRow key={row.pid}>
                    <TableCell component="th" scope="row">
                      <div className="tooltip">
                        {" "}
                        {row.title === undefined
                          ? row.presentation_title
                          : row.title}
                        <span className="tooltiptext">PID = {row.pid}</span>
                      </div>
                    </TableCell>
                    <TableCell align="right">
                      {this.formattedDuration(row)}
                    </TableCell>

                    <TableCell align="right">{this.addButton(row)}</TableCell>
                  </TableRow>
                ))}

                {emptyRows > 0 && (
                  <TableRow style={{ height: 48 * emptyRows }}>
                    <TableCell colSpan={6} />
                  </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={3}
                    count={totalRows}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    SelectProps={{
                      native: true
                    }}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                    ActionsComponent={TablePaginationActionsWrapped}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Paper>
      </div>
    );
  }
}

Live.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Live);
