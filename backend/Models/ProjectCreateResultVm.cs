public class ProjectCreateResultVm
{
    public int CreatedProjectId { get; set; }

    public IEnumerable<TicketStatusVm> DefaultStatuses { get; set; }
}
