import React /*, { Fragment }*/ from "react";
import Box from "@material-ui/core/Box";
import ReactDataGrid from "react-data-grid";
import moment from "moment";
import "moment-duration-format";
// import { cloneDeep } from "lodash-es";
import { Typography } from "@material-ui/core";
import { backupPlaylist } from "../LoopDao/LoopDao";
import Fade from "@material-ui/core/Fade";
import CircularProgress from "@material-ui/core/CircularProgress";

const durationFormatter = ({ value }) => {
  return moment.duration(value).format("hh:mm:ss", { trim: false });
};

const columns = [
  { key: "title", name: "Title", width: 200 },
  {
    key: "duration",
    name: "Duration",
    width: 80,
    formatter: durationFormatter,
  },
  { key: "action", name: "Action", width: 80 },
];

class Loop extends React.Component {
  constructor(props) {
    super(props);
    this.pasteToFill = this.pasteToFill.bind(this);
    this.emergencyPlaylist = this.emergencyPlaylist.bind(this);
    this.state = {
      loopModified: "Set as Emergency Content",
      saving: "idle",
    };
  }

  pasteToFill() {
    if (this.props.data.length === 0) return;
    const repetitions = Math.floor(this.props.timeToFill / this.props.duration);
    //console.log('pasteToFill', repetitions);
    let n = JSON.parse(JSON.stringify(this.props.data));
    // cloneDeep(this.props.data);
    switch (n.length) {
      case 1:
        n[0].insertionType = "";
        break;
      case 2:
        n[0].insertionType = "loopStart";
        n[n.length - 1].insertionType = "loopEnd";
        break;
      default:
        n[0].insertionType = "loopStart";
        n[n.length - 1].insertionType = "loopEnd";
        for (let i = 1; i < n.length - 1; i++) n[i].insertionType = "midLoop";
    }
    let m = n;
    let count = repetitions;
    while (count > 1) {
      m = m.concat(JSON.parse(JSON.stringify(n)));
      count--;
    }
    // now we want to eliminate the gap. Overlap is OK
    const loopDuration = this.props.duration.asMilliseconds();
    const ttf = this.props.timeToFill.asMilliseconds();
    let remaining = ttf - repetitions * loopDuration;
    //console.log("loop %d ttf %d loop*n %d", loopDuration, ttf, loopDuration*repetitions)
    //console.log('remaining milliseconds', remaining);
    let i = 0;
    while (remaining > 0) {
      m.push(n[i]);
      const d = moment.duration(n[i].duration).asMilliseconds();
      //console.log('loop', remaining, d);
      remaining -= d;
      i++;
      if (i >= n.length) i = 0;
    }
    //console.log('remaining milliseconds after', remaining);
    this.props.onPaste(m);
  }
  emergencyPlaylist() {
    const This = this; // closure for callback - How does this fix it?
    this.setState({ saving: "progress" });
    try {
      backupPlaylist(this.props.data, function () {
        This.setState({ loopModified: "Saved", saving: "idle" });
      });
    } catch (err) {
      this.setState({ saving: "idle" });
      console.log(err);
      alert("Cannot save backup schedule");
    }
  }

  componentDidUpdate(prevProps) {
    if (prevProps.data !== this.props.data) {
      this.setState({ loopModified: "Set as Emergency Content" });
    }
  }

  render() {
    let { saving } = this.state;
    const d = this.props.data.length === 0;
    return (
      <div style={{ width: "100%" }}>
        <Box>
          <Box display="flex" flexDirection="row">
            <Box width="50%">
              <Typography>
                Duration:&nbsp;
                {this.props.duration.format("HH:mm:ss", { trim: false })}
              </Typography>
            </Box>
            <Box width="50%">
              <Typography>
                Time to fill:&nbsp;
                {this.props.timeToFill.format("HH:mm:ss", { trim: false })}
              </Typography>
            </Box>
          </Box>
          <ReactDataGrid
            columns={columns}
            rowGetter={(i) => {
              const item = { ...this.props.data[i], index: i };
              return item;
            }}
            rowsCount={this.props.data.length}
            enableCellSelect={true}
            getCellActions={this.getCellActions}
            minHeight={300}
          />
          <Box display="flex" flexDirection="row" flexGrow={1}>
            <button
              disabled={d}
              className="ui primary button"
              onClick={this.props.onClear}
            >
              <i className="trash icon">
                <Typography>Clear</Typography>
              </i>
            </button>
            <button
              disabled={d}
              className="ui primary button"
              onClick={() => {
                if (this.props.data.length > 0) {
                  this.props.onPaste(this.props.data);
                }
              }}
            >
              <Typography>Paste</Typography>
            </button>
            <button
              disabled={d}
              className="ui primary button"
              onClick={this.pasteToFill}
            >
              <Typography>Paste to Fill</Typography>
            </button>

            <button
              disabled={d}
              className="ui primary button"
              onClick={this.props.onSave}
            >
              <Typography>Save Loop</Typography>
            </button>

            <button disabled={!d} className="ui primary button">
              <input
                type="file"
                name="file"
                id="files"
                style={{ display: "none" }}
                onChange={(e) => {
                  this.props.onUpload(e);
                }}
              />
              <label htmlFor="files">
                <i className="upload icon"></i>
                <Typography>Upload Loop </Typography>
              </label>
            </button>
          </Box>
        </Box>
        <br />

        <button
          disabled={d}
          className="fluid ui button ui primary button"
          onClick={this.emergencyPlaylist}
        >
          <i className="save icon"></i>
          <Typography>{this.state.loopModified}</Typography>
        </button>

        {saving === "success" ? (
          ""
        ) : (
          <Fade
            in={saving === "progress"}
            style={{
              transitionDelay: saving === "progress" ? "800ms" : "0ms",
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        )}
      </div>
    );
  }

  getCellActions = (column, row) => {
    const cellActions = [
      {
        icon: <i className="trash alternate outline icon"></i>,
        callback: () => {
          this.props.onDelete(row.index);
        },
      },
    ];
    return column.key === "action" ? cellActions : null;
  };
}
export default Loop;
