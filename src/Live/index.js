import React, { useState, useEffect } from "react";
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
import AssetDao from "../AssetDaoV1";

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
});

function Live ({ sid, date, handleClick, classes }) {

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalRows, setTotalRows] = useState(0);

  useEffect(() => {
    AssetDao.fetchWebcasts(
      sid,
      moment(date).utc().format(),
      moment(date).utc().add(1, "days").format(),
      page,
      rowsPerPage,
      (items, totalRows) => {
          setRows(items);
          setTotalRows(totalRows);
          setPage(page);
      }
    );
  });

  const handleChangePage = (event, page) => {
    setPage(page);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(event.target.value);
  };

  const formattedDuration = (item) => {
    return moment.duration(item.duration).format("hh:mm:ss", { trim: false });
  }

  let emptyRows = 0;
  if (rows.length < rowsPerPage) {
    emptyRows = rowsPerPage - rows.length;
  }

  return (
    <div style={{ marginLeft: "5%" }}>
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
              {rows.map((row) => (
                <TableRow key={row.pid}>
                  <TableCell component="th" scope="row">
                    <div className="tooltip">
                      {" "}
                      {row.title === undefined
                        ? row.presentation_title
                        : row.title}
                      <span className="tooltiptext">
                        {"PID = " + (row.pid ? row.pid.trim() : "")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell align="right">
                    {formattedDuration(row)}
                  </TableCell>
                  <TableCell align="right">
                    <button
                      className="ui compact icon button"
                      onClick={() => {
                        handleClick(row);
                      }}
                    >
                      <i className="plus icon"></i>
                    </button>
                  </TableCell>
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
                <div style={{ marginLeft: "-7%" }}>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    colSpan={3}
                    count={totalRows}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    SelectProps={{
                      native: true,
                    }}
                    onChangePage={handleChangePage}
                    onChangeRowsPerPage={handleChangeRowsPerPage}
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

Live.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Live);
