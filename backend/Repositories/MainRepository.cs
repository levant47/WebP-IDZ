public static class MainRepository
{
    public static async Task<IEnumerable<ProjectVm>> GetAllProjects(this AppContext context)
    {
        await using var connection = context.CreateDbConnection();
        return await connection.QueryAsync<ProjectVm>(@"
            SELECT id, name
            FROM projects
        ");
    }

    public static async Task<IEnumerable<TicketStatusVm>> GetTicketStatusesByProjectId(this AppContext context, int projectId)
    {
        await using var connection = context.CreateDbConnection();
        return await context.GetTicketStatusesByProjectId(connection, projectId);
    }

    public static Task<IEnumerable<TicketStatusVm>> GetTicketStatusesByProjectId(this AppContext _context, DbConnection connection, int projectId) =>
        connection.QueryAsync<TicketStatusVm>(@"
            SELECT id, name, ""order""
            FROM ticket_statuses
            WHERE project_id = @ProjectId
        ", new { ProjectId = projectId });
}
