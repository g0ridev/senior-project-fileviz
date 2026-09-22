var builder = WebApplication.CreateBuilder(args);

// allow the html file to call this from browser
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader();
    });
});

var app = builder.Build();
app.UseCors();

app.MapGet("/folder", (string? path) =>
{
    if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
        return Results.BadRequest("Invalid path");

    var contents = new List<object>();

    foreach (var folder in Directory.GetDirectories(path))
    {
        contents.Add(new { Name = Path.GetFileName(folder), FullPath = folder, IsDirectory = true });
    }

    foreach (var file in Directory.GetFiles(path))
    {
        contents.Add(new { Name = Path.GetFileName(file), FullPath = file, IsDirectory = false });
    }

    return Results.Json(contents);
});

app.Run("http://localhost:5000");