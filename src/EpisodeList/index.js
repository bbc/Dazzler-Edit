import React, { useState, useEffect } from "react";
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
  mustBeAvailableBy,
  mustBeAvailableUntil,
  page = 0,
  rowsPerPage = 5,
  sort = 'title',
  sortDirection = 'desc',
  flip = false,
  onAddClicked = function() {
    console.log("add clicked");
  },
  onPageLoaded = function(page, rowsPerPage, total) {
    console.log("page changed", page, rowsPerPage, total);
  }
}) {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentRowsPerPage, setCurrentRowsPerPage] = useState(5);
  const [currentSortDirection, setcurrentSortDirection] = useState("desc");
  const [rows, setRows] = useState([]);
  const [side, setSide] = useState(true);

  useEffect(() => {
    window.addEventListener("message", (event) => {
      console.log(event);
    }, false);
  }, []); // run once

  // statements in the body of the function are called on rendering!!!

  if (
    flip === side
    && page === currentPage
    && rowsPerPage === currentRowsPerPage
    && sortDirection === currentSortDirection
  ) {
    console.log("episodelist no change", page, rowsPerPage);
  } else {
    console.log("episodelist fetching", page, rowsPerPage);
    AssetDao.getEpisodes(
      sid,
      availability,
      mustBeAvailableBy,
      mustBeAvailableUntil,
      page + 1, // nitro is one-based
      rowsPerPage,
      sort,
      sortDirection,
      (items, total) => {
        console.log('got', items.length, 'episodes for', mustBeAvailableBy, 'until', mustBeAvailableUntil);
        setRows(items);
        onPageLoaded(currentPage, currentRowsPerPage, total);
      }
    );
    setCurrentPage(page);
    setCurrentRowsPerPage(rowsPerPage);
    setcurrentSortDirection(sortDirection);
    setSide(flip);
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
