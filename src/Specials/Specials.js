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
import {TablePaginationActionsWrapped} from "../TablePaginationActions/TablePaginationActions";
import AssetDao from "../AssetDao/AssetDao";

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
    if (this.state.page !== this.state.previousPage) {
      //console.log("have page %d want page %d", this.state.previousPage, this.state.page);
      AssetDao.getSpecials(
        this.state.sid,
        this.state.page,
        this.state.rowsPerPage,
        (items, total) => {
          console.log("updated specials", items);
          this.setState({ 
            rows: items,
            totalRows: total
          });
      });
    }
  }

  handleChangePage = (event, page) => {
    this.setState({ page });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: event.target.value });
  };

  addButton(clip) {
    return (
      <button
        className="ui compact icon button"
        onClick={() => {
          this.props.handleClick(AssetDao.clip2Item(clip));
        }}
      >
        <i className="plus icon"></i>
      </button>
    );
  }

  render() {
    const { classes } = this.props;
    const { rows, rowsPerPage, page, totalRows } = this.state;
    const emptyRows = rowsPerPage - Math.min(rowsPerPage, (rows.length?rows.length:0) - page * rowsPerPage);

    return (
      <div>
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
