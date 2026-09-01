/*
public class FileViz
{
    private List<(string label, string fullPath, bool isDir)> items = new();
    private int selectedIndex = 0;
    private string currentPath = @"C:\Users\bucki\Downloads";

    public void LoadItems()
    {
        items.Clear();
        DirectoryInfo dir = new DirectoryInfo(currentPath);

        foreach (DirectoryInfo folder in dir.GetDirectories())
            items.Add(($"[DIR] {folder.Name}", folder.FullName, true));

        foreach (FileInfo file in dir.GetFiles())
            items.Add(($"[FILE] {file.Name}", file.FullName, false));
    }

    public void DrawItems()
    {
        for (int i = 0; i < items.Count; i++)
        {
            if (i == selectedIndex)
            {
				
                Console.BackgroundColor = ConsoleColor.DarkMagenta;
                Console.ForegroundColor = ConsoleColor.White;
            }
			
			else if (items[i].isDir)
			{
				Console.BackgroundColor = ConsoleColor.DarkRed;
				Console.ForegroundColor = ConsoleColor.Yellow;
			}
			
			else
			{
				Console.BackgroundColor = ConsoleColor.DarkGreen;
				Console.ForegroundColor = ConsoleColor.Yellow;
				
			}
            Console.WriteLine($"  {items[i].label}");
            Console.ResetColor();
			
        }
    }
	

}
*/