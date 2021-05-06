import React, { useState } from "react";
import ExpansionPanel from "@material-ui/core/ExpansionPanel";
import FormControl from "@material-ui/core/FormControl";
import ExpansionPanelSummary from "@material-ui/core/ExpansionPanelSummary";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import Typography from "@material-ui/core/Typography";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import moment from "moment";
import "moment-duration-format";
import Episode from "../Episode/Episode";
import Live from "../Live";
import Clips from "../Clips/Clips";
import Specials from "../Specials/Specials";
import Refresh from "../Refresh";

export default function PickLists({classes, side, sid, date, pasteIntoSchedule, pasteIntoLoop, handleAddLive, handleRefresh}) {

    const [useLoop, setUseLoop] = useState(true);

  // available episodes need to be available.
  // this is for simplicity
  // available episodes need to be still available by the end of the day being scheduled
  // we might relax this in future if we have short availability episodes we want to schedule
  // early in the selected day
  // or we could make it the middle of the day but then we should disable episodes depending
  // on where the cursor is.
  // but paste to fill assumes availability goes to the end of the current day!
  // upcoming episodes need a start of availability in the near future, ideally by the cursor
  // upcoming episodes need to be still available to the end of the day being scheduled

  const mustBeAvailableBy = moment.utc().format();
  const mustBeAvailableUntil = moment
      .utc(date)
      .add(1, "d")
      .format();
  const upcomingMustBeAvailableBy = mustBeAvailableUntil;
  const upcomingMustBeAvailableUntil = moment
      .utc(upcomingMustBeAvailableBy)
      .add(1, "d")
      .format();
    
    const handleAddClipOrEpisode = (item) => {
        if (useLoop) {
            pasteIntoLoop(item);
        } else {
            pasteIntoSchedule(item);
        }
    }

    const changeMode = (event) => {
        setUseLoop(event.target.value==="true");
    }

    return (
        <>
            <FormControl component="fieldset" className={classes.formControl}>
                <FormLabel component="legend">Add non-live to</FormLabel>
                <RadioGroup
                  aria-label="mode"
                  name="mode"
                  value={useLoop}
                  onChange={changeMode}
                  row
                >
                  <FormControlLabel
                    value={true}
                    control={<Radio color="primary" />}
                    label="Loop"
                  />
                  <FormControlLabel
                    value={false}
                    control={<Radio color="primary" />}
                    label="Schedule"
                  />
                  <Refresh
                    buttonClass={classes.button}
                    onRefresh={handleRefresh}
                  />
                </RadioGroup>
              </FormControl>

              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel1bh-content"
                  id="panel1bh-header"
                >
                  <Typography className={classes.heading}>Live</Typography>
                </ExpansionPanelSummary>

                <Live
                  flip={side}
                  date={date}
                  sid={sid}
                  handleClick={handleAddLive}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>
                    Available Episodes
                  </Typography>
                </ExpansionPanelSummary>

                <Episode
                  flip={side}
                  availability={"available"}
                  mustBeAvailableBy={mustBeAvailableBy}
                  mustBeAvailableUntil={mustBeAvailableUntil}
                  sid={sid}
                  handleClick={handleAddClipOrEpisode}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel2bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>
                    Upcoming Episodes
                  </Typography>
                </ExpansionPanelSummary>

                <Episode
                  flip={side}
                  availability={"P1D"}
                  mustBeAvailableBy={upcomingMustBeAvailableBy}
                  mustBeAvailableUntil={upcomingMustBeAvailableUntil}
                  sid={sid}
                  handleClick={handleAddClipOrEpisode}
                  // resultsFilter={this.filterUpcomingEpisodes}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel4bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>Web Clips</Typography>
                </ExpansionPanelSummary>

                <Clips
                  flip={side}
                  type="web"
                  sid={sid}
                  handleClick={handleAddClipOrEpisode}
                />
              </ExpansionPanel>
              <ExpansionPanel>
                <ExpansionPanelSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="panel5bh-content"
                  id="panel2bh-header"
                >
                  <Typography className={classes.heading}>Specials</Typography>
                </ExpansionPanelSummary>
                <Specials
                  sid={sid}
                  handleClick={handleAddClipOrEpisode}
                />
              </ExpansionPanel>
        </>
    );
}