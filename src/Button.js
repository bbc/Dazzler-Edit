import React from "react";
class Button extends React.Component {
  state = {
    disabled: false
  };

  handleClick = () => {
    //this.setState({ disabled: !this.state.disabled });
  };

  render() {
    return (
      <div>
        <button onClick={this.handleClick}>First Button</button>
        <button disabled={this.disabled}>Second Button</button>
      </div>
    );
  }
}
export default Button;
