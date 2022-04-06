import "./TicketModal.css";
import * as React from "react";
import { fetchBackend } from "../comm";
import LoadingScreen from "../LoadingScreen";
import { TicketCreateVm, TicketVm, TicketUpdateVm } from "../models/ticket";
import Modal from "./Modal";
import ModalBackground from "./ModalBackground";

export enum TicketModalMode {
    Create,
    Update,
}

interface CreateProps {
    hide: () => void;
    mode: TicketModalMode.Create;
    projectId: number;
    onTicketCreated: (newTicket: TicketVm) => void;
}

interface EditProps {
    hide: () => void;
    mode: TicketModalMode.Update;
    ticket: TicketVm;
    onTicketUpdated: (updatedTicket: TicketVm) => void;
}

type Props = CreateProps | EditProps;

const TicketModal = (props: Props) => {
    const [isLoading, setIsLoading] = React.useState(false);
    const [name, setName] = React.useState(props.mode === TicketModalMode.Create ? "" : props.ticket.name);
    const [description, setDescription] = React.useState(props.mode === TicketModalMode.Create ? "" : props.ticket.description);

    const handleNameChange = React.useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setName(event.currentTarget.value);
    }, []);
    const handleDescriptionChange = React.useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setDescription(event.currentTarget.value);
    }, []);
    const handleCreateTicket = React.useCallback(() => {
        if (props.mode !== TicketModalMode.Create) { throw new Error("Wrong mode"); }
        setIsLoading(true);
        const body: TicketCreateVm = {
            name,
            description,
            projectId: props.projectId,
        };
        fetchBackend("/api/tickets", "POST", body)
            .then((newTicket: TicketVm) => {
                props.onTicketCreated(newTicket);
                props.hide();
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [
        name,
        description,
        props.mode === TicketModalMode.Create ? props.projectId : undefined,
        props.mode === TicketModalMode.Create ? props.onTicketCreated : undefined,
        props.hide,
    ]);
    const handleUpdateTicket = React.useCallback(() => {
        if (props.mode !== TicketModalMode.Update) { throw new Error("Wrong mode"); }
        setIsLoading(true);
        const body: TicketUpdateVm = {name, description};
        fetchBackend(`/api/tickets/${props.ticket.id}`, "PUT", body)
            .then((updatedTicket: TicketVm) => {
                props.onTicketUpdated(updatedTicket);
                props.hide();
            })
            .catch(() => {
                setIsLoading(false);
            });
    }, [
        name,
        description,
        props.mode === TicketModalMode.Update ? props.ticket.id : undefined,
        props.mode === TicketModalMode.Update ? props.onTicketUpdated : undefined,
        props.hide,
    ]);

    return (
        <Modal>
            <ModalBackground onClick={props.hide}>
                {isLoading && <LoadingScreen />}

                <div className="ticket-modal">
                    <div>
                        <label>Name</label>
                        <input value={name} onChange={handleNameChange} />
                    </div>

                    <div>
                        <label>Description</label>
                        <textarea
                            rows={5}
                            cols={22}
                            value={description}
                            onChange={handleDescriptionChange}
                            />
                    </div>

                    {props.mode === TicketModalMode.Create && <button onClick={handleCreateTicket}>Create</button>}
                    {props.mode === TicketModalMode.Update && <button onClick={handleUpdateTicket}>Update</button>}
                </div>
            </ModalBackground>
        </Modal>
    );
};

export default TicketModal;
