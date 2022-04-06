import "./Modal.css";
import * as React from "react";
import * as ReactDOM from "react-dom";

const modalRenderTarget = document.querySelector("#modal");

interface Props {
    children: React.ReactNode;
}

const Modal = (props: Props) => ReactDOM.createPortal(props.children, modalRenderTarget);

export default Modal;
