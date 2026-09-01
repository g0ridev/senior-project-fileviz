//FileVizUi.cs
using System;
using System.IO;
using System.Collections.Generic;

class FileVizUi{
	
	string currentPath = "C:\\Users\\bucki\\Downloads";  // double backslash in strings
	int selectedIndex = 0;
	// TOP OF CLASS — just declare them empty
	List<string> folders = new List<string>();
	List<string> files = new List<string>();
	
	public void Run(){
		while(true){
			LoadCurrentFolder();
			DrawLists();
			HandleInput();

		}
		
	}
	
	void LoadCurrentFolder(){
		folders = new List<string>(Directory.GetDirectories(currentPath));
		files = new List<string>(Directory.GetFiles(currentPath));
	}
	
	void HandleInput(){
		ConsoleKeyInfo key = Console.ReadKey(true);
		if(key.Key == ConsoleKey.DownArrow){
			selectedIndex = selectedIndex + 1;
			Console.Clear();
		}
		else if(key.Key == ConsoleKey.UpArrow){
			selectedIndex = selectedIndex - 1;
			Console.Clear();
		}
		else if(key.Key == ConsoleKey.RightArrow){
			currentPath = folders[selectedIndex];
			selectedIndex = 0;
			Console.Clear();
		}
		else if(key.Key == ConsoleKey.LeftArrow){
			string parent = Directory.GetParent(currentPath)?.FullName;
			currentPath = parent;
			selectedIndex = 0;
			Console.Clear();
			
		}
		else if(key.Key == ConsoleKey.Q){
			Environment.Exit(0);
		}
		
	}
	
	void DrawLists(){
		Console.Clear();
		
		for (int i = 0; i < folders.Count; i++){
			if (i == selectedIndex){
				Console.ForegroundColor = ConsoleColor.Yellow;
			}
			
			Console.WriteLine("[DIR] " + folders[i]);
			
			Console.ResetColor();
			
			
		}
		
		foreach(string file in files){
			Console.WriteLine("[FILE]" + file);
			
		}
	}

			
}
