var builder = WebApplication.CreateBuilder(args);

// Enable CORS for Angular frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngularApp", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddOpenApi();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowAngularApp");

// Thread-safe in-memory User store
var users = new List<UserDto>
{
    new()
    {
        Id = 1,
        FirstName = "Alex",
        LastName = "Rivers",
        Email = "alex.rivers@example.com",
        Birthday = "1995-04-12",
        Location = "New York, USA",
        Gender = "Male",
        Technologies = [".NET / C#", "Angular", "SQL Server"],
        CreatedAt = DateTime.UtcNow.ToString("o")
    },
    new()
    {
        Id = 2,
        FirstName = "Sophia",
        LastName = "Chen",
        Email = "sophia.chen@techcore.io",
        Birthday = "1998-09-24",
        Location = "San Francisco, USA",
        Gender = "Female",
        Technologies = ["Angular", "TypeScript", "Docker", "Azure"],
        CreatedAt = DateTime.UtcNow.ToString("o")
    },
    new()
    {
        Id = 3,
        FirstName = "Liam",
        LastName = "Perera",
        Email = "liam.perera@devhub.lk",
        Birthday = "1992-11-05",
        Location = "Colombo, Sri Lanka",
        Gender = "Male",
        Technologies = [".NET / C#", "TypeScript", "Docker"],
        CreatedAt = DateTime.UtcNow.ToString("o")
    }
};

// GET: /api/users
app.MapGet("/api/users", () => Results.Ok(users));

// GET: /api/users/{id}
app.MapGet("/api/users/{id:long}", (long id) =>
{
    var user = users.FirstOrDefault(u => u.Id == id);
    return user is not null ? Results.Ok(user) : Results.NotFound(new { message = $"User with ID {id} not found." });
});

// POST: /api/users
app.MapPost("/api/users", (UserDto newUser) =>
{
    if (string.IsNullOrWhiteSpace(newUser.FirstName) || string.IsNullOrWhiteSpace(newUser.LastName) || string.IsNullOrWhiteSpace(newUser.Email))
    {
        return Results.BadRequest(new { message = "First name, last name, and email are required." });
    }

    newUser.Id = users.Count > 0 ? users.Max(u => u.Id) + 1 : 1;
    newUser.CreatedAt = DateTime.UtcNow.ToString("o");
    users.Insert(0, newUser);

    return Results.Created($"/api/users/{newUser.Id}", newUser);
});

// PUT: /api/users/{id}
app.MapPut("/api/users/{id:long}", (long id, UserDto updatedUser) =>
{
    var existingIndex = users.FindIndex(u => u.Id == id);
    if (existingIndex == -1)
    {
        return Results.NotFound(new { message = $"User with ID {id} not found." });
    }

    updatedUser.Id = id;
    if (string.IsNullOrEmpty(updatedUser.CreatedAt))
    {
        updatedUser.CreatedAt = users[existingIndex].CreatedAt;
    }
    users[existingIndex] = updatedUser;

    return Results.Ok(updatedUser);
});

// DELETE: /api/users/{id}
app.MapDelete("/api/users/{id:long}", (long id) =>
{
    var existing = users.FirstOrDefault(u => u.Id == id);
    if (existing is null)
    {
        return Results.NotFound(new { message = $"User with ID {id} not found." });
    }

    users.Remove(existing);
    return Results.Ok(new { message = "User deleted successfully.", id });
});

app.Run();

public class UserDto
{
    public long Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Birthday { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public List<string> Technologies { get; set; } = [];
    public string? CreatedAt { get; set; }
}
