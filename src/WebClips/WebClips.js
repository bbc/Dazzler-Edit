import Clips from "../Clips/Clips";

export class WebClips extends Clips {
  constructor(props) {
    super(props);

    this.state = {
      type = "web",
      componentName = "Web Clips",
    };
  }

export default withStyles(styles)(WebClips);
