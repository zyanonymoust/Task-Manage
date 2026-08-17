import { useEffect, useMemo, useState } from "react";
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

type SortField = "created" | "due" | "updated";
type SortDirection = "asc" | "desc";
type ViewMode = "pagination" | "all";

const PAGE_SIZE = 9;

function getLocalDateString() {

    const now = new Date();

    const offset =
        now.getTimezoneOffset() * 60000;

    return new Date(
        now.getTime() - offset
    )
        .toISOString()
        .slice(0, 10);

}

function formatApiError(
    data: unknown,
    fallback: string
) {

    if (
        typeof data === "string" &&
        data.trim()
    ) {

        return data;

    }

    if (
        data &&
        typeof data === "object"
    ) {

        const problem =
            data as {
                detail?: string;
                title?: string;
            };

        return (
            problem.detail ||
            problem.title ||
            fallback
        );

    }

    return fallback;

}

function TaskManagement() {

    const today =
        getLocalDateString();

    const [tasks, setTasks] =
        useState<TaskItem[]>([]);

    const [title, setTitle] =
        useState("");

    const [description, setDescription] =
        useState("");

    const [status, setStatus] =
        useState("Pending");

    const [priority, setPriority] =
        useState("Medium");

    const [dueDate, setDueDate] =
        useState("");

    const [dueTime, setDueTime] =
        useState("");

    const [remark, setRemark] =
        useState("");

    const [editingId, setEditingId] =
        useState<number | null>(null);

    const [editTitle, setEditTitle] =
        useState("");

    const [editDescription, setEditDescription] =
        useState("");

    const [editStatus, setEditStatus] =
        useState("");

    const [editPriority, setEditPriority] =
        useState("");

    const [editDueDate, setEditDueDate] =
        useState("");

    const [editDueTime, setEditDueTime] =
        useState("");

    const [editRemark, setEditRemark] =
        useState("");

    const [searchText, setSearchText] =
        useState("");

    const [statusFilter, setStatusFilter] =
        useState("All");

    const [priorityFilter, setPriorityFilter] =
        useState("All");

    const [sortField, setSortField] =
        useState<SortField>("created");

    const [sortDirection, setSortDirection] =
        useState<SortDirection>("asc");

    const [viewMode, setViewMode] =
        useState<ViewMode>("pagination");

    const [currentPage, setCurrentPage] =
        useState(1);

    const [error, setError] =
        useState("");

    useEffect(() => {

        loadTasks();

    }, []);

    useEffect(() => {

        setCurrentPage(1);

    }, [
        searchText,
        statusFilter,
        priorityFilter,
        sortField,
        sortDirection,
        viewMode
    ]);

    async function loadTasks() {

        try {

            setError("");

            const response =
                await fetch(
                    "/api/tasks"
                );

            if (!response.ok) {

                setError(
                    `Failed to load tasks. Status: ${response.status}`
                );

                return;

            }

            const data =
                await response.json();

            setTasks(data);

        }
        catch {

            setError(
                "Cannot connect to server."
            );

        }

    }

    function validateTask(
        taskTitle: string,
        taskDate: string,
        taskTime: string
    ) {

        if (
            taskTitle.trim() === "" ||
            taskDate === "" ||
            taskTime === ""
        ) {

            setError(
                "Please enter title, due date and due time."
            );

            return false;

        }

        const selectedDateTime =
            new Date(`${taskDate}T${taskTime}`);

        const currentDateTime = new Date();

        if (selectedDateTime < currentDateTime) {

            setError(
                "Due date and time cannot be in the past."
            );

            return false;

        }

        return true;

    }

    async function readFailure(
        response: Response,
        fallback: string
    ) {

        try {

            const data =
                await response.json();

            return formatApiError(
                data,
                fallback
            );

        }
        catch {

            return fallback;

        }

    }

    async function addTask() {

        if (
            !validateTask(
                title,
                dueDate,
                dueTime
            )
        ) {

            return;

        }

        try {

            setError("");

            const response =
                await fetch(
                    "/api/tasks",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            title:
                                title.trim(),
                            description,
                            status,
                            priority,
                            dueDate,
                            dueTime,
                            remark
                        })
                    }
                );

            if (!response.ok) {

                setError(
                    await readFailure(
                        response,
                        `Failed to add task. Status: ${response.status}`
                    )
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

            setError(
                "Cannot connect to server."
            );

        }

    }

    function startEdit(
        task: TaskItem
    ) {

        setEditingId(task.id);

        setEditTitle(
            task.title
        );

        setEditDescription(
            task.description
        );

        setEditStatus(
            task.status
        );

        setEditPriority(
            task.priority
        );

        setEditDueDate(
            task.dueDate
        );

        setEditDueTime(
            task.dueTime.slice(
                0,
                5
            )
        );

        setEditRemark(
            task.remark
        );

        setError("");

    }

    function cancelEdit() {

        setEditingId(null);

        setError("");

    }

    async function saveTask(
        id: number
    ) {

        if (
            !validateTask(
                editTitle,
                editDueDate,
                editDueTime
            )
        ) {

            return;

        }

        try {

            setError("");

            const response =
                await fetch(
                    `/api/tasks/${id}`,
                    {
                        method: "PUT",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({
                            id,
                            title:
                                editTitle.trim(),
                            description:
                                editDescription,
                            status:
                                editStatus,
                            priority:
                                editPriority,
                            dueDate:
                                editDueDate,
                            dueTime:
                                editDueTime,
                            remark:
                                editRemark
                        })
                    }
                );

            if (!response.ok) {

                setError(
                    await readFailure(
                        response,
                        `Failed to update task. Status: ${response.status}`
                    )
                );

                return;

            }

            setEditingId(null);

            await loadTasks();

        }
        catch {

            setError(
                "Cannot connect to server."
            );

        }

    }

    async function deleteTask(
        id: number
    ) {

        try {

            setError("");

            const response =
                await fetch(
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

            setError(
                "Cannot connect to server."
            );

        }

    }

    const filteredTasks =
        useMemo(() => {

            const query =
                searchText
                    .trim()
                    .toLowerCase();

            return tasks
                .filter((task) => {

                    const matchesSearch =
                        query === "" ||
                        task.title
                            .toLowerCase()
                            .includes(query) ||
                        task.description
                            .toLowerCase()
                            .includes(query) ||
                        task.remark
                            .toLowerCase()
                            .includes(query);

                    const matchesStatus =
                        statusFilter === "All" ||
                        task.status ===
                        statusFilter;

                    const matchesPriority =
                        priorityFilter === "All" ||
                        task.priority ===
                        priorityFilter;

                    return (
                        matchesSearch &&
                        matchesStatus &&
                        matchesPriority
                    );

                })
                .sort((
                    firstTask,
                    secondTask
                ) => {

                    let firstValue = "";
                    let secondValue = "";

                    if (
                        sortField === "due"
                    ) {

                        firstValue =
                            firstTask.dueDate;

                        secondValue =
                            secondTask.dueDate;

                    }
                    else if (
                        sortField === "updated"
                    ) {

                        firstValue =
                            firstTask.updatedAt ||
                            firstTask.createdAt;

                        secondValue =
                            secondTask.updatedAt ||
                            secondTask.createdAt;

                    }
                    else {

                        firstValue =
                            firstTask.createdAt;

                        secondValue =
                            secondTask.createdAt;

                    }

                    const comparison =
                        firstValue.localeCompare(
                            secondValue
                        );

                    return (
                        sortDirection === "asc"
                            ? comparison
                            : -comparison
                    );

                });

        }, [
            tasks,
            searchText,
            statusFilter,
            priorityFilter,
            sortField,
            sortDirection
        ]);

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredTasks.length /
                PAGE_SIZE
            )
        );

    const safePage =
        Math.min(
            currentPage,
            totalPages
        );

    const visibleTasks =
        viewMode === "all"
            ? filteredTasks
            : filteredTasks.slice(
                (safePage - 1) *
                PAGE_SIZE,
                safePage *
                PAGE_SIZE
            );

    useEffect(() => {

        if (
            currentPage >
            totalPages
        ) {

            setCurrentPage(
                totalPages
            );

        }

    }, [
        currentPage,
        totalPages
    ]);

    return (

        <div className="task-page">

            <div className="task-title">

                <h1>
                    Task Management
                </h1>

                <p>
                    Manage your daily tasks and deadlines.
                </p>

            </div>

            {error && (

                <div
                    className="error-message"
                    role="alert"
                >
                    {error}
                </div>

            )}

            <div className="task-form">

                <h2>
                    Add Task
                </h2>

                <div className="task-form-grid">

                    <div className="full-width">

                        <input
                            type="text"
                            placeholder="Task title"
                            value={title}
                            onChange={(event) =>
                                setTitle(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div className="full-width">

                        <textarea
                            placeholder="Description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <select
                            aria-label="Task status"
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value
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

                    </div>

                    <div>

                        <select
                            aria-label="Task priority"
                            value={priority}
                            onChange={(event) =>
                                setPriority(
                                    event.target.value
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

                    </div>

                    <div>

                        <input
                            aria-label="Due date"
                            type="date"
                            min={today}
                            value={dueDate}
                            onChange={(event) =>
                                setDueDate(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div>

                        <input
                            aria-label="Due time"
                            type="time"
                            value={dueTime}
                            onChange={(event) =>
                                setDueTime(
                                    event.target.value
                                )
                            }
                        />

                    </div>

                    <div className="full-width">

                        <textarea
                            placeholder="Remark / Note"
                            value={remark}
                            onChange={(event) =>
                                setRemark(
                                    event.target.value
                                )
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

                <div className="list-heading">

                    <div>

                        <h2>
                            My Tasks
                        </h2>

                        <span className="result-count">

                            {filteredTasks.length}{" "}

                            {filteredTasks.length === 1
                                ? "task"
                                : "tasks"}

                        </span>

                    </div>

                    <label className="view-control">

                        View Mode

                        <select
                            aria-label="View Mode"
                            value={viewMode}
                            onChange={(event) =>
                                setViewMode(event.target.value as ViewMode)
                            }
                        >

                            <option value="pagination">
                                Pagination
                            </option>

                            <option value="all">
                                Show All
                            </option>

                        </select>

                    </label>

                </div>

                <div className="task-toolbar">

                    <label className="search-control">

                        <span>
                            Search
                        </span>

                        <input
                            type="search"
                            aria-label="Search tasks"
                            placeholder="Search title, description or remark"
                            value={searchText}
                            onChange={(event) =>
                                setSearchText(
                                    event.target.value
                                )
                            }
                        />

                    </label>

                    <label>

                        <span>
                            Status
                        </span>

                        <select
                            aria-label="Filter by status"
                            value={statusFilter}
                            onChange={(event) =>
                                setStatusFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Statuses
                            </option>

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

                    </label>

                    <label>

                        <span>
                            Priority
                        </span>

                        <select
                            aria-label="Filter by priority"
                            value={priorityFilter}
                            onChange={(event) =>
                                setPriorityFilter(
                                    event.target.value
                                )
                            }
                        >

                            <option value="All">
                                All Priorities
                            </option>

                            <option value="Low">
                                Low
                            </option>

                            <option value="Medium">
                                Medium
                            </option>

                            <option value="High">
                                High
                            </option>

                        </select>

                    </label>

                    <div className="sort-control">

                        <label>

                            <span>
                                Sort Tasks
                            </span>

                            <select
                                aria-label="Sort by"
                                value={sortField}
                                onChange={(event) =>
                                    setSortField(event.target.value as SortField)
                                }
                            >

                                <option value="created">
                                    Created Date
                                </option>

                                <option value="due">
                                    Due Date
                                </option>

                                <option value="updated">
                                    Last Updated
                                </option>

                            </select>

                        </label>

                        <button
                            type="button"
                            className="sort-direction-button"
                            aria-label={
                                sortDirection === "asc"
                                    ? "Sort ascending"
                                    : "Sort descending"
                            }
                            title={
                                sortDirection === "asc"
                                    ? "ASC"
                                    : "DESC"
                            }
                            onClick={() =>
                                setSortDirection(
                                    sortDirection === "asc"
                                        ? "desc"
                                        : "asc"
                                )
                            }
                        >

                            {sortDirection === "asc"
                                ? "↑"
                                : "↓"}

                        </button>

                    </div>

                </div>

                {visibleTasks.length === 0 ? (

                    <div className="empty-message">

                        {tasks.length === 0
                            ? "No tasks yet."
                            : "No tasks match your search or filters."}

                    </div>

                ) : (

                    <div
                        className="task-grid"
                        data-testid="task-grid"
                    >

                        {visibleTasks.map(
                            (task) => (

                                <div
                                    key={task.id}
                                    data-testid="task-card"
                                    className={
                                        task.status === "Completed"
                                            ? "task-card completed"
                                            : "task-card"
                                    }
                                >

                                    {editingId === task.id ? (

                                        <div className="edit-form">

                                            <input
                                                aria-label="Edit title"
                                                type="text"
                                                value={editTitle}
                                                onChange={(event) =>
                                                    setEditTitle(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <textarea
                                                aria-label="Edit description"
                                                value={editDescription}
                                                onChange={(event) =>
                                                    setEditDescription(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <select
                                                aria-label="Edit status"
                                                value={editStatus}
                                                onChange={(event) =>
                                                    setEditStatus(
                                                        event.target.value
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
                                                aria-label="Edit priority"
                                                value={editPriority}
                                                onChange={(event) =>
                                                    setEditPriority(
                                                        event.target.value
                                                    )
                                                }
                                            >

                                                <option value="Low">
                                                    Low 
                                                </option>

                                                <option value="Medium">
                                                    Medium
                                                </option>

                                                <option value="High">
                                                    High
                                                </option>

                                            </select>

                                            <input
                                                aria-label="Edit due date"
                                                type="date"
                                                min={today}
                                                value={editDueDate}
                                                onChange={(event) =>
                                                    setEditDueDate(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <input
                                                aria-label="Edit due time"
                                                type="time"
                                                value={editDueTime}
                                                onChange={(event) =>
                                                    setEditDueTime(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <textarea
                                                aria-label="Edit remark"
                                                placeholder="Remark / Note"
                                                value={editRemark}
                                                onChange={(event) =>
                                                    setEditRemark(
                                                        event.target.value
                                                    )
                                                }
                                            />

                                            <div className="task-actions">

                                                <button
                                                    className="save-button"
                                                    onClick={() =>
                                                        saveTask(
                                                            task.id
                                                        )
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

                                                <strong>
                                                    Status:
                                                </strong>{" "}

                                                {task.status}

                                            </p>

                                            <p className="task-info">

                                                <strong>
                                                    Priority:
                                                </strong>{" "}

                                                {task.priority}

                                            </p>

                                            <p className="task-info">

                                                <strong>
                                                    Due:
                                                </strong>{" "}

                                                {task.dueDate}{" "}

                                                {task.dueTime.slice(
                                                    0,
                                                    5
                                                )}

                                            </p>

                                            {task.remark && (

                                                <p className="task-info">

                                                    <strong>
                                                        Remark:
                                                    </strong>{" "}

                                                    {task.remark}

                                                </p>

                                            )}

                                            <p className="task-info">

                                                <strong>
                                                    Task Created:
                                                </strong>{" "}

                                                {new Date(
                                                    task.createdAt
                                                ).toLocaleString()}

                                            </p>

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
                                                        startEdit(
                                                            task
                                                        )
                                                    }
                                                >
                                                    Edit
                                                </button>

                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        deleteTask(
                                                            task.id
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </div>

                                        </>

                                    )}

                                </div>

                            )
                        )}

                    </div>

                )}

                {viewMode === "pagination" &&
                    filteredTasks.length > 0 && (

                        <nav
                            className="pagination"
                            aria-label="Task pagination"
                        >

                            <button
                                disabled={
                                    safePage === 1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.max(
                                                1,
                                                page - 1
                                            )
                                    )
                                }
                            >
                                Previous
                            </button>

                            {Array.from(
                                {
                                    length:
                                        totalPages
                                },
                                (_, index) =>
                                    index + 1
                            ).map(
                                (pageNumber) => (

                                    <button
                                        key={
                                            pageNumber
                                        }
                                        className={
                                            safePage ===
                                                pageNumber
                                                ? "active"
                                                : ""
                                        }
                                        aria-current={
                                            safePage ===
                                                pageNumber
                                                ? "page"
                                                : undefined
                                        }
                                        onClick={() =>
                                            setCurrentPage(
                                                pageNumber
                                            )
                                        }
                                    >
                                        {pageNumber}
                                    </button>

                                )
                            )}

                            <button
                                disabled={
                                    safePage ===
                                    totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (page) =>
                                            Math.min(
                                                totalPages,
                                                page + 1
                                            )
                                    )
                                }
                            >
                                Next
                            </button>

                        </nav>

                    )}

            </div>

        </div>

    );

}

export default TaskManagement;