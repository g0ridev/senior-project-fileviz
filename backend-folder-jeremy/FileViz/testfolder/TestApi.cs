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

// returns the current user's home folder so HTML doesn't hardcode a username
app.MapGet("/root", () =>
{
    var home = Environment.GetFolderPath(Environment.SpecialFolder.UserProfile);
    return Results.Json(new { path = home });
});

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
        contents.Add(new { name = Path.GetFileName(file), fullPath = file, isDirectory = false });
    }

    return Results.Json(contents);
});

app.Run("http://localhost:5000");