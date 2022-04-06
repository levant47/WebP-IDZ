import * as React from "react";

export const useModalState = (): [boolean, () => void, () => void] => {
    const [isShowingModal, setIsShowingModal] = React.useState(false);
    const showModal = React.useCallback(() => {
        setIsShowingModal(true);
    }, []);
    const hideModal = React.useCallback(() => {
        setIsShowingModal(false);
    }, []);
    return [isShowingModal, showModal, hideModal];
};
