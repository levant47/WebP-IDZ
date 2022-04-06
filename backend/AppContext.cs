public class AppContext
{
    private readonly string _connectionString;

    public AppContext(IConfiguration configuration)
    {
        _connectionString = configuration["DatabaseConnection"];
    }

    public DbConnection CreateDbConnection() => new NpgsqlConnection(_connectionString);
}
