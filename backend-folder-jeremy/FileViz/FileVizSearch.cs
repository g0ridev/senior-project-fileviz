//FileVizSearch.cs
using System.Collections.Generic;
using System.Text.Json;
using System.IO;

class FileVizSearch {
	
	
	public void Run(){
		
		if(!File.Exists("searchcache.json")){
			BuildIndex(@"C:\Users\bucki\");
		}
		
		
		List<string> index = LoadIndex();
		//Console.WriteLine($"Loaded {index.Count} - paths");
		
		foreach(var path in index){
			//Console.WriteLine($"found: {path}");
			
		}
		
		Console.Write("Search: ");
		string query = Console.ReadLine();
		List<string> results = Search(index, query);
		
		foreach( var result in results){
			Console.WriteLine(result);
		}
		
		
		
		
	}
	
	
	
	
	void BuildIndex(string RootPath){
		
		var options = new EnumerationOptions
		{
			IgnoreInaccessible = true,
			RecurseSubdirectories = true
		};
		
		var allPaths = new List<string>();
		
		foreach(var path in Directory.EnumerateFiles(RootPath,"*",options)){
			allPaths.Add(path);
		}
		
		string text = JsonSerializer.Serialize(allPaths);
		File.WriteAllText("searchcache.json",text);
		
	}
	
	
	List<string> LoadIndex(){
		string filepath = "searchcache.json";
		string text = File.ReadAllText(filepath);
		List<string> index = JsonSerializer.Deserialize<List<string>>(text);
		return index;
	}
	
	public List<string> Search(List<string> index, string query){
		var results = new List<string>();
		
		foreach(var path in index){
			if (path.Contains(query)){
				results.Add(path);
			}
			
		}
		
		string text = JsonSerializer.Serialize(results);
		File.WriteAllText("search-results.json",text);
		
		return results;
		
	}
	
	
	
	
}