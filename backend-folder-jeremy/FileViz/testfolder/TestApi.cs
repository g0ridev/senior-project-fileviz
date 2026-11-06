using System.Diagnostics;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors();

// Returns the current user's home folder so the frontend doesn't hardcode a username
app.MapGet("/root", () =>
{
    var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    return Results.Json(new { path = home });
});

// Returns the contents of a folder (files + subfolders)
app.MapGet("/folder", (string? path) =>
{
    if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
        return Results.BadRequest("Invalid path");

    var contents = new List<object>();

    foreach (var folder in Directory.GetDirectories(path))
    {
        contents.Add(new { name = Path.GetFileName(folder), fullPath = folder, isDirectory = true });
    }

    foreach (var file in Directory.GetFiles(path))
    {
        var info = new FileInfo(file);
        contents.Add(new {
            name = Path.GetFileName(file),
            fullPath = file,
            isDirectory = false,
            size = info.Length,
            extension = info.Extension,
            lastModified = info.LastWriteTime
        });
    }

    return Results.Json(contents);
});

// Opens a file with its default Windows application (double-click behaviour)
app.MapPost("/open", (string path) =>
{
    if (!File.Exists(path))
        return Results.NotFound("File not found");

    Process.Start(new ProcessStartInfo(path) { UseShellExecute = true });
    return Results.Ok("Opened");
});

// Deletes a file permanently
app.MapDelete("/file", (string path) =>
{
    if (!File.Exists(path))
        return Results.NotFound("File not found");

    File.Delete(path);
    return Results.Ok("Deleted");
});

// Renames (or moves) a file — same call, File.Move handles both
app.MapPatch("/file", (string oldPath, string newPath) =>
{
    if (!File.Exists(oldPath))
        return Results.NotFound("File not found");

    if (File.Exists(newPath))
        return Results.Conflict("A file with that name already exists");

    File.Move(oldPath, newPath);
    return Results.Ok("Renamed");
});

// Creates a new folder
app.MapPost("/folder", (string path) =>
{
    if (Directory.Exists(path))
        return Results.Conflict("Folder already exists");
    Directory.CreateDirectory(path);
    return Results.Ok("Created");
});

// Deletes a folder and everything in it
app.MapDelete("/folder", (string path) =>
{
    if (!Directory.Exists(path))
        return Results.NotFound("Folder not found");
    Directory.Delete(path, recursive: true);
    return Results.Ok("Deleted");
});

// Renames a folder
app.MapPatch("/folder", (string oldPath, string newPath) =>
{
    if (!Directory.Exists(oldPath))
        return Results.NotFound("Folder not found");

    if (Directory.Exists(newPath))
        return Results.Conflict("A folder with that name already exists");

    Directory.Move(oldPath, newPath);
    return Results.Ok("Renamed");
});

app.Run("http://localhost:5000");
