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
// import Spinner from "../Spinner/Spinner";
import {TablePaginationActionsWrapped} from "../TablePaginationActions/TablePaginationActions";
import AssetDao from "../AssetDao/AssetDao";

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

export class Clips extends React.Component {
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
      type: "web"
    };
  }

  componentDidMount = () => {
    this.setState({
      sid: this.props.sid,
      type: this.props.type
    });
  };

  componentDidUpdate(prevProps) {
    console.log("update %s page %d -> %d", this.state.type, this.state.previousPage, this.state.page);
    console.log(prevProps);
    let reload = false;
    if(this.state.sid !== prevProps.sid) {
      reload = true;
    }
    if(this.state.type !== prevProps.type) {
      reload = true;
    }
    if(this.state.page !== this.state.previousPage) reload = true;
    if (reload) {
      console.log("have page %d want page %d", this.state.previousPage, this.state.page);
      AssetDao.getClips(
        this.props.sid,
        this.props.type,
        this.state.page, this.state.rowsPerPage,
        response => {
          let new_page = 0;
          if(response.data.hasOwnProperty('page')) {
            new_page = response.data.page - 1;
          }
          this.setState({ 
            previousPage: new_page,
            page: new_page,
            rows: response.data.items,
            totalRows: response.data.total
          });
        });
    }
  }

  handleChangePage = (event, page) => {
    console.log(this.state.type, "handleChangePage", this.state.page, page);
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  };

  formattedDuration(clip) {
    const duration = moment.duration(
      clip.available_versions.version[0].duration
    );
    const formatted = moment.utc(duration.asMilliseconds()).format("HH:mm:ss");
    return formatted;
  }
  addButton(clip) {
    return (
      <button
        className="ui compact icon button"
        onClick={() => {
          this.props.handleClick(clip);
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
                        {row.title}
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
                    SelectProps={{ native: true }}
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

Clips.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Clips);
