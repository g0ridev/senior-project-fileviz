/*
// FileVizIndex.cs
using System.Text.Json;

public class FileVizIndex
{
    private HashSet<string> allPaths = new();
    private const string CacheFile = "fileindex.json";

    public void BuildOrLoad()
    {
        if (File.Exists(CacheFile))
        {
            Console.WriteLine("Loading index from cache...");
            var json = File.ReadAllText(CacheFile);
            allPaths = JsonSerializer.Deserialize<HashSet<string>>(json)!;
            Console.WriteLine($"Loaded {allPaths.Count} entries.");
            return;
        }

        Console.WriteLine("First run — scanning drive...");
        foreach (var path in Directory.EnumerateFiles(@"C:\", "*", 
            new EnumerationOptions 
            { 
                IgnoreInaccessible = true,
                RecurseSubdirectories = true
            }))
        {
            allPaths.Add(path);
        }

        File.WriteAllText(CacheFile, JsonSerializer.Serialize(allPaths));
        Console.WriteLine($"Done. {allPaths.Count} files indexed.");
    }

    public List<string> Search(string query)
    {
        return allPaths
            .Where(p => Path.GetFileName(p).Contains(query, StringComparison.OrdinalIgnoreCase))
            .Take(50)
            .ToList();
    }
}
*/