import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Editor from "./Editor/Editor";
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<Editor />, document.querySelector("#root"));

//serviceWorker.unregister();
serviceWorker.register();
