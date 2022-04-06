import "./ModalBackground.css";
import * as React from "react";

interface Props {
    children: React.ReactNode;
    onClick: () => void;
}

const ModalBackground = (props: Props) => {
    const handleClick = React.useCallback((event: React.MouseEvent) => {
        if (event.target === event.currentTarget) {
            props.onClick();
        }
    }, [props.onClick]);

    return (
        <div className="modal-background" onClick={handleClick}>{props.children}</div>
    );
};

export default ModalBackground;
