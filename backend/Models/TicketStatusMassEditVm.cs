public class TicketStatusMassEditVm
{
    public int ProjectId { get; set; }

    public Dictionary<int, TicketStatusEditVm> Changes { get; set; }

    public List<int> DeletedIds { get; set; }

    public List<TicketStatusCreateVm> NewStatuses { get; set; }
}
