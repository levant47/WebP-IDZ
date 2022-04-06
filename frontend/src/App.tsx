import "./App.css";
import * as React from "react";
import { fetchBackend } from "./comm";
import AddProjectModal from "./modals/AddProjectModal";
import LoadingScreen from "./LoadingScreen";
import { ProjectCreateFullResultVm, ProjectFullAndAllVm, ProjectFullVm, ProjectVm } from "./models/project";
import { TicketStatusVm } from "./models/ticket-status";
import KanbanBoard from "./KanbanBoard";
import { useModalState } from "./modals/hooks";
import EditTicketStatusesModal from "./modals/EditTicketStatusesModal";
import { TicketVm } from "./models/ticket";
import TicketModal, { TicketModalMode } from "./modals/TicketModal";

const App = () => {
    const [isLoading, setIsLoading] = React.useState(true);
    const [projects, setProjects] = React.useState<ProjectVm[]>();
    const [selectedProjectId, setSelectedProjectId] = React.useState<number>();
    const [selectedProjectTicketStatuses, setSelectedProjectTicketStatuses] = React.useState<TicketStatusVm[]>();
    const [selectedProjectTickets, setSelectedProjectTickets] = React.useState<TicketVm[]>();
    const [isShowingAddProjectModal, showAddProjectModal, hideAddProjectModal] = useModalState();
    const [isShowingEditStatusesModal, showEditStatusesModal, hideEditStatusesModal] = useModalState();
    const [isShowingTicketModal, showTicketModal, hideTicketModal] = useModalState();

    const handleProjectCreated = React.useCallback((result: ProjectCreateFullResultVm) => {
        setProjects(prevProjects => [...prevProjects, result.createdProject]);
        setSelectedProjectTicketStatuses(result.defaultStatuses);
        setSelectedProjectTickets([]);
        setSelectedProjectId(result.createdProject.id);
    }, []);
    const handleSelectedProjectChange = React.useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        const newSelectedProjectId = event.target.value !== "" ? Number(event.target.value) : undefined;
        if (newSelectedProjectId === selectedProjectId) {
            return;
        }
        setSelectedProjectId(newSelectedProjectId);
        setIsLoading(true);
        fetchBackend(`/api/projects/${newSelectedProjectId}/full`)
            .then((projectFullVm: ProjectFullVm) => {
                setSelectedProjectTicketStatuses(projectFullVm.ticketStatuses);
                setSelectedProjectTickets(projectFullVm.tickets);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [selectedProjectId, projects]);
    const handleTicketCreated = React.useCallback((newTicket: TicketVm) => {
        setSelectedProjectTickets(prevTickets => [...prevTickets, newTicket]);
    }, []);
    const handleTicketStatusChange = React.useCallback((ticketId: number, newStatusId: number) => {
        setSelectedProjectTickets(prevTickets =>
            prevTickets.map(ticket =>
                ticket.id === ticketId
                    ? {...ticket, statusId: newStatusId}
                    : ticket));
    }, []);
    const handleTicketDeleted = React.useCallback((targetTicketId: number) => {
        setSelectedProjectTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== targetTicketId));
    }, []);
    const handleTicketUpdated = React.useCallback((updatedTicket: TicketVm) => {
        setSelectedProjectTickets(prevTickets => prevTickets.map(ticket =>
            ticket.id === updatedTicket.id
                ? updatedTicket
                : ticket));
    }, []);

    React.useEffect(() => {
        const projectNameFromPath: string | undefined = (() => {
            const pathWords = location.pathname.split("/");
            if (pathWords.length != 2 || pathWords[1] === "") {
                return undefined;
            }
            return pathWords[1];
        })();
        if (projectNameFromPath === undefined) {
            fetchBackend("/api/projects")
                .then(setProjects)
                .finally(() => {
                    setIsLoading(false);
                });
        } else {
            fetchBackend(`/api/projects/full-and-all?name=${projectNameFromPath}`)
                .then((projectFullAndAllVm: ProjectFullAndAllVm) => {
                    // TODO: handle project not found
                    setProjects(projectFullAndAllVm.allProjects);
                    setSelectedProjectTicketStatuses(projectFullAndAllVm.ticketStatuses);
                    setSelectedProjectTickets(projectFullAndAllVm.tickets);
                    const selectedProjectName = decodeURI(projectNameFromPath);
                    setSelectedProjectId(projectFullAndAllVm.allProjects.find(project => project.name === selectedProjectName).id);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, []);
    React.useEffect(() => {
        if (selectedProjectId === undefined) {
            return;
        }
        const selectedProjectName = projects.find(project => project.id === selectedProjectId).name;
        const projectUrl = `/${selectedProjectName}`;
        if (decodeURI(location.pathname) !== projectUrl) {
            history.pushState(undefined, "", projectUrl);
        }
        document.title = `${selectedProjectName} - Task Manager`;
    }, [selectedProjectId]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return (
        <>
            <div className="project-controls">
                {isShowingAddProjectModal &&
                    <AddProjectModal
                        hide={hideAddProjectModal}
                        onCreated={handleProjectCreated}
                    />}
                {isShowingEditStatusesModal &&
                    <EditTicketStatusesModal
                        hide={hideEditStatusesModal}
                        ticketStatuses={selectedProjectTicketStatuses}
                        onTicketStatusesUpdated={setSelectedProjectTicketStatuses}
                        projectId={selectedProjectId}
                    />}
                {isShowingTicketModal &&
                    <TicketModal
                        hide={hideTicketModal}
                        mode={TicketModalMode.Create}
                        projectId={selectedProjectId}
                        onTicketCreated={handleTicketCreated}
                    />}

                <button onClick={showAddProjectModal}>+</button>

                <select value={selectedProjectId?.toString() ?? ""} onChange={handleSelectedProjectChange}>
                    {selectedProjectId === undefined &&
                        <option value="">
                            {projects.length !== 0 && "-- Please choose a project --"}
                            {projects.length === 0 && "-- Please create a project first --"}
                        </option>}

                    {projects.map(project =>
                        <option key={project.id} value={project.id.toString()}>{project.name}</option>)}
                </select>
            </div>

            {selectedProjectId !== undefined && <>
                <div className="ticket-controls">
                    <button onClick={showTicketModal}>New Ticket</button>
                    <button onClick={showEditStatusesModal}>Edit Statuses</button>
                </div>

                <KanbanBoard
                    ticketStatuses={selectedProjectTicketStatuses}
                    tickets={selectedProjectTickets}
                    onTicketStatusChange={handleTicketStatusChange}
                    onTicketDeleted={handleTicketDeleted}
                    onTicketUpdated={handleTicketUpdated}
                />
            </>}
        </>
    );
};

export default App;
