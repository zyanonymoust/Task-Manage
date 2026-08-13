import { useEffect, useState } from "react";
import "./TaskManagement.css";

interface TaskItem {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    dueDate: string;
    dueTime: string;
    remark: string;
    createdAt: string;
    updatedAt: string | null;
    completedAt: string | null;
}

function TaskManagement() {

    const [tasks, setTasks] = useState<TaskItem[]>([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("Pending");
    const [priority, setPriority] = useState("Medium");
    const [dueDate, setDueDate] = useState("");
    const [dueTime, setDueTime] = useState("");
    const [remark, setRemark] = useState("");

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [editTitle, setEditTitle] = useState("");
    const [editDescription, setEditDescription] = useState("");
    const [editStatus, setEditStatus] = useState("");
    const [editPriority, setEditPriority] = useState("");
    const [editDueDate, setEditDueDate] = useState("");
    const [editDueTime, setEditDueTime] = useState("");
    const [editRemark, setEditRemark] = useState("");

    const [error, setError] = useState("");

    useEffect(() => {
        loadTasks();
    }, []);

    async function loadTasks() {

        try {

            setError("");

            const response = await fetch("/api/tasks");

            if (!response.ok) {
                setError(
                    `Failed to load tasks. Status: ${response.status}`
                );
                return;
            }

            const data = await response.json();

            setTasks(data);

        }
        catch {

            setError("Cannot connect to server.");

        }
    }

    async function addTask() {

        if (
            title.trim() === "" ||
            dueDate === "" ||
            dueTime === ""
        ) {
            setError(
                "Please enter title, due date and due time."
            );

            return;
        }

        try {

            setError("");

            const response = await fetch("/api/tasks", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    title,
                    description,
                    status,
                    priority,
                    dueDate,
                    dueTime,
                    remark
                })

            });

            if (!response.ok) {

                setError(
                    `Failed to add task. Status: ${response.status}`
                );

                return;
            }

            setTitle("");
            setDescription("");
            setStatus("Pending");
            setPriority("Medium");
            setDueDate("");
            setDueTime("");
            setRemark("");

            await loadTasks();

        }
        catch {

            setError("Cannot connect to server.");

        }
    }

    function startEdit(task: TaskItem) {

        setEditingId(task.id);

        setEditTitle(task.title);
        setEditDescription(task.description);
        setEditStatus(task.status);
        setEditPriority(task.priority);
        setEditDueDate(task.dueDate);
        setEditDueTime(task.dueTime);
        setEditRemark(task.remark);

    }

    function cancelEdit() {

        setEditingId(null);

    }

    async function saveTask(id: number) {

        if (
            editTitle.trim() === "" ||
            editDueDate === "" ||
            editDueTime === ""
        ) {

            setError(
                "Please enter title, due date and due time."
            );

            return;
        }

        try {

            setError("");

            const response = await fetch(
                `/api/tasks/${id}`,
                {

                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        id,
                        title: editTitle,
                        description: editDescription,
                        status: editStatus,
                        priority: editPriority,
                        dueDate: editDueDate,
                        dueTime: editDueTime,
                        remark: editRemark
                    })

                }
            );

            if (!response.ok) {

                setError(
                    `Failed to update task. Status: ${response.status}`
                );

                return;
            }

            setEditingId(null);

            await loadTasks();

        }
        catch {

            setError("Cannot connect to server.");

        }
    }

    async function deleteTask(id: number) {

        try {

            setError("");

            const response = await fetch(
                `/api/tasks/${id}`,
                {
                    method: "DELETE"
                }
            );

            if (!response.ok) {

                setError(
                    `Failed to delete task. Status: ${response.status}`
                );

                return;
            }

            await loadTasks();

        }
        catch {

            setError("Cannot connect to server.");

        }
    }

    return (

        <div className="task-page">

            <div className="task-title">

                <h1>Task Management</h1>

                <p>
                    Manage your daily tasks and deadlines.
                </p>

            </div>

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            <div className="task-form">

                <h2>Add Task</h2>

                <div className="task-form-grid">

                    <div className="full-width">

                        <input
                            type="text"
                            placeholder="Task title"
                            value={title}
                            onChange={(e) =>
                                setTitle(e.target.value)
                            }
                        />

                    </div>

                    <div className="full-width">

                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={(e) =>
                                setDescription(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <select
                            value={status}
                            onChange={(e) =>
                                setStatus(e.target.value)
                            }
                        >

                            <option value="Pending">
                                Pending
                            </option>

                            <option value="In Progress">
                                In Progress
                            </option>

                            <option value="Completed">
                                Completed
                            </option>

                        </select>

                    </div>

                    <div>

                        <select
                            value={priority}
                            onChange={(e) =>
                                setPriority(e.target.value)
                            }
                        >

                            <option value="Low">
                                Low Priority
                            </option>

                            <option value="Medium">
                                Medium Priority
                            </option>

                            <option value="High">
                                High Priority
                            </option>

                        </select>

                    </div>

                    <div>

                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) =>
                                setDueDate(e.target.value)
                            }
                        />

                    </div>

                    <div>

                        <input
                            type="time"
                            value={dueTime}
                            onChange={(e) =>
                                setDueTime(e.target.value)
                            }
                        />

                    </div>

                    <div className="full-width">

                        <textarea
                            placeholder="Remark / Note"
                            value={remark}
                            onChange={(e) =>
                                setRemark(e.target.value)
                            }
                        />

                    </div>

                </div>

                <button
                    className="add-button"
                    onClick={addTask}
                >
                    Add Task
                </button>

            </div>

            <div className="task-list">

                <h2>My Tasks</h2>

                {tasks.length === 0 ? (

                    <div className="empty-message">

                        No tasks yet.

                    </div>

                ) : (

                    <div className="task-grid">

                        {tasks.map((task) => (

                            <div
                                key={task.id}
                                className={
                                    task.status === "Completed"
                                        ? "task-card completed"
                                        : "task-card"
                                }
                            >

                                {editingId === task.id ? (

                                    <div className="edit-form">

                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) =>
                                                setEditTitle(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <textarea
                                            value={editDescription}
                                            onChange={(e) =>
                                                setEditDescription(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <select
                                            value={editStatus}
                                            onChange={(e) =>
                                                setEditStatus(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="Pending">
                                                Pending
                                            </option>

                                            <option value="In Progress">
                                                In Progress
                                            </option>

                                            <option value="Completed">
                                                Completed
                                            </option>

                                        </select>

                                        <select
                                            value={editPriority}
                                            onChange={(e) =>
                                                setEditPriority(
                                                    e.target.value
                                                )
                                            }
                                        >

                                            <option value="Low">
                                                Low Priority
                                            </option>

                                            <option value="Medium">
                                                Medium Priority
                                            </option>

                                            <option value="High">
                                                High Priority
                                            </option>

                                        </select>

                                        <input
                                            type="date"
                                            value={editDueDate}
                                            onChange={(e) =>
                                                setEditDueDate(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <input
                                            type="time"
                                            value={editDueTime}
                                            onChange={(e) =>
                                                setEditDueTime(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <textarea
                                            placeholder="Remark / Note"
                                            value={editRemark}
                                            onChange={(e) =>
                                                setEditRemark(
                                                    e.target.value
                                                )
                                            }
                                        />

                                        <div className="task-actions">

                                            <button
                                                className="save-button"
                                                onClick={() =>
                                                    saveTask(task.id)
                                                }
                                            >
                                                Save
                                            </button>

                                            <button
                                                className="cancel-button"
                                                onClick={cancelEdit}
                                            >
                                                Cancel
                                            </button>

                                        </div>

                                    </div>

                                ) : (

                                    <>

                                        <h3>
                                            {task.title}
                                        </h3>

                                        <p className="task-description">

                                            {task.description ||
                                                "No description"}

                                        </p>

                                        <p className="task-info">

                                            <strong>Status:</strong>{" "}

                                            {task.status}

                                        </p>

                                        <p className="task-info">

                                            <strong>Priority:</strong>{" "}

                                            {task.priority}

                                        </p>

                                        <p className="task-info">

                                            <strong>Due:</strong>{" "}

                                            {task.dueDate}{" "}
                                            {task.dueTime}

                                        </p>

                                        {task.remark && (

                                            <p className="task-info">

                                                <strong>
                                                    Remark:
                                                </strong>{" "}

                                                {task.remark}

                                            </p>

                                        )}

                                        {task.updatedAt && (

                                            <p className="task-info">

                                                <strong>
                                                    Last Updated:
                                                </strong>{" "}

                                                {new Date(
                                                    task.updatedAt
                                                ).toLocaleString()}

                                            </p>

                                        )}

                                        {task.completedAt && (

                                            <p className="task-info">

                                                <strong>
                                                    Completed:
                                                </strong>{" "}

                                                {new Date(
                                                    task.completedAt
                                                ).toLocaleString()}

                                            </p>

                                        )}

                                        <div className="task-actions">

                                            <button
                                                className="edit-button"
                                                onClick={() =>
                                                    startEdit(task)
                                                }
                                            >
                                                Edit
                                            </button>

                                            <button
                                                className="delete-button"
                                                onClick={() =>
                                                    deleteTask(task.id)
                                                }
                                            >
                                                Delete
                                            </button>

                                        </div>

                                    </>

                                )}

                            </div>

                        ))}

                    </div>

                )}

            </div>

        </div>
    );
}

export default TaskManagement;