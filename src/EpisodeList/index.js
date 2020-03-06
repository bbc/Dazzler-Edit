import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import "moment-duration-format";
import TableBody from "@material-ui/core/TableBody";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import AssetDao from "../AssetDao/AssetDao";
import Fade from "@material-ui/core/Fade";
import CircularProgress from "@material-ui/core/CircularProgress";

function formattedDuration(clip) {
    const duration = moment.duration(
      clip.available_versions.version[0].duration
    );
    return duration.format("hh:mm:ss", { trim: false });
}

export default function EpisodeList({
  sid,
  availability,
  page = 0,
  rowsPerPage=5,
  onAddClicked = function() {
    console.log('add clicked');
  },
  onPageLoaded = function(page, rowsPerPage, total) {
    console.log("page changed", page, rowsPerPage, total);
  }
}) {
  const [currentPage, setCurrentPage] = React.useState(-1);
  const [currentRowsPerPage, setCurrentRowsPerPage] = React.useState(5);
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState("idle");

  // statements in the body of the function are called on rendering!!!

  if(page === currentPage && rowsPerPage === currentRowsPerPage) {
    console.log("episodelist no change", page, rowsPerPage);
  } else {
    console.log("episodelist fetching", page, rowsPerPage);
    setLoading("progress");
    AssetDao.getEpisodes(
        sid,
        availability,
        page + 1, // nitro is one-based
        rowsPerPage,
        response => {
            let items = response.data.items;
            console.log("updated", items);
            let total = response.data.total;
            console.log("got episode data for", availability);
            setRows(items);
            onPageLoaded(currentPage, currentRowsPerPage, total);
            setLoading("idle");
        }
    );
    setCurrentPage(page);
    setCurrentRowsPerPage(rowsPerPage);
  }

  return (
    <div>
    <Fade in={loading === "progress"}
          style={{
            transitionDelay: loading === "progress" ? "800ms" : "0ms"
          }}
          unmountOnExit
        >
          <CircularProgress />
        </Fade>
    <TableBody>
    {rows.map(row => (
        <TableRow key={row.pid} className={row.insertionType}>
        <TableCell component="th" scope="row">
            <div className="tooltip">
            {" "}
            {row.title === undefined
                ? row.presentation_title
                : row.title}
            <span className="tooltiptext">PID = {row.pid}</span>
            </div>
        </TableCell>
        <TableCell align="right">
            {formattedDuration(row)}
        </TableCell>
        <TableCell align="right">
          <button className="ui compact icon button"
            onClick={() => {onAddClicked(AssetDao.episode2Item(row));} }
          >
            <i className="plus icon"></i>
          </button>
        </TableCell>
      </TableRow>
    ))}
    </TableBody>
    </div>
  );
}

EpisodeList.propTypes = {
  page: PropTypes.func.isRequired,
  rowsPerPage: PropTypes.func.isRequired
};