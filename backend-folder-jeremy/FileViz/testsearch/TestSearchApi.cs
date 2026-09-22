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

app.MapGet("/search", (string path, string query) =>
{
    if (string.IsNullOrWhiteSpace(path) || !Directory.Exists(path))
        return Results.BadRequest("Invalid path");

    if (string.IsNullOrWhiteSpace(query))
        return Results.BadRequest("No query provided");

    var results = Directory.EnumerateFiles(path, $"*{query}*",
            new EnumerationOptions
            {
                RecurseSubdirectories = true,
                IgnoreInaccessible = true,
                MatchCasing = MatchCasing.CaseInsensitive
            })
        .Take(100)
        .Select(f => new
        {
            name = Path.GetFileName(f),
            fullPath = f,
            directory = Path.GetDirectoryName(f)
        });

    return Results.Json(results);
});

app.Run("http://localhost:5001");