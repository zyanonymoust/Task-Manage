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

    public TasksController(
        AppDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<IActionResult>
        GetTasks()
    {
        var tasks =
            await _db.Tasks
                .OrderBy(
                    task =>
                        task.DueDate
                )
                .ThenBy(
                    task =>
                        task.DueTime
                )
                .ToListAsync();

        return Ok(tasks);
    }

    [HttpPost]
    public async Task<IActionResult>
        AddTask(TaskItem task)
    {
        var validationError =
            ValidateTask(task);

        if (
            validationError != null
        )
        {
            return validationError;
        }

        task.Id = 0;

        task.Title =
            task.Title.Trim();

        task.CreatedAt =
            DateTime.UtcNow;

        task.UpdatedAt = null;

        if (
            task.Status ==
            "Completed"
        )
        {
            task.CompletedAt =
                DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await _db.Tasks.AddAsync(
            task
        );

        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult>
        UpdateTask(
            int id,
            TaskItem updatedTask)
    {
        var validationError =
            ValidateTask(updatedTask);

        if (
            validationError != null
        )
        {
            return validationError;
        }

        var task =
            await _db.Tasks.FindAsync(
                id
            );

        if (
            task == null
        )
        {
            return NotFound();
        }

        task.Title =
            updatedTask.Title.Trim();

        task.Description =
            updatedTask.Description;

        task.Status =
            updatedTask.Status;

        task.Priority =
            updatedTask.Priority;

        task.DueDate =
            updatedTask.DueDate;

        task.DueTime =
            updatedTask.DueTime;

        task.Remark =
            updatedTask.Remark;

        task.UpdatedAt =
            DateTime.UtcNow;

        if (
            updatedTask.Status ==
            "Completed"
        )
        {
            task.CompletedAt ??=
                DateTime.UtcNow;
        }
        else
        {
            task.CompletedAt = null;
        }

        await _db.SaveChangesAsync();

        return Ok(task);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult>
        DeleteTask(int id)
    {
        var task =
            await _db.Tasks.FindAsync(
                id
            );

        if (
            task == null
        )
        {
            return NotFound();
        }

        _db.Tasks.Remove(task);

        await _db.SaveChangesAsync();

        return Ok();
    }

    private BadRequestObjectResult?
        ValidateTask(TaskItem task)
    {
        if (
            string.IsNullOrWhiteSpace(
                task.Title
            )
        )
        {
            return BadRequest(
                new ProblemDetails
                {
                    Title =
                        "Invalid task",

                    Detail =
                        "Title is required."
                }
            );
        }

        var malaysiaToday =
            DateOnly.FromDateTime(
                DateTime.UtcNow.AddHours(8)
            );

        if (
            task.DueDate <
            malaysiaToday
        )
        {
            return BadRequest(
                new ProblemDetails
                {
                    Title =
                        "Invalid due date",

                    Detail =
                        "Due date cannot be in the past."
                }
            );
        }

        return null;
    }
}