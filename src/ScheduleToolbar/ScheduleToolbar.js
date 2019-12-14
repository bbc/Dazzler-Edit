import React from "react";
import PropTypes from "prop-types";
import { Typography } from "@material-ui/core";

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
            <button className={saveButtonAppearance} onClick={this.props.onSaveClicked}>
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
    
