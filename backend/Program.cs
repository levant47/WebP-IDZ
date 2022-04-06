global using Dapper;
global using Microsoft.Extensions.FileProviders;
global using Microsoft.AspNetCore.Mvc;
global using Npgsql;
global using System.ComponentModel.DataAnnotations;
global using System.Data.Common;

Dapper.DefaultTypeMap.MatchNamesWithUnderscores = true;

var STATIC_FILES_DIRECTORY = Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "..", "frontend", "public"));
var STATIC_FILE_PROVIDER = new PhysicalFileProvider(STATIC_FILES_DIRECTORY);

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<AppContext>();
builder.Services.AddCors();
builder.Services.AddControllers();
var app = builder.Build();

app.UseCors(corsPolicyBuilder => corsPolicyBuilder.AllowAnyHeader().AllowAnyMethod().AllowAnyOrigin());

app.UseDefaultFiles(new DefaultFilesOptions { DefaultFileNames = new[] { "index.html" }, FileProvider = STATIC_FILE_PROVIDER });
app.UseStaticFiles(new StaticFileOptions { FileProvider = STATIC_FILE_PROVIDER });

app.UseRouting();
app.UseEndpoints(endpoints => endpoints.MapControllers());

app.MapWhen(httpContext => !httpContext.Request.Path.Value!.StartsWith("/api/"), app =>
{
    app.Run(Results.File(Path.Combine(STATIC_FILES_DIRECTORY, "index.html"), "text/html").ExecuteAsync);
});

app.Run("http://0.0.0.0:5000");
