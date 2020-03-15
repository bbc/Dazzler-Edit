import React from "react";
import PropTypes from "prop-types";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import moment from "moment";
import "moment-duration-format";
import AssetDao from "../AssetDaoV2";

export default function EpisodeList({
  sid,
  availability,
  page = 0,
  rowsPerPage = 5,
  onAddClicked = function() {
    console.log("add clicked");
  },
  onPageLoaded = function(page, rowsPerPage, total) {
    console.log("page changed", page, rowsPerPage, total);
  },
  sort,
  sort_direction
}) {
  const [currentPage, setCurrentPage] = React.useState(-1);
  const [currentRowsPerPage, setCurrentRowsPerPage] = React.useState(5);
  const [currentSortDirection, setcurrentSortDirection] = React.useState(
    "desc"
  );
  const [rows, setRows] = React.useState([]);

  // statements in the body of the function are called on rendering!!!

  if (
    page === currentPage &&
    rowsPerPage === currentRowsPerPage &&
    sort_direction === currentSortDirection
  ) {
    console.log("episodelist no change", page, rowsPerPage);
  } else {
    console.log("episodelist fetching", page, rowsPerPage);
    AssetDao.getEpisodes(
      sid,
      availability,
      page + 1, // nitro is one-based
      rowsPerPage,
      sort,
      sort_direction,
      (items, total) => {
        console.log("updated", items);
        console.log("got episode data for", availability);
        setRows(items);
        onPageLoaded(currentPage, currentRowsPerPage, total);
      }
    );
    setCurrentPage(page);
    setCurrentRowsPerPage(rowsPerPage);
    setcurrentSortDirection(sort_direction);
  }

  return (
    <TableBody>
      {rows.map(row => (
        <TableRow key={row.pid} className={row.insertionType}>
          <TableCell component="th" scope="row">
            <div className="tooltip">
              {" "}
              {row.title}
              <span className="tooltiptext">PID = {row.pid}</span>
            </div>
          </TableCell>
          <TableCell align="right">{row.release_date}</TableCell>
          <TableCell align="right">{
            moment.duration(row.duration).format("hh:mm:ss", { trim: false })
            }</TableCell>
          <TableCell align="right">
            <button
              className="ui compact icon button"
              onClick={() => {
                onAddClicked(row);
              }}
            >
              <i className="plus icon"></i>
            </button>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

EpisodeList.propTypes = {
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired
};
