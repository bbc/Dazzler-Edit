import React from "react";
import Button from '@material-ui/core/Button';
import { withStyles } from "@material-ui/core/styles";
import moment from "moment";
import { Typography } from "@material-ui/core";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa";

export const styles = theme => ({
  root: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    margin: 'auto',
    textAlign: 'center',
    width: '50%'
  },
  button: {
    margin: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    width: '1%'
  },
});

class Date extends React.Component {
  constructor() {
    super();
    this.state = {
      current: moment().startOf('day')
    };
    this.handleClick = this.handleClick.bind(this);
  }

  handleClick(days) {
    const next = moment(this.state.current).add(days, 'days');
    this.setState({current: next})
    return next.format("LL");
  }

  render() {
    const { classes } = this.props;
    return (
      <div className={classes.root}>
        <Button className={classes.button} disabled={!this.props.enabled} variant='outlined'
          onClick={() => {
            this.props.previousDay(this.handleClick(-1));
          }}
        >
        <FaArrowLeft/>
        </Button>
          <Typography>{this.props.scheduleDate}</Typography>
        <Button className={classes.button} disabled={!this.props.enabled} variant='outlined'
          onClick={() => {
            this.props.nextDay(this.handleClick(1));
          }}
        >
        <FaArrowRight/>
        </Button>
      </div>
    );
  }
}
export default withStyles(styles)(Date);
