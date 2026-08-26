using System;
using System.IO;


// i should put this in a class later. 

DirectoryInfo dir = new DirectoryInfo(@"C:\Users\bucki\Documents");


Console.WriteLine("Welcome to FileViz!");
Console.WriteLine("...................");
Console.WriteLine("1. Display the Folders of this path.");
Console.WriteLine("2. Display the Files of this path");
//Console.WriteLine("3. Display the Tree? of this path"); // not implemented

string choice = Console.ReadLine();

if (choice == "1"){
	foreach (DirectoryInfo folder in dir.GetDirectories()){
		Console.WriteLine($"[DIR] {folder.Name} - {folder.LastWriteTime}");
	}
	
}
else if (choice == "2"){
	foreach (FileInfo file in dir.GetFiles()){
		Console.WriteLine($"[FILE] {file.Name} - {file.LastWriteTime}");
	}
	
}

//else for wrong inputs.






























