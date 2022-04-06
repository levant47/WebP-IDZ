import { TicketVm } from "./ticket";
import { TicketStatusVm } from "./ticket-status";

export interface ProjectVm {
    id: number;
    name: string;
}

export interface ProjectCreateVm {
    name: string;
}

export interface ProjectCreateResultVm {
    createdProjectId: number;
    defaultStatuses: TicketStatusVm[];
}

export interface ProjectCreateFullResultVm {
    createdProject: ProjectVm;
    defaultStatuses: TicketStatusVm[];
}

export interface ProjectFullVm {
    ticketStatuses: TicketStatusVm[];
    tickets: TicketVm[];
}

export interface ProjectFullAndAllVm {
    ticketStatuses: TicketStatusVm[];
    tickets: TicketVm[];
    allProjects: ProjectVm[];
}
