using Microsoft.EntityFrameworkCore;
using Task_Manage.Server.Models;

namespace Task_Manage.Server.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<TaskItem> Tasks { get; set; }
}