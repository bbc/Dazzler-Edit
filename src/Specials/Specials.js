import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import IconButton from "@material-ui/core/IconButton";
import FirstPageIcon from "@material-ui/icons/FirstPage";
import KeyboardArrowLeft from "@material-ui/icons/KeyboardArrowLeft";
import KeyboardArrowRight from "@material-ui/icons/KeyboardArrowRight";
import LastPageIcon from "@material-ui/icons/LastPage";
import moment from "moment";
import Spinner from "../Spinner/Spinner";
import axios from "axios";
const type = "Specials";
const actionsStyles = theme => ({
  root: {
    flexShrink: 0,
    color: theme.palette.text.secondary,
    marginLeft: theme.spacing.unit * 2.5
  }
});
class TablePaginationActions extends React.Component {
  handleFirstPageButtonClick = event => {
    this.props.onChangePage(event, 0);
  };

  handleBackButtonClick = event => {
    this.props.onChangePage(event, this.props.page - 1);
  };

  handleNextButtonClick = event => {
    this.props.onChangePage(event, this.props.page + 1);
  };

  handleLastPageButtonClick = event => {
    this.props.onChangePage(
      event,
      Math.max(0, Math.ceil(this.props.count / this.props.rowsPerPage) - 1)
    );
  };

  render() {
    const { classes, count, page, rowsPerPage, theme } = this.props;

    return (
      <div className={classes.root}>
        <IconButton
          onClick={this.handleFirstPageButtonClick}
          disabled={page === 0}
          aria-label="First Page"
        >
          {theme.direction === "rtl" ? <LastPageIcon /> : <FirstPageIcon />}
        </IconButton>
        <IconButton
          onClick={this.handleBackButtonClick}
          disabled={page === 0}
          aria-label="Previous Page"
        >
          {theme.direction === "rtl" ? (
            <KeyboardArrowRight />
          ) : (
            <KeyboardArrowLeft />
          )}
        </IconButton>
        <IconButton
          onClick={this.handleNextButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Next Page"
        >
          {theme.direction === "rtl" ? (
            <KeyboardArrowLeft />
          ) : (
            <KeyboardArrowRight />
          )}
        </IconButton>
        <IconButton
          onClick={this.handleLastPageButtonClick}
          disabled={page >= Math.ceil(count / rowsPerPage) - 1}
          aria-label="Last Page"
        >
          {theme.direction === "rtl" ? <FirstPageIcon /> : <LastPageIcon />}
        </IconButton>
      </div>
    );
  }
}

TablePaginationActions.propTypes = {
  classes: PropTypes.object.isRequired,
  count: PropTypes.number.isRequired,
  onChangePage: PropTypes.func.isRequired,
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
  theme: PropTypes.object.isRequired
};

export const TablePaginationActionsWrapped = withStyles(actionsStyles, {
  withTheme: true
})(TablePaginationActions);

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
if (process.env.NODE_ENV == "development") {
  URLPrefix = "http://localhost:8080";
}

export class Specials extends React.Component {
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
      sid: ""
    };
  }

  componentDidMount = () => {
    this.setState({ sid: this.props.sid });
  };

  componentDidUpdate(prevProps) {
    console.log("Specials update", this.state.page);
    if (this.state.page !== this.state.previousPage) {
      console.log("have page %d want page %d", this.props.page, prevProps.page);
      axios
        .get(
          URLPrefix +
          "/api/v1/special" +
          "?sid=" +
          this.props.sid +
          "&page=" +
          (this.state.page + 1) + // nitro is 1 based
            "&page_size=" +
            this.state.rowsPerPage
        )
        .then(response => {
          console.log("Specials", response.data.items);
          this.setState({ previousPage: response.data.page - 1 });
          this.setState({ page: response.data.page - 1 });
          this.setState({ rows: response.data.items });
          this.setState({ totalRows: response.data.total });
        })
        .catch(e => {
          console.log(e);
        });
    }
  }

  handleChangePage = (event, page) => {
    console.log("Specials handleChangePage", this.state.page, page);
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
              <TableBody>
                <th>Title</th>
                <th>Duration</th>
                <th>Add</th>

                {rows.map(row => (
                  <TableRow key={row.pid}>
                    <TableCell component="th" scope="row">
                      <div className="tooltip">
                        {" "}
                        {row.title == undefined
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

Specials.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Specials);
