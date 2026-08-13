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

    [Fact]
    public async Task AddTask_ShouldAddTask()
    {
        // Arrange
        var db = CreateDbContext();

        var controller =
            new TasksController(db);

        var task = new TaskItem
        {
            Title = "Study Docker",
            Description = "Learn Docker testing",
            Status = "Pending",
            Priority = "High",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(17, 0),
            Remark = "Unit test"
        };

        // Act
        await controller.AddTask(task);

        // Assert
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
        // Arrange
        var db = CreateDbContext();

        db.Tasks.Add(new TaskItem
        {
            Title = "Task A",
            Description = "First task",
            Status = "Pending",
            Priority = "Medium",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        });

        db.Tasks.Add(new TaskItem
        {
            Title = "Task B",
            Description = "Second task",
            Status = "In Progress",
            Priority = "High",
            DueDate = new DateOnly(2026, 8, 21),
            DueTime = new TimeOnly(15, 0),
            Remark = ""
        });

        await db.SaveChangesAsync();

        var controller =
            new TasksController(db);

        // Act
        var result =
            await controller.GetTasks();

        // Assert
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
        // Arrange
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Old Task",
            Description = "Old description",
            Status = "Pending",
            Priority = "Low",
            DueDate = new DateOnly(2026, 8, 20),
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
            DueDate = new DateOnly(2026, 8, 25),
            DueTime = new TimeOnly(15, 30),
            Remark = "Task updated"
        };

        // Act
        await controller.UpdateTask(
            task.Id,
            updatedTask
        );

        // Assert
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
        // Arrange
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Finish Assignment",
            Description = "Complete testing",
            Status = "Pending",
            Priority = "High",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(17, 0),
            Remark = ""
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        var controller = new TasksController(db);

        var updatedTask = new TaskItem
        {
            Title = "Finish Assignment",
            Description = "Complete testing",
            Status = "Completed",
            Priority = "High",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(17, 0),
            Remark = "Done"
        };

        // Act
        await controller.UpdateTask(
            task.Id,
            updatedTask
        );

        // Assert
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
        // Arrange
        var db = CreateDbContext();

        var task = new TaskItem
        {
            Title = "Delete Me",
            Description = "Testing delete",
            Status = "Pending",
            Priority = "Low",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        };

        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        var controller = new TasksController(db);

        // Act
        await controller.DeleteTask(task.Id);

        // Assert
        var deletedTask =
            await db.Tasks.FindAsync(task.Id);

        Assert.Null(deletedTask);
    }

    [Fact]
    public async Task UpdateTask_InvalidId_ShouldReturnNotFound()
    {
        // Arrange
        var db = CreateDbContext();

        var controller =
            new TasksController(db);

        var updatedTask = new TaskItem
        {
            Title = "Not Existing Task",
            Description = "Testing invalid ID",
            Status = "Pending",
            Priority = "Medium",
            DueDate = new DateOnly(2026, 8, 20),
            DueTime = new TimeOnly(10, 0),
            Remark = ""
        };

        // Act
        var result =
            await controller.UpdateTask(
                999,
                updatedTask
            );

        // Assert
        Assert.IsType<NotFoundResult>(result);
    }
}