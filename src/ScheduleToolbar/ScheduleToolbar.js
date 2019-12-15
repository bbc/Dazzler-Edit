import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@material-ui/core";
import { makeStyles } from '@material-ui/core/styles';
import Fade from '@material-ui/core/Fade';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const useStyles = makeStyles(theme => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  button: {
    margin: theme.spacing(2),
  },
  placeholder: {
    height: 40,
  },
}));

export default function DelayingAppearance() {
  const classes = useStyles();
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('idle');
  const timerRef = React.useRef();

  React.useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClickLoading = () => {
    setLoading(prevLoading => !prevLoading);
  };

  const handleClickQuery = () => {
    clearTimeout(timerRef.current);

    if (query !== 'idle') {
      setQuery('idle');
      return;
    }

    setQuery('progress');
    timerRef.current = setTimeout(() => {
      setQuery('success');
    }, 2000);
  };

  return (
    <div className={classes.root}>
      <div className={classes.placeholder}>
        <Fade
          in={loading}
          style={{
            transitionDelay: loading ? '800ms' : '0ms',
          }}
          unmountOnExit
        >
          <CircularProgress />
        </Fade>
      </div>
      <Button onClick={handleClickLoading} className={classes.button}>
        {loading ? 'Stop loading' : 'Loading'}
      </Button>
      <div className={classes.placeholder}>
        {query === 'success' ? (
          <Typography>Success!</Typography>
        ) : (
          <Fade
            in={query === 'progress'}
            style={{
              transitionDelay: query === 'progress' ? '800ms' : '0ms',
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        )}
      </div>
      <Button onClick={handleClickQuery} className={classes.button}>
        {query !== 'idle' ? 'Reset' : 'Simulate a load'}
      </Button>
    </div>
  );
}









/*
  <ScheduleToolbar saveEnabled=true|false onSaveClicked={function}
  />
*/
class ScheduleToolbar extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
        };
    }

    render() {
        let clearButtonAppearance = "ui small primary button disabled"
        let saveButtonAppearance = "ui right floated small primary button disabled";
        if(this.props.saveEnabled) {
          saveButtonAppearance = "ui right floated small primary button";
        }
        if(this.props.resetEnabled) {
          clearButtonAppearance = "ui small primary button"
        }
        /*
        savePlaylist: "ui right floated small primary labeled icon button",
            savePlaylist: "ui right floated primary loading button"
                savePlaylist: "ui right floated positive button active"
        */
    
        return (
            <div>
            <button className={clearButtonAppearance} onClick={this.props.onClear}>
          <Typography>Clear</Typography>
          </button>
          <button className="ui small primary button" onClick={this.props.onReload}>
          <Typography>Reload</Typography>
          </button>
            <button className={saveButtonAppearance} onClick={this.props.onSave}>
            <Typography>Save</Typography>
            </button>
            </div>
        );
    }
}
ScheduleToolbar.propTypes = {
  saveEnabled: PropTypes.bool.isRequired,
  resetEnabled: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired
};
export default ScheduleToolbar;
    
