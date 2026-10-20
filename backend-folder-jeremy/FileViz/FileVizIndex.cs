// fileVizIndex.cs
using System.Collections.Generic;
using System.Text.Json;
using System.IO;





class FileVizIndex {

	public class FolderEntry{
		
		public string Name {get; set;}
		public string FullPath {get; set;}
		public bool IsDirectory {get; set;}
		public string Size {get; set;}
		public string Extension {get; set;}
		public DateTime LastModified {get; set;}
	}
	public void TestOnDownloads(){
		string testPath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile),"Downloads");
		Console.WriteLine($"Testing LoadFolder on: {testPath}");
		LoadFolder(testPath);
		Console.WriteLine("Done. Check current-folder-context-lookingAt.json");
	}
	



	public void LoadFolder(string folderPath){
		
		var contents = new List<FolderEntry>();
		
		string[] subfolders = Directory.GetDirectories(folderPath);
		
		foreach(string folder in subfolders){
			var entry = new FolderEntry();
			entry.Name = Path.GetFileName(folder);
			entry.FullPath = folder;
			entry.IsDirectory = true;
			contents.Add(entry);
		}
		
		
		string[] files = Directory.GetFiles(folderPath);
		
		foreach(string file in files){
			var info = new FileInfo(file);
			var entry = new FolderEntry();
			entry.Name = Path.GetFileName(file);
			entry.FullPath = file;
			entry.IsDirectory = false;
			entry.Size = info.Length.ToString();
			entry.Extension = info.Extension;
			entry.LastModified = info.LastWriteTime;
			contents.Add(entry);
		}
		
		
		
		string text = JsonSerializer.Serialize(contents);
		File.WriteAllText(@"..\..\..\..\..\cache-folder-data.json", text);
		
	
	}
	



}