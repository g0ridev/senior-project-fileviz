/*
var index = new FileVizIndex();
index.BuildOrLoad();

Console.Write("Search: ");
var query = Console.ReadLine();
var results = index.Search(query);
foreach (var r in results)
    Console.WriteLine(r);
*/

var ui = new FileVizUi(); 

ui.Run();