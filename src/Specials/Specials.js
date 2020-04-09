import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { makeStyles, useTheme } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableFooter from "@material-ui/core/TableFooter";
import TablePagination from "@material-ui/core/TablePagination";
import TableRow from "@material-ui/core/TableRow";
import Paper from "@material-ui/core/Paper";
import moment from "moment";
import { TablePaginationActionsWrapped } from "../TablePaginationActions/TablePaginationActions";
import AssetDao from "../AssetDaoV1";

const useStyles = (theme) => {
  return makeStyles({
    root: {
      width: "100%",
      marginTop: theme.spacing(3),
    },
    table: {
      minWidth: 250,
    },
    tableWrapper: {
      overflowX: "hidden",
    },
  });
};

export default function Specials({
  sid = "",
  handleClick = function () {
    console.log("specials, click pressed");
  },
}) {
  const theme = useTheme();
  const classes = useStyles(theme);
  const [totalRows, setTotalRows] = useState(0);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    console.log("specials want page", page);
    AssetDao.getSpecials(sid, page, rowsPerPage, (items, total) => {
      console.log("updated specials", total, items);
      setRows(items);
      setTotalRows(total);
    });
  }, [sid, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setPage(0);
    setRowsPerPage(event.target.value);
  };

  const emptyRows =
    rowsPerPage -
    Math.min(rowsPerPage, (rows.length ? rows.length : 0) - page * rowsPerPage);

  const formattedDuration = (item) => {
    return moment.duration(item.duration).format("hh:mm:ss", { trim: false });
  };
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
              {rows.map((row) => (
                <TableRow key={row.pid}>
                  <TableCell component="th" scope="row">
                    <div className="tooltip">
                      {" "}
                      {row.title}
                      <span className="tooltiptext">PID = {row.pid}</span>
                    </div>
                  </TableCell>
                  <TableCell align="right">{formattedDuration(row)}</TableCell>
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
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </Paper>
    </div>
  );
}

Specials.propTypes = {
  sid: PropTypes.string.isRequired,
};
