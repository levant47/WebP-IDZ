import "./EditTicketStatusesModal.css";
import * as React from "react";
import { TicketStatusEditVm, TicketStatusMassEditVm, TicketStatusVm, TicketStatusCreateVm } from "../models/ticket-status";
import Modal from "./Modal";
import ModalBackground from "./ModalBackground";
import LoadingScreen from "../LoadingScreen";
import { fetchBackend } from "../comm";
import { projectionComparator } from "../algorithms/sorting";
import { ArrowUpIcon, ArrowDownIcon, CrossIcon, PlusIcon } from "../icons";

let nextVirtualId: number = -1;

interface VirtualTicketStatusCreateVm extends TicketStatusCreateVm {
    virtualId: number;
}

interface Props {
    hide: () => void;
    projectId: number;
    ticketStatuses: TicketStatusVm[];
    onTicketStatusesUpdated: (updatedTicketStatuses: TicketStatusVm[]) => void;
}

const EditTicketStatusesModal = (props: Props) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [changes, setChanges] = React.useState<{[id: number]: TicketStatusEditVm}>({});
    const [deletedIds, setDeletedStatusIds] = React.useState<number[]>([]);
    const [newStatuses, setNewStatuses] = React.useState<VirtualTicketStatusCreateVm[]>([]);
    const [newStatusName, setNewStatusName] = React.useState("");

    const statusesToRender = React.useMemo(() =>
        (props.ticketStatuses
            .filter(status => !deletedIds.includes(status.id))
            .map(status => ({
                ...status,
                ...changes[status.id],
            })) as Array<TicketStatusVm | VirtualTicketStatusCreateVm>)
            .concat(...newStatuses)
    , [props.ticketStatuses, changes, deletedIds, newStatuses]);

    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const newName = event.currentTarget.value;
        const isVirtual = event.currentTarget.parentElement.dataset.isVirtual === "true";
        if (isVirtual) {
            const targetVirtualId = Number(event.currentTarget.parentElement.dataset.virtualId);
            setNewStatuses(prevNewStatuses => prevNewStatuses.map(newStatus =>
                newStatus.virtualId === targetVirtualId
                    ? {...newStatus, name: newName}
                    : newStatus));
        } else {
            const ticketStatusId = Number(event.currentTarget.parentElement.dataset.id);
            setChanges(prevChanges => ({
                ...prevChanges,
                [ticketStatusId]: {
                    ...prevChanges[ticketStatusId],
                    name: newName,
                },
            }));
        }
    }, []);

    const handleArrowUpClick = React.useCallback((event: React.MouseEvent) => {
        const isVirtual = event.currentTarget.parentElement.dataset.isVirtual === "true";
        const targetStatusId = Number(event.currentTarget.parentElement.dataset.id);
        const targetStatusOrder = Number(event.currentTarget.parentElement.dataset.order);
        if (targetStatusOrder === 0) {
            return; // can't move the status any higher
        }
        setChanges(prevChanges => {
            const result = {...prevChanges};
            if (!isVirtual) {
                if (!(targetStatusId in result)) {
                    result[targetStatusId] = {};
                }
                result[targetStatusId].order = targetStatusOrder - 1;
            }
            const earlierStatusId = props.ticketStatuses
                .find(status => (prevChanges[status.id]?.order ?? status.order) === targetStatusOrder - 1 && status.id !== targetStatusId)
                ?.id;
            if (earlierStatusId !== undefined) { // previous status is a new one that hasn't been commited to the database yet
                if (!(earlierStatusId in result)) {
                    result[earlierStatusId] = {};
                }
                result[earlierStatusId].order = targetStatusOrder;
            }
            return result;
        });
        setNewStatuses(prevNewStatuses => prevNewStatuses.map(status => {
            if (status.order === targetStatusOrder - 1) {
                return {...status, order: targetStatusOrder};
            } else if (status.order === targetStatusOrder) {
                return {...status, order: targetStatusOrder - 1};
            } else {
                return status;
            }
        }));
    }, [props.ticketStatuses]);

    const handleArrowDownClick = React.useCallback((event: React.MouseEvent) => {
        const isVirtual = event.currentTarget.parentElement.dataset.isVirtual === "true";
        const targetStatusId = Number(event.currentTarget.parentElement.dataset.id);
        const targetStatusOrder = Number(event.currentTarget.parentElement.dataset.order);
        if (targetStatusOrder === statusesToRender.length - 1) {
            return; // can't move the status any lower
        }
        setChanges(prevChanges => {
            const result = {...prevChanges};
            if (!isVirtual) {
                if (!(targetStatusId in result)) {
                    result[targetStatusId] = {};
                }
                result[targetStatusId].order = targetStatusOrder + 1;
            }
            const laterStatusId = props.ticketStatuses
                .find(status => (prevChanges[status.id]?.order ?? status.order) === targetStatusOrder + 1 && status.id !== targetStatusId)
                ?.id;
            if (laterStatusId !== undefined) { // next status is a new one that hasn't been committed to the database yet
                if (!(laterStatusId in result)) {
                    result[laterStatusId] = {};
                }
                result[laterStatusId].order = targetStatusOrder;
            }
            return result;
        });
        setNewStatuses(prevNewStatuses => prevNewStatuses.map(status => {
            if (status.order === targetStatusOrder + 1) {
                return {...status, order: targetStatusOrder};
            } else if (status.order === targetStatusOrder) {
                return {...status, order: targetStatusOrder + 1};
            } else {
                return status;
            }
        }));
    }, [props.ticketStatuses, statusesToRender.length]);

    const handleCrossClick = React.useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        const isVirtual = event.currentTarget.parentElement.dataset.isVirtual === "true";
        const deletedStatusOrder = Number(event.currentTarget.parentElement.dataset.order);
        const deletedStatusId = Number(event.currentTarget.parentElement.dataset.id);
        if (isVirtual) {
            const targetVirtualId = Number(event.currentTarget.parentElement.dataset.virtualId);
            setNewStatuses(prevNewStatuses => prevNewStatuses.filter(newStatus => newStatus.virtualId !== targetVirtualId));
        } else {
            setDeletedStatusIds(prevIds => [...prevIds, deletedStatusId]);
        }
        setChanges(prevChanges => {
            const resultingChanges = (() => {
                if (isVirtual) {
                    return {...prevChanges};
                } else {
                    const {[deletedStatusId]: _, ...restChanges} = prevChanges;
                    return restChanges;
                }
            })();
            for (const status of props.ticketStatuses) {
                if (status.id === deletedStatusId) {
                    continue;
                }
                const statusOrder = resultingChanges[status.id]?.order ?? status.order;
                if (statusOrder > deletedStatusOrder) {
                    resultingChanges[status.id] = {
                        ...resultingChanges[status.id],
                        order: statusOrder - 1,
                    };
                }
            }
            return resultingChanges;
        });
        setNewStatuses(prevStatuses => prevStatuses.map(status =>
            status.order > deletedStatusOrder
                ? {...status, order: status.order - 1}
                : status));
    }, [props.ticketStatuses, newStatuses]);

    const handleNewStatusNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setNewStatusName(event.currentTarget.value);
    }, []);

    const handlePlusClick = React.useCallback(() => {
        const newStatus: VirtualTicketStatusCreateVm = {
            virtualId: nextVirtualId--,
            name: newStatusName,
            order: statusesToRender.length,
        };
        setNewStatuses(prevNewStatuses => [...prevNewStatuses, newStatus]);
        setNewStatusName("");
    }, [newStatusName, statusesToRender.length]);

    const handleSave = React.useCallback(() => {
        setIsLoading(true);
        const body: TicketStatusMassEditVm = {
            changes,
            deletedIds,
            newStatuses: newStatuses.map(newStatus => ({name: newStatus.name, order: newStatus.order})),
            projectId: props.projectId,
        };
        fetchBackend("/api/ticket-statuses/mass", "PUT", body)
            .then((updatedTicketStatuses: TicketStatusVm[]) => {
                props.onTicketStatusesUpdated(updatedTicketStatuses);
                props.hide();
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [changes, deletedIds, newStatuses, props.onTicketStatusesUpdated, props.projectId]);

    return (
        <Modal>
            <ModalBackground onClick={props.hide}>
                {isLoading && <LoadingScreen />}

                <div className="edit-ticket-statuses-modal">
                    <div className="input-container">
                        {statusesToRender
                            .slice().sort(projectionComparator(status => status.order))
                            .map(status => {
                                const markerProps = {
                                    "data-is-virtual": "virtualId" in status,
                                    "data-id": "id" in status ? status.id : undefined,
                                    "data-virtual-id": "virtualId" in status ? status.virtualId : undefined,
                                    "data-order": status.order,
                                };
                                return (
                                    <React.Fragment key={"id" in status ? status.id : status.virtualId}>
                                        <label>{status.order + 1}.</label>
                                        <div className="input" {...markerProps}>
                                            <input
                                                value={status.name}
                                                onChange={handleNameChange}
                                            />
                                            {statusesToRender.length !== 1 &&
                                                <CrossIcon
                                                    className="cross"
                                                    onClick={handleCrossClick}
                                                />}
                                        </div>
                                        <div className="up-and-down-controls" {...markerProps}>
                                            <ArrowUpIcon
                                                className="arrow-up"
                                                onClick={handleArrowUpClick}
                                            />
                                            <ArrowDownIcon
                                                className="arrow-down"
                                                onClick={handleArrowDownClick}
                                            />
                                        </div>
                                    </React.Fragment>
                                );
                            })}

                        <label></label>
                        <input value={newStatusName} onChange={handleNewStatusNameChange} />
                        <PlusIcon className="plus-icon" onClick={handlePlusClick} />
                    </div>

                    <button onClick={handleSave}>Save</button>
                </div>
            </ModalBackground>
        </Modal>
    );
};

export default EditTicketStatusesModal;
