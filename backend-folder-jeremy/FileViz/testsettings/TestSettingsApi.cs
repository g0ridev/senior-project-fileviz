using System.Text.Json;

var savedFoldersPath = @"..\..\saved-folders.json";

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

app.MapGet("/folders", () =>
{
    if (!File.Exists(savedFoldersPath))
        return Results.Json(new List<string>());

    var json = File.ReadAllText(savedFoldersPath);
    var folders = JsonSerializer.Deserialize<List<string>>(json);
    return Results.Json(folders);
});

app.MapPost("/folders", (string path) =>
{
    if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
        return Results.BadRequest("Invalid path - folder does not exist");

    List<string> folders;
    if (File.Exists(savedFoldersPath))
    {
        var json = File.ReadAllText(savedFoldersPath);
        folders = JsonSerializer.Deserialize<List<string>>(json);
    }
    else
    {
        folders = new List<string>();
    }

    if (!folders.Contains(path))
    {
        folders.Add(path);
        File.WriteAllText(savedFoldersPath, JsonSerializer.Serialize(folders));
        return Results.Ok($"Added: {path}");
    }

    return Results.Ok("Already saved");
});

app.MapDelete("/folders", (string path) =>
{
    if (!File.Exists(savedFoldersPath))
        return Results.NotFound("No saved folders yet");

    var json = File.ReadAllText(savedFoldersPath);
    var folders = JsonSerializer.Deserialize<List<string>>(json);
    folders.Remove(path);
    File.WriteAllText(savedFoldersPath, JsonSerializer.Serialize(folders));
    return Results.Ok($"Removed: {path}");
});

app.Run("http://localhost:5002");