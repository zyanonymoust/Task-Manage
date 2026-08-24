using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Task_Manage.Server.Controllers;
using Task_Manage.Server.Data;
using Task_Manage.Server.Models;

namespace Task_Manage.Tests;

public class UnitTest1
{
    private AppDbContext CreateDbContext()
    {
        var options =
            new DbContextOptionsBuilder<AppDbContext>()
                .UseInMemoryDatabase(
                    Guid.NewGuid().ToString()
                )
                .Options;

        return new AppDbContext(options);
    }

    private static DateOnly FutureDate(int days = 7)
    {
        return DateOnly.FromDateTime(
            DateTime.Today.AddDays(days)
        );
    }

    [Fact]
    public async Task AddTask_ShouldAddTask()
    {
        var db = CreateDbContext();

        var controller =
            new TasksController(db);

        var task = new TaskItem
        {
            Title = "Study Docker",
            Description = "Learn Docker testing",
            Status = "Pending",
            Priority = "High",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(17, 0),
            Remark = "Unit test"
        };

        await controller.AddTask(task);

        var savedTask =
            await db.Tasks.FirstOrDefaultAsync();

        Assert.NotNull(savedTask);

        Assert.Equal(
            "Study Docker",
            savedTask.Title
        );

        Assert.Equal(
            "Pending",
            savedTask.Status
        );

        Assert.Equal(
            "High",
            savedTask.Priority
        );
    }

    [Fact]
    public async Task GetTasks_ShouldReturnTasks()
    {
        var db = CreateDbContext();

        db.Tasks.Add(new TaskItem
        {
            Title = "Task A",
            Description = "First task",
            Status = "Pending",
            Priority = "Medium",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        });

        db.Tasks.Add(new TaskItem
        {
            Title = "Task B",
            Description = "Second task",
            Status = "In Progress",
            Priority = "High",
            DueDate = FutureDate(8),
            DueTime = new TimeOnly(15, 0),
            Remark = ""
        });

        await db.SaveChangesAsync();

        var controller =
            new TasksController(db);

        var result =
            await controller.GetTasks();

        var okResult =
            Assert.IsType<OkObjectResult>(result);

        var tasks =
            Assert.IsAssignableFrom<IEnumerable<TaskItem>>(
                okResult.Value
            );

        Assert.Equal(
            2,
            tasks.Count()
        );
    }

    [Fact]
    public async Task UpdateTask_ShouldUpdateTask()
    {
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Old Task",
            Description = "Old description",
            Status = "Pending",
            Priority = "Low",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        };

        db.Tasks.Add(task);

        await db.SaveChangesAsync();

        var controller =
            new TasksController(db);

        var updatedTask = new TaskItem
        {
            Title = "Updated Task",
            Description = "Updated description",
            Status = "In Progress",
            Priority = "High",
            DueDate = FutureDate(8),
            DueTime = new TimeOnly(15, 30),
            Remark = "Task updated"
        };

        await controller.UpdateTask(
            task.Id,
            updatedTask
        );

        var savedTask =
            await db.Tasks.FindAsync(task.Id);

        Assert.NotNull(savedTask);

        Assert.Equal(
            "Updated Task",
            savedTask.Title
        );

        Assert.Equal(
            "Updated description",
            savedTask.Description
        );

        Assert.Equal(
            "In Progress",
            savedTask.Status
        );

        Assert.Equal(
            "High",
            savedTask.Priority
        );

        Assert.Equal(
            "Task updated",
            savedTask.Remark
        );

        Assert.NotNull(
            savedTask.UpdatedAt
        );
    }

    [Fact]
    public async Task UpdateTask_Completed_ShouldSetCompletedAt()
    {
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Finish Assignment",
            Description = "Complete testing",
            Status = "Pending",
            Priority = "High",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(17, 0),
            Remark = ""
        };

        db.Tasks.Add(task);

        await db.SaveChangesAsync();

        var controller =
            new TasksController(db);

        var updatedTask = new TaskItem
        {
            Title = "Finish Assignment",
            Description = "Complete testing",
            Status = "Completed",
            Priority = "High",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(17, 0),
            Remark = "Done"
        };

        await controller.UpdateTask(
            task.Id,
            updatedTask
        );

        var savedTask =
            await db.Tasks.FindAsync(task.Id);

        Assert.NotNull(savedTask);

        Assert.Equal(
            "Completed",
            savedTask.Status
        );

        Assert.NotNull(
            savedTask.CompletedAt
        );
    }

    [Fact]
    public async Task DeleteTask_ShouldDeleteTask()
    {
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Delete Me",
            Description = "Testing delete",
            Status = "Pending",
            Priority = "Low",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        };

        db.Tasks.Add(task);

        await db.SaveChangesAsync();

        var controller =
            new TasksController(db);

        await controller.DeleteTask(task.Id);

        var deletedTask =
            await db.Tasks.FindAsync(task.Id);

        Assert.Null(deletedTask);
    }

    [Fact]
    public async Task UpdateTask_InvalidId_ShouldReturnNotFound()
    {
        var db = CreateDbContext();

        var controller =
            new TasksController(db);

        var updatedTask = new TaskItem
        {
            Title = "Not Existing Task",
            Description = "Testing invalid ID",
            Status = "Pending",
            Priority = "Medium",
            DueDate = FutureDate(),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        };

        var result =
            await controller.UpdateTask(
                999,
                updatedTask
            );

        Assert.IsType<NotFoundResult>(result);
    }
}