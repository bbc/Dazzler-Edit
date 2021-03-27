import React from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import FormControl from "@material-ui/core/FormControl";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import TableCell from "@material-ui/core/TableCell";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import TextField from "@material-ui/core/TextField";
import { TablePaginationActionsWrapped } from "../TablePaginationActions/TablePaginationActions";
import ClipList from "../ClipList";

export const styles = (theme) => ({
  root: {
    width: "100%",
    marginTop: theme.spacing(3),
  },
  table: {
    minWidth: 250,
  },
  tableWrapper: {
    overflowX: "scroll",
  },
  search: {
    "& > *": {
      // margin: theme.spacing(1),
      width: "25ch",
      height: "6ch",
    },
  },
});

const headCells = [
  { id: "title", numeric: false, disablePadding: true, label: "Title" },
  { id: "pid", numeric: false, disablePadding: true, label: "Age" },
];

/*
 * Note: material-ui TablePagination is zero based.
 * Nitro and therefore our old API is one based.
 */

export class Clips extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      spinner: false,
      totalRows: 0,
      rows: [],
      page: 0, // zero based current page
      rowsPerPage: 5,
      sid: "",
      type: "web",
      search: "",
      searchField: "title",
      orderBy: "title",
      order: "asc",
    };
  }

  onPageChange = (page, rowsPerPage, totalRows) => {
    this.setState({
      page,
      rowsPerPage,
      totalRows,
    });
  };

  componentDidMount = () => {
    this.setState({
      sid: this.props.sid,
      type: this.props.type,
    });
  };

  handleChange = (event) => {
    this.setState({ search: event.target.value });
  };

  componentDidUpdate(prevProps) {
    console.log(
      "Clips: %s want page %d items per page %d",
      this.props.sid,
      this.state.page,
      this.state.rowsPerPage
    );
  }

  handleSort = (cell) => {
    this.setState({
      order: this.state.order === "asc" ? "desc" : "asc",
      orderBy: cell,
    });
  };

  handleChangePage = (_event, page) => {
    this.setState({ page: parseInt(page) });
  };

  handleChangeRowsPerPage = (event) => {
    this.setState({ page: 0, rowsPerPage: parseInt(event.target.value) });
  };

  handleChangeSearchField = (event) => {
    this.setState({ searchField: event.target.value });
  }

  onPageLoaded = (_page, _rowsPerPage, totalRows) => {
    this.setState({ totalRows });
  };

  render() {
    const { classes } = this.props;
    let { rowsPerPage, page, totalRows, order, orderBy } = this.state;

    return (
      <div>
        <TextField
          className={classes.search}
          id="outlined-basic"
          label="Search"
          variant="outlined"
          onChange={this.handleChange}
          style={{ marginLeft: "5%" }}
        />
        <FormControl component="fieldset" className={classes.formControl}>
          <RadioGroup
            aria-label="mode"
            name="mode"
            value={this.state.searchField}
            onChange={this.handleChangeSearchField}
            row
          >
            <FormControlLabel
              value="title"
              control={<Radio color="primary" />}
              label="Title"
            />
            <FormControlLabel
              value="duration"
              control={<Radio color="primary" />}
              label="Duration"
            />
          </RadioGroup>
        </FormControl>
        <Paper className={classes.root}>
          <div className={classes.tableWrapper}>
            <Table className={classes.table} style={{ marginLeft: "2%" }}>
              <TableHead>
                <TableRow>
                  {headCells.map((headCell) => (
                    <TableCell
                      key={headCell.id}
                      align={headCell.numeric ? "right" : "left"}
                      padding={headCell.disablePadding ? "none" : "default"}
                      order={orderBy === headCell.id ? order : ""}
                    >
                      <TableSortLabel
                        active={orderBy === headCell.id}
                        direction={orderBy === headCell.id ? order : "desc"}
                        onClick={() => {
                          this.handleSort(headCell.id);
                        }}
                        // onClick={createSortHandler(headCell.id)}
                      >
                        {headCell.label}
                      </TableSortLabel>
                    </TableCell>
                  ))}

                  <TableCell>Duration</TableCell>
                </TableRow>
              </TableHead>
              <ClipList
                sid={this.props.sid}
                type={this.props.type}
                page={this.state.page}
                rowsPerPage={this.state.rowsPerPage}
                onPageLoaded={this.onPageLoaded}
                onAddClicked={this.props.handleClick}
                sort={orderBy}
                sort_direction={order}
                search={this.state.search}
                searchField={this.state.searchField}
                flip={this.props.flip}
              />
              <TableFooter>
                <TableRow>
                  <div style={{ marginLeft: "-7%" }}>
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
                  </div>
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
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Clips);
