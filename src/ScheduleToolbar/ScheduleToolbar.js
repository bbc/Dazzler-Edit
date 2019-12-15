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
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  button: {
    margin: theme.spacing(2),
  },
  placeholder: {
    height: 40,
  },
}));

export default function ScheduleToolbar(
  { 
    saveEnabled=false, contentModified=false, 
    onSave=function(){console.log('save pressed');}, 
    onClear=function(){console.log('clear pressed');}, 
    onReload=function(){console.log('reload pressed');}
  }
) {
  const classes = useStyles();
  const [clear, setClear] = React.useState(false);
  const [reload, setReload] = React.useState('idle');
  const [saving, setSaving] = React.useState('idle');
  const timerRef = React.useRef();

  React.useEffect(
    () => () => {
      clearTimeout(timerRef.current);
    },
    [],
  );

  const handleClickClear = () => {
    setClear(true);
    onClear();
    setClear(false);
  }

  const handleClickReload = () => {
    setReload('progress')
    onReload();
  }

  const handleClickSave = () => {
    setSaving('progress');
    onSave();
  };

  // statements in the body of the function are called on rendering!!!
  console.log('saving', contentModified, saving, typeof saving);

  if(reload !== 'idle' && !contentModified ) {
    setReload('idle');
  }

  if((saving === 'progress' && !contentModified)) {
    console.log('success - setting timer');
    setSaving('success');
    timerRef.current = setTimeout(() => {
      setSaving('idle');
    }, 2000);
  }

  return (
    <div className={classes.root}>
      <div className={classes.placeholder}>
        <Button disabled={!contentModified} variant='outlined' onClick={handleClickClear} className={classes.button}>
          {clear?'Clearing':'Clear'}
        </Button>
      </div>
      <div className={classes.placeholder}>
        <Fade
          in={reload === 'progress'}
          style={{
            transitionDelay: reload === 'progress' ? '800ms' : '0ms',
          }}
          unmountOnExit
        >
          <CircularProgress />
        </Fade>
        <Button variant='outlined' onClick={handleClickReload} className={classes.button}>
          {reload !== 'idle' ? 'Loading' : 'Reload'}
        </Button>
      </div>
      <div className={classes.placeholder}>
        {saving === 'success' ? (
          ''
        ) : (
          <Fade
            in={saving === 'progress'}
            style={{
              transitionDelay: saving === 'progress' ? '800ms' : '0ms',
            }}
            unmountOnExit
          >
            <CircularProgress />
          </Fade>
        )}
      </div>
      <Button disabled={(!contentModified)||(!saveEnabled)} color='primary' variant='contained' onClick={handleClickSave} className={classes.button}>
        {(saving === 'idle')? 'Save':(saving==='progress')?'Saving':'Saved'}
      </Button>
    </div>
  );
}

ScheduleToolbar.propTypes = {
  saveEnabled: PropTypes.bool.isRequired,
  contentModified: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  onReload: PropTypes.func.isRequired
};
