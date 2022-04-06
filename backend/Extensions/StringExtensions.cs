public static class StringExtensions
{
    // https://stackoverflow.com/questions/5528972/how-do-i-convert-a-string-into-safe-sql-string
    public static string CleanForSql(this string source) => source.Replace("'", "''");
}
