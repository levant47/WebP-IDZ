public class ProjectFullAndAllVm
{
    public IEnumerable<TicketStatusVm> TicketStatuses { get; set; }

    public IEnumerable<TicketVm> Tickets { get; set; }

    public IEnumerable<ProjectVm> AllProjects { get; set; }
}
