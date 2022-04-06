[ApiController]
public class MainController : ControllerBase
{
    private readonly AppContext context;

    public MainController(AppContext passedContext) => context = passedContext;

    [HttpGet("/api/projects")]
    public async Task<object> GetAllProjects() => await context.GetAllProjects();

    [HttpPost("/api/projects")]
    public async Task<object> CreateProject([FromBody] ProjectCreateVm projectCreateVm)
    {
        await using var connection = context.CreateDbConnection();
        var createdProjectId = await connection.ExecuteScalarAsync<int>(@"
            INSERT INTO projects (name)
            VALUES (@Name)
            RETURNING id;
        ", projectCreateVm);
        var createdTicketStatuses = await connection.QueryAsync<TicketStatusVm>(@"
            INSERT INTO ticket_statuses (name, ""order"", project_id)
            VALUES
                ('To Do', 0, @ProjectId),
                ('In Progress', 1, @ProjectId),
                ('Done', 2, @ProjectId)
            RETURNING id, name, ""order"";
        ", new { ProjectId = createdProjectId });

        return new ProjectCreateResultVm
        {
            CreatedProjectId = createdProjectId,
            DefaultStatuses = createdTicketStatuses,
        };
    }

    [HttpGet("/api/projects/{projectId}/full")]
    public async Task<object> GetFullProject([FromRoute] int projectId)
    {
        var statusesTask = context.GetTicketStatusesByProjectId(projectId);
        var ticketsTask = Task.Run(async () =>
        {
            await using var connection = context.CreateDbConnection();
            return await connection.QueryAsync<TicketVm>(@"
                SELECT id, name, description, status_id
                FROM tickets
                WHERE project_id = @ProjectId
            ", new { ProjectId = projectId });
        });
        return new ProjectFullVm
        {
            TicketStatuses = await statusesTask,
            Tickets = await ticketsTask,
        };
    }

    [HttpPut("/api/ticket-statuses/mass")]
    public async Task<object> EditManyTicketStatuses([FromBody] TicketStatusMassEditVm massEditVm)
    {
        if (massEditVm.DeletedIds.Count == 0 && massEditVm.Changes.Count == 0 && massEditVm.NewStatuses.Count == 0)
        {
            return BadRequest("Empty body");
        }

        await using var connection = context.CreateDbConnection();
        await connection.OpenAsync();
        await using var transaction = connection.BeginTransaction();

        if (massEditVm.DeletedIds.Any())
        {
            // comparing against project_id here and elsewhere is done in order to guard against passing statuses from different projects
            await connection.ExecuteAsync(@"
                DELETE FROM ticket_statuses
                WHERE project_id = @ProjectId AND id = ANY (@DeletedIds)
            ", new { massEditVm.ProjectId, massEditVm.DeletedIds } );
        }

        if (massEditVm.Changes.Any())
        {
            var setStatements = new List<string>(2);

            var nameChanges = massEditVm.Changes.Where(pair => pair.Value.Name is not null);
            if (nameChanges.Any())
            {
                setStatements.Add(@$"
                    name = CASE
                        {string.Join("\n", nameChanges.Select(pair => $"WHEN id = {pair.Key} THEN '{pair.Value.Name!.CleanForSql()}'"))}
                        ELSE name
                    END
                ");
            }
            var orderChanges = massEditVm.Changes.Where(pair => pair.Value.Order is not null);
            if (orderChanges.Any())
            {
                setStatements.Add(@$"
                    ""order"" = CASE
                        {string.Join("\n", orderChanges.Select(pair => $"WHEN id = {pair.Key} THEN {pair.Value.Order}"))}
                        ELSE ""order""
                    END
                ");
            }

            await connection.ExecuteAsync(@$"
                UPDATE ticket_statuses
                SET {string.Join(",", setStatements)}
                WHERE project_id = @ProjectId AND id = ANY (@TargetIds)
            ", new { massEditVm.ProjectId, TargetIds = massEditVm.Changes.Keys.ToArray() });
        }

        if (massEditVm.NewStatuses.Any())
        {
            await connection.ExecuteAsync(@$"
                INSERT INTO ticket_statuses (name, ""order"", project_id)
                VALUES {string.Join(",\n", massEditVm.NewStatuses.Select(newStatus =>
                    $"('{newStatus.Name.CleanForSql()}', {newStatus.Order}, @ProjectId)"))}
            ", new { massEditVm.ProjectId });
        }

        // check correctness of order values
        var result = await context.GetTicketStatusesByProjectId(connection, massEditVm.ProjectId);
        if (!result.OrderBy(status => status.Order).All((status, index) => status.Order == index))
        {
            return BadRequest("Resulting statuses were out of order");
        }

        transaction.Commit();

        return result;
    }

    [HttpPost("/api/tickets")]
    public async Task<object> CreateTicket([FromBody] TicketCreateVm ticketCreateVm)
    {
        await using var connection = context.CreateDbConnection();
        return await connection.QueryFirstAsync<TicketVm>(@"
            INSERT INTO tickets (name, description, status_id, project_id)
            VALUES (
                @Name,
                @Description,
                (
                    SELECT Id
                    FROM ticket_statuses
                    WHERE project_id = @ProjectId AND ""order"" = 0
                ),
                @ProjectId
            )
            RETURNING id, name, description, status_id
        ", ticketCreateVm);
    }

    [HttpGet("/api/projects/full-and-all")]
    public async Task<object> GetProjectFullAndAll([FromQuery] string name)
    {
        var statusesTask = Task.Run(async () =>
        {
            await using var connection = context.CreateDbConnection();
            return await connection.QueryAsync<TicketStatusVm>(@"
                SELECT ticket_statuses.id, ticket_statuses.name, ticket_statuses.""order""
                FROM ticket_statuses
                JOIN projects ON ticket_statuses.project_id = projects.id
                WHERE projects.name = @ProjectName
            ", new { ProjectName = name });
        });
        var ticketsTask = Task.Run(async () =>
        {
            await using var connection = context.CreateDbConnection();
            return await connection.QueryAsync<TicketVm>(@"
                SELECT tickets.id, tickets.name, tickets.description, tickets.status_id
                FROM tickets
                JOIN projects ON tickets.project_id = projects.id
                WHERE projects.name = @ProjectName
            ", new { ProjectName = name });
        });
        var allProjectsTask = context.GetAllProjects();

        return new ProjectFullAndAllVm
        {
            TicketStatuses = await statusesTask,
            Tickets = await ticketsTask,
            AllProjects = await allProjectsTask,
        };
    }

    [HttpPut("/api/tickets/{ticketId}/change-status")]
    public async Task ChangeTicketStatus([FromRoute] int ticketId, [FromBody] int newStatusId)
    {
        await using var connection = context.CreateDbConnection();
        await connection.ExecuteAsync(@"
            UPDATE tickets
            SET status_id = @NewStatusId
            WHERE id = @TicketId
        ", new { TicketId = ticketId, NewStatusId = newStatusId });
    }

    [HttpDelete("/api/tickets/{id}")]
    public async Task DeleteTicket([FromRoute] int id)
    {
        await using var connection = context.CreateDbConnection();
        await connection.ExecuteAsync(@"
            DELETE FROM tickets
            WHERE id = @Id
        ", new { Id = id});
    }

    [HttpPut("/api/tickets/{id}")]
    public async Task<object> UpdateTicket([FromRoute] int id, [FromBody] TicketUpdateVm updateVm)
    {
        await using var connection = context.CreateDbConnection();
        return await connection.QueryFirstAsync<TicketVm>(@"
            UPDATE tickets
            SET name = @Name, description = @Description
            WHERE id = @Id
            RETURNING id, name, description, status_id
        ", new { Id = id, updateVm.Name, updateVm.Description });
    }
}
