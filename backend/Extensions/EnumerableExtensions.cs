public static class EnumerableExtensions
{
    public static bool All<T>(this IEnumerable<T> source, Func<T, int, bool> predicate)
    {
        var index = 0;
        foreach (var item in source)
        {
            if (!predicate(item, index))
            {
                return false;
            }
            index++;
        }
        return true;
    }
}
