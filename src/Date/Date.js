import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import moment from "moment";
import MenuItem from "@material-ui/core/MenuItem";
import Select from "@material-ui/core/Select";
import { Typography } from "@material-ui/core";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export const styles = (theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    margin: "auto",
    textAlign: "center",
    width: "50%",
  },
  button: {
    margin: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    width: "1%",
  },
});

const hours = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
];

class Date extends React.Component {
  constructor() {
    super();
    this.state = {
      current: moment().startOf("day"),
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(days) {
    const next = moment(this.state.current).add(days, "days");
    this.setState({ current: next });
    return next.format("LL");
  }

  render() {
    const { classes } = this.props;
    const { hour } = this.state;
    return (
      <div className={classes.root}>
        <Button
          className={classes.button}
          disabled={!this.props.enabled}
          variant="outlined"
          onClick={() => {
            this.props.previousDay(this.handleClick(-1));
          }}
        >
          <FaArrowLeft />
        </Button>
        <Select
          labelId="demo-simple-select-label"
          id="demo-simple-select"
          value={this.props.from}
          onChange={this.props.handleTimeChange}
        >
          {hours.map((item) => {
            return <MenuItem value={item}>{item}</MenuItem>;
          })}
        </Select>
        <Typography>{this.props.scheduleDate}</Typography>
        <Button
          className={classes.button}
          disabled={!this.props.enabled}
          variant="outlined"
          onClick={() => {
            this.props.nextDay(this.handleClick(1));
          }}
        >
          <FaArrowRight />
        </Button>
      </div>
    );
  }
}
export default withStyles(styles)(Date);
