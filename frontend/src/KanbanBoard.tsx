import "./KanbanBoard.css";
import * as React from "react";
import { TicketStatusVm } from "./models/ticket-status";
import { projectionComparator } from "./algorithms/sorting";
import { TicketVm } from "./models/ticket";
import { useModalState } from "./modals/hooks";
import TicketModal, { TicketModalMode } from "./modals/TicketModal";
import { fetchBackend } from "./comm";
import { CrossIcon } from "./icons";
import LoadingScreen from "./LoadingScreen";

interface Props {
    ticketStatuses: TicketStatusVm[];
    tickets: TicketVm[];
    onTicketStatusChange: (ticketId: number, newStatusId: number) => void;
    onTicketDeleted: (ticketId: number) => void;
    onTicketUpdated: (updatedTicket: TicketVm) => void;
}

const KanbanBoard = (props: Props) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [draggedTicketStatusId, setDraggedTicketStatusId] = React.useState<number>();
    const [isShowingTicketModal, showTicketModal, hideTicketModal] = useModalState();
    const [selectedTicket, setSelectedTicket] = React.useState<TicketVm>();

    const ticketsMap: {[statusId: number]: TicketVm[]} = React.useMemo(() =>
        props.tickets.reduce((map, ticket) => ({...map, [ticket.statusId]: [...(map[ticket.statusId] ?? []), ticket]}), {})
    , [props.tickets]);

    const handleTicketClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        const newSelectedTicketId = Number(event.currentTarget.dataset.id);
        const newSelectedTicket = props.tickets.find(ticket => ticket.id === newSelectedTicketId);
        setSelectedTicket(newSelectedTicket);
        showTicketModal();
    }, [props.tickets]);
    const handleTicketDragStart = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
        const draggedTicketId = Number(event.currentTarget.dataset.id);
        event.dataTransfer.setData("application/custom", draggedTicketId.toString());
        const draggedTicket = props.tickets.find(ticket => ticket.id === draggedTicketId);
        setDraggedTicketStatusId(draggedTicket.statusId);
    }, [props.tickets]);
    const handleTicketsContainerDragOver = React.useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);
    const handleTicketsContainerDrop = React.useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        const transferData = event.dataTransfer.getData("application/custom");
        if (transferData === "") { // DND was not triggered by us
            return;
        }
        const movedTicketId = Number(transferData);
        const targetStatusId = Number(event.currentTarget.dataset.statusId);
        setIsLoading(true);
        fetchBackend(`/api/tickets/${movedTicketId}/change-status`, "PUT", targetStatusId)
            .then(() => {
                props.onTicketStatusChange(movedTicketId, targetStatusId);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, []);
    const handleTicketDragEnd = React.useCallback(() => {
        setDraggedTicketStatusId(undefined);
    }, []);
    const handleCrossClick = React.useCallback((event: React.MouseEvent<SVGSVGElement>) => {
        event.stopPropagation();
        const targetTicketId = Number(event.currentTarget.parentElement.dataset.id);
        setIsLoading(true);
        fetchBackend(`/api/tickets/${targetTicketId}`, "DELETE", targetTicketId)
            .then(() => {
                props.onTicketDeleted(targetTicketId);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [props.onTicketDeleted]);

    return (
        <div className="kanban-board">
            {isLoading && <LoadingScreen />}

            {isShowingTicketModal &&
                <TicketModal
                    hide={hideTicketModal}
                    mode={TicketModalMode.Update}
                    ticket={selectedTicket}
                    onTicketUpdated={props.onTicketUpdated}
                />}

            {props.ticketStatuses
                .slice().sort(projectionComparator(status => status.order))
                .map(status => {
                    const classNames: string[] = ["tickets-container"];
                    if (draggedTicketStatusId !== undefined && status.id !== draggedTicketStatusId) {
                        classNames.push("drop-target");
                    }
                    return (
                        <div key={status.id} className="status-line">
                            <label>{status.name}</label>

                            <div
                                className={classNames.join(" ")}
                                onDragOver={handleTicketsContainerDragOver}
                                onDrop={handleTicketsContainerDrop}
                                data-status-id={status.id}
                            >
                                {ticketsMap[status.id]
                                    ?.slice().sort(projectionComparator(ticket => ticket.name.toLowerCase()))
                                    .map(ticket => (
                                    <div
                                        className="ticket"
                                        key={ticket.id}
                                        onClick={handleTicketClick}
                                        data-id={ticket.id}
                                        draggable={true}
                                        onDragStart={handleTicketDragStart}
                                        onDragEnd={handleTicketDragEnd}
                                    >
                                        {ticket.name}

                                        <CrossIcon
                                            className="cross"
                                            onClick={handleCrossClick}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
        </div>
    );
};

export default KanbanBoard;
