//Program.cs

/*
var index = new FileVizIndex();
index.BuildOrLoad();

Console.Write("Search: ");
var query = Console.ReadLine();
var results = index.Search(query);
foreach (var r in results)
    Console.WriteLine(r);
*/

//var ui = new FileVizUi(); 
//var search = new FileVizSearch();

//ui.Run();
//search.Run();


/*
var index = new FileVizIndex();
index.TestOnDownloads();
Console.WriteLine("wrote current-folder-context-lookingAt.json");
Console.ReadKey();

*/
var index = new FileVizIndex();
string startPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), "Downloads");
index.LoadFolder(startPath);
Console.WriteLine("wrote current-folder-context-lookingAt.json");
Console.ReadKey();
