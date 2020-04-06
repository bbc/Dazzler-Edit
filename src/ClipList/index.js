import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment-duration-format";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import AssetDao from "../AssetDaoV2";

export default function ClipList({
  sid,
  type,
  page = 0,
  rowsPerPage = 5,
  onAddClicked = function () {
    console.log("add clicked");
  },
  onPageLoaded = function (page, rowsPerPage, total) {
    console.log("page changed", page, rowsPerPage, total);
  },
  sort = "title",
  sort_direction = "desc",
  flip = false,
  search,
}) {
  const [currentPage, setCurrentPage] = React.useState(-1);
  const [currentRowsPerPage, setCurrentRowsPerPage] = React.useState(5);
  const [currentType, setcurrentType] = React.useState("web");
  const [currentSearch, setCurrentSearch] = React.useState("");
  const [currentSortDirection, setcurrentSortDirection] = React.useState(
    "desc"
  );
  const [rows, setRows] = React.useState([]);
  const [side, setSide] = React.useState(true);

  // statements in the body of the function are called on rendering!!!

  if (
    flip === side &&
    page === currentPage &&
    rowsPerPage === currentRowsPerPage &&
    sort_direction === currentSortDirection &&
    type === currentType &&
    search == currentSearch
  ) {
    console.log("cliplist no change", page, rowsPerPage);
  } else {
    console.log("cliplist fetching", page, rowsPerPage);

    AssetDao.getClips(
      sid,
      type,
      page + 1, // nitro is one-based
      rowsPerPage,
      sort,
      sort_direction,
      (items, total) => {
        console.log("ITEMS IS", items);
        console.log("got clip data for", type, total, items);
        setRows(items);
        onPageLoaded(currentPage, currentRowsPerPage, total);
      },
      search
    );
    setCurrentPage(page);
    setCurrentRowsPerPage(rowsPerPage);
    setcurrentSortDirection(sort_direction);
    setCurrentSearch(search);
    setSide(flip);
    setcurrentType(type);
  }

  return (
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.pid} className={row.insertionType}>
          <TableCell component="th" scope="row">
            <div className="tooltip">
              {row.title} + !
              <span className="tooltiptext">PID = {row.pid}</span>
            </div>
          </TableCell>
          <TableCell align="center">
            {moment(row.last_modified).format("DD-MM-YYYY")}
          </TableCell>
          <TableCell align="center">
            {moment.duration(row.duration).format("hh:mm:ss", { trim: false })}
          </TableCell>
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

ClipList.propTypes = {
  page: PropTypes.number.isRequired,
  rowsPerPage: PropTypes.number.isRequired,
};
