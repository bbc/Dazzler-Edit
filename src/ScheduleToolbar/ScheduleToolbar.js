import React from "react";

/*
  <ScheduleToolbar saveEnabled=true|false onSaveClicked={function}
  />
*/
class ScheduleToolbar extends React.Component {
    constructor(props) {
        super(props);
    
        this.state = {
            status: 'Save Playlist'
        };
    }

    render() {
    
        let saveButtonAppearance = "ui right floated small primary labeled icon button disabled";
        if(this.props.saveEnabled) {
          saveButtonAppearance = "ui right floated small primary labeled icon button";
        }
        /*
        savePlaylist: "ui right floated small primary labeled icon button",
            savePlaylist: "ui right floated primary loading button"
                savePlaylist: "ui right floated positive button active"
        */
    
        return (
            <div className={saveButtonAppearance} onClick={this.props.onSaveClicked}>
            {this.state.status}
            </div>
        );
    }
}
export default ScheduleToolbar;
    
