export interface TicketStatusVm {
    id: number;
    name: string;
    order: number;
}

export interface TicketStatusEditVm {
    name?: string;
    order?: number;
}

export interface TicketStatusMassEditVm {
    projectId: number;
    changes: {[id: number]: TicketStatusEditVm};
    deletedIds: number[];
    newStatuses: TicketStatusCreateVm[];
}

export interface TicketStatusCreateVm {
    name: string;
    order: number;
}
