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
import "moment-duration-format";
import { TablePaginationActionsWrapped } from "../TablePaginationActions/TablePaginationActions";
import { fetchWebcasts } from "../ScheduleDao/ScheduleDao";

export const styles = theme => ({
  root: {
    width: "100%",
    marginTop: theme.spacing(3)
  },
  table: {
    minWidth: 250
  },
  tableWrapper: {
    overflowX: "hidden"
  }
});

export class Live extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spinner: false,
      rows: [],
      page: 0,
      previousPage: -1,
      rowsPerPage: 5,
      totalRows: 0,
      sid: "",
      date: moment()
        .utc()
        .startOf("day")
    };
  }

  componentDidMount = () => {
    this.setState({ sid: this.props.sid, date: moment(this.props.date) });
  };

  componentDidUpdate(prevProps) {
    //get request for webcasts
    const start = moment(this.props.date)
      .utc()
      .format();
    const end = moment(this.props.date)
      .add(1, "days")
      .utc()
      .format();
    if (
      this.state.page !== this.state.previousPage ||
      this.props.date !== prevProps.date
    ) {
      //console.log("have page %d want page %d", this.state.previousPage, this.state.page);
      fetchWebcasts(
        this.props.sid,
        start,
        end,
        this.state.page,
        this.state.rowsPerPage,
        (schedule, totalRows) => {
          this.setState({
            sid: this.props.sid,
            date: moment(this.props.date),
            rows: schedule,
            totalRows: totalRows,
            page: this.state.page,
            previousPage: this.state.page
          });
        }
      );
    }
  }

  handleChangePage = (event, page) => {
    console.log("live:handleChangePage", page);
    this.setState({ page: page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  };

  formattedDuration(item) {
    return moment.duration(item.duration).format("hh:mm:ss", { trim: false });
  }

  addButton(item) {
    return (
      <button
        className="ui compact icon button"
        onClick={() => {
          this.props.handleClick(item);
        }}
      >
        <i className="plus icon"></i>
      </button>
    );
  }

  render() {
    const { classes } = this.props;
    const { date, rows, rowsPerPage, page, totalRows } = this.state;
    let emptyRows = 0;
    if (rows.length < rowsPerPage) {
      emptyRows = rowsPerPage - rows.length;
    }

    return (
      <div>
        {date.format("YYYY-MM-DD")}
        <Paper className={classes.root}>
          <div className={classes.tableWrapper}>
            <Table className={classes.table}>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell>Add</TableCell>
                </TableRow>
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
                        <span className="tooltiptext">{'PID = '+row.pid.trim()}</span>
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
