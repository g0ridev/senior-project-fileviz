/*
//FileNode.cs
using System.Collections.Generic;
using System.Text.Json;
using System.IO;

class FileNode {
	
	public string Path { get; set;}
	public long size {get; set;}
	public List<FileNodeSearch> Children {get; set;} = new List<FileNodeSearch>();
	
	
	public void Run(){
		
		if (!File.Exists(@"..\..\searchcache.json"))
		{
			string rootPath = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
			var treePath = buildTree(rootPath);
			string json = jsonSerializer.Serialize(treePath);
			File.WriteAllText("treecache.json", json);
			
		}
		
		

	}
	

	FileNode BuildTree(string folderPath){
		
		var node = new FileNode();
		node.Path = folderPath;
		node.Children = new List<string>();
		node.Size = 0;
		
		foreach(var file in Directory.GetFiles(folderPath)){
			var fileNode = FileNode();
			FileNode.Path = file;
			FileNode.Size = new Fileinfo(file).Length;
			node.children.Add(fileNode);
			node.Size += FileNode.Size;
			
		}
		foreach(var dir in Directory.GetDirectories(folderPath)){
			var ChildNode = BuildTree(dir);
			node.Children.Add(ChildNode);
			node.Size = ChildNode.Size;
			
			
		}
		return node;
	}
	
	
	
	
}
*/