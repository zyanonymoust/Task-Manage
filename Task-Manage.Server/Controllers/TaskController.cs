using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task_Manage.Server.Data;
using Task_Manage.Server.Models;

namespace Task_Manage.Server.Controllers;

[ApiController]
[Route("api/tasks")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _db;

    public TasksController(AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult> GetTasks()
    {
        var tasks = await _db.Tasks
            .OrderBy(x => x.DueDate)
            .ThenBy(x => x.DueTime)
            .ToListAsync();

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult> AddTask(TaskItem task)
    {
        task.Id = 0;
        task.CreatedAt = DateTime.UtcNow;
        task.UpdatedAt = null;

        if (task.Status == "Completed")
        {
            task.CompletedAt = DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await _db.Tasks.AddAsync(task);
        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateTask(
        int id,
        TaskItem updatedTask)
    {
        var task = await _db.Tasks.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        task.Title = updatedTask.Title;
        task.Description = updatedTask.Description;
        task.Status = updatedTask.Status;
        task.Priority = updatedTask.Priority;
        task.DueDate = updatedTask.DueDate;
        task.DueTime = updatedTask.DueTime;
        task.Remark = updatedTask.Remark;

        task.UpdatedAt = DateTime.UtcNow;

        if (updatedTask.Status == "Completed")
        {
            task.CompletedAt ??= DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var task = await _db.Tasks.FindAsync(id);

        if (task == null)
        {
            return NotFound();
        }

        _db.Tasks.Remove(task);

        await _db.SaveChangesAsync();

        return Ok();
    }
}