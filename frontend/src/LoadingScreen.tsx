import "./LoadingScreen.css";
import * as React from "react";
import * as ReactDOM from "react-dom";

const LoadingScreen = () => ReactDOM.createPortal(
    <div className="background">
        <div className="spinner" />
    </div>,
    document.querySelector("#loading-screen")
);

export default LoadingScreen;
