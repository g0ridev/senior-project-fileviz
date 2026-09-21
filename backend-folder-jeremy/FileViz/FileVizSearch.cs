using System.Collections.Generic;
using System.Text.Json;
using System.IO;

class FileVizSearch {

    public void Run(){
        
        if (!File.Exists(@"..\..\searchcache.json"))
        {
            string rootPath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
            BuildIndex(rootPath);
        }

        List<string> index = LoadIndex();

        Console.Write("Search: ");
        string query = Console.ReadLine();
        List<string> results = Search(index, query);

        foreach(var result in results){
            Console.WriteLine(result);
        }
    }

    void BuildIndex(string rootPath){
        
        var options = new EnumerationOptions
        {
            IgnoreInaccessible = true,
            RecurseSubdirectories = true
        };

        var allPaths = new List<string>();  // ← just strings, not FileEntry

        foreach(var path in Directory.EnumerateFiles(rootPath, "*", options)){
            allPaths.Add(path);             // ← no FileInfo, no size, no metadata
        }

        string text = JsonSerializer.Serialize(allPaths);
        File.WriteAllText(@"..\..\searchcache.json", text);
    }

    List<string> LoadIndex(){
        string filepath = @"..\..\searchcache.json";
        string text = File.ReadAllText(filepath);
        return JsonSerializer.Deserialize<List<string>>(text);
    }

    public List<string> Search(List<string> index, string query){
        var results = new List<string>();

        foreach(var path in index){
            if (path.Contains(query, StringComparison.OrdinalIgnoreCase)){  // ← case-insensitive
                results.Add(path);
            }
        }

        string text = JsonSerializer.Serialize(results);
        File.WriteAllText(@"..\..\search-results.json", text);

        return results;
    }
}