import React from "react";
import Button from "@material-ui/core/Button";
import { withStyles } from "@material-ui/core/styles";
import moment from "moment";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import {
  FaAngleDoubleRight,
  FaAngleDoubleLeft,
  FaMinus,
  FaPlus,
} from "react-icons/fa";

export const styles = (theme) => ({
  root: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    // margin: "auto",
    margin: "0%",
    textAlign: "center",
    width: "50%",
    fontSize: "84%",
  },
  button: {
    margin: theme.spacing(1),
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    width: "1%",
    fontSize: "84%",
  },
  buttonDuration: {
    margin: theme.spacing(0),
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
    width: "1%",
    fontSize: "84%",
  },
  icon: {
    display: "flex",
    flexDirection: "column",
    "& > *": {
      marginBottom: theme.spacing(2),
    },
    "& .MuiBadge-root": {
      marginRight: theme.spacing(4),
    },
  },
});

var start = moment();
var end = moment();
start.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
end.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });

class Date extends React.Component {
  constructor() {
    super();
    this.state = {
      current: moment().startOf("day"),
      from: start,
      to: end,
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(days) {
    const next = moment(this.state.current).add(days, "days");
    this.setState({ current: next });
    return next.format("LL");
  }

  render() {
    console.log("time", moment.utc("00:00"));
    const { classes } = this.props;
    // const { hour } = this.state;
    let { from, to } = this.props;
    return (
      <div className={classes.root}>
        <Button
          className={classes.button}
          variant="outlined"
          onClick={() => {
            this.props.handleDayFrom("back");
          }}
        >
          <FaAngleDoubleLeft />
        </Button>
        {moment(from).format("DD/MM/YYYY")}
        <Button
          className={classes.button}
          variant="outlined"
          onClick={() => {
            this.props.handleDayFrom("forward");
          }}
        >
          <FaAngleDoubleRight />
        </Button>
        {/* comment */}
        {/* <Button
          className={classes.button}
          disabled={!this.props.enabled}
          variant="outlined"
          onClick={() => {
            this.props.previousDay(this.handleClick(-1));
          }}
        >
          <FaArrowLeft />
        </Button> */}
        {/* uncomment */}
        <ButtonGroup>
          <Button
            className={classes.buttonDuration}
            variant="outlined"
            onClick={() => {
              this.props.handleFrom("back");
            }}
          >
            <FaMinus />
          </Button>
        </ButtonGroup>
        {moment(from).format("HH:mm")}
        <ButtonGroup>
          <Button
            className={classes.buttonDuration}
            variant="outlined"
            onClick={() => {
              this.props.handleFrom("forward");
            }}
          >
            <FaPlus />
          </Button>
        </ButtonGroup>
        {/* <Typography> */} {moment(from).format("DD/MM")} To{" "}
        {moment(to).format("DD/MM")} {/* </Typography> */}
        <ButtonGroup>
          <Button
            className={classes.buttonDuration}
            variant="outlined"
            onClick={() => {
              this.props.handleTo("back");
            }}
          >
            <FaMinus />
          </Button>
        </ButtonGroup>
        {moment(to).format("HH:mm")}
        <ButtonGroup>
          <Button
            className={classes.buttonDuration}
            variant="outlined"
            onClick={() => {
              this.props.handleTo("forward");
            }}
          >
            <FaPlus />
          </Button>
        </ButtonGroup>
        {/* comment */}
        {/* <Button
          className={classes.button}
          disabled={!this.props.enabled}
          variant="outlined"
          onClick={() => {
            this.props.nextDay(this.handleClick(1));
          }}
        >
          <FaArrowRight />
        </Button> */}
        {/* uncomment */}
        <Button
          className={classes.button}
          variant="outlined"
          onClick={() => {
            this.props.handleDayTo("back");
          }}
        >
          <FaAngleDoubleLeft />
        </Button>
        {moment(to).format("DD/MM/YYYY")}
        <Button
          className={classes.button}
          variant="outlined"
          onClick={() => {
            this.props.handleDayTo("forward");
          }}
        >
          <FaAngleDoubleRight />
        </Button>
      </div>
    );
  }
}
export default withStyles(styles)(Date);
