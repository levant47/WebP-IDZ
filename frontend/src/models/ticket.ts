export interface TicketVm {
    id: number;
    name: string;
    description: string;
    statusId: number;
}

export interface TicketCreateVm {
    name: string;
    description: string;
    projectId: number;
}

export interface TicketUpdateVm {
    name: string;
    description: string;
}
