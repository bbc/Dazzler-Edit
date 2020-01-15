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
import 'moment-duration-format';
import { TablePaginationActionsWrapped } from "../TablePaginationActions/TablePaginationActions";
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

export class Episode extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spinner: false,
      totalRows: 0,
      rows: [],
      page: 0,
      previousPage: -1,
      rowsPerPage: 5,
      sid: "",
      date: moment().utc().format()
    };
  }

  componentDidMount = () => {
    this.setState({
      sid: this.props.sid,
      date: this.props.date
    });
  };

  componentDidUpdate(prevProps) {
    if (
      (this.state.page !== this.state.previousPage)
      || (this.props.availability !== prevProps.availability)
    ) {
      console.log("Episode: %s %s have page %d want page %d", this.props.sid, this.props.availability, this.state.page, this.state.previousPage);
      AssetDao.getEpisodes(
        this.props.sid, this.props.availability,
        this.state.page + 1, this.state.rowsPerPage,
        response => {
          let items = response.data.items;
          let total = response.data.total;
          console.log('episodeDidUpdate', this.props.availability, this.props.resultsFilter);
          if(this.props.resultsFilter) {
            items = this.props.resultsFilter(items);
            if(response.data.items.length>items.length) {
              total = items.length;
            }
          }
          let new_page = 0;
          if (response.data.hasOwnProperty('page')) {
            new_page = response.data.page - 1;
          }
          this.setState({
            previousPage: new_page,
            page: new_page,
            totalRows: total,
            rows: items
          });
        })
    }
  }

  handleChangePage = (event, page) => {
    this.setState({ page: parseInt(page) });
  };

  handleChangeRowsPerPage = event => {
    this.setState({ page: 0, rowsPerPage: parseInt(event.target.value) });
  };

  formattedDuration(clip) {
    const duration = moment.duration(
      clip.available_versions.version[0].duration
    );
    return duration.format('hh:mm:ss', {trim:false});
  }

  addButton(episode) {
    return (
      <button
        className="ui compact icon button"
        onClick={() => {
          this.props.handleClick(AssetDao.episode2Item(episode));
        }}
      >
        <i className="plus icon"></i>
      </button>
    );
  }

  render() {
    const { classes } = this.props;
    const { rows, rowsPerPage, page, totalRows } = this.state;
    let emptyRows = 0;
    if(rows.length<rowsPerPage) {
      emptyRows = rowsPerPage - rows.length;
    }

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
                  <TableRow key={row.pid} className={row.insertionType}>
                    <TableCell component="th" scope="row">
                      <div className="tooltip">
                        {" "}
                        {row.title === undefined ? row.presentation_title : row.title}
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

Episode.propTypes = {
  classes: PropTypes.object.isRequired
};

export default withStyles(styles)(Episode);
