namespace Task_Manage.Server.Models;

public class TaskItem
{
    public int Id { get; set; }

    public string Title { get; set; } = "";

    public string Description { get; set; } = "";

    public string Status { get; set; } = "Pending";

    public string Priority { get; set; } = "Medium";

    public DateOnly DueDate { get; set; }

    public TimeOnly DueTime { get; set; }

    public string Remark { get; set; } = "";

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAt { get; set; }

    public DateTime? CompletedAt { get; set; }
}