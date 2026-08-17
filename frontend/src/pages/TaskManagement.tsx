import {
    useEffect,
    useMemo,
    useRef,
    useState
} from "react";

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

type SortField =
    "created" |
    "due" |
    "updated";

type SortDirection =
    "asc" |
    "desc";

type ViewMode =
    "pagination" |
    "all";

const PAGE_SIZE = 9;

function getLocalDateString() {
    const now =
        new Date();

    const offset =
        now.getTimezoneOffset() * 60000;

    return new Date(
        now.getTime() - offset
    )
        .toISOString()
        .slice(0, 10);
}

function addDays(
    dateText: string,
    numberOfDays: number
) {
    const [year, month, day] =
        dateText
            .split("-")
            .map(Number);

    const date =
        new Date(
            year,
            month - 1,
            day
        );

    date.setDate(
        date.getDate() + numberOfDays
    );

    const newYear =
        date.getFullYear();

    const newMonth =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const newDay =
        String(
            date.getDate()
        ).padStart(2, "0");

    return (
        `${newYear}-${newMonth}-${newDay}`
    );
}

function formatTimeTo12Hour(
    time: string
) {
    const match =
        time.match(
            /^([01]\d|2[0-3]):([0-5]\d)/
        );

    if (!match) {
        return time;
    }

    const hour =
        Number(match[1]);

    const minute =
        match[2];

    const period =
        hour >= 12
            ? "PM"
            : "AM";

    const displayHour =
        hour % 12 || 12;

    return (
        `${String(displayHour)
            .padStart(2, "0")}:${minute} ${period}`
    );
}

interface ParsedTime {
    normalizedTime: string;
    dayOffset: number;
}

function parseManualTime(
    input: string
): ParsedTime | null {
    const value =
        input
            .trim()
            .toUpperCase();

    /*
     * Accept explicit 12-hour input:
     * 08:00 PM
     * 4:30 AM
     */
    const twelveHourMatch =
        value.match(
            /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/
        );

    if (twelveHourMatch) {
        let hour =
            Number(
                twelveHourMatch[1]
            );

        const minute =
            twelveHourMatch[2];

        const period =
            twelveHourMatch[3];

        if (
            period === "AM" &&
            hour === 12
        ) {
            hour = 0;
        }

        if (
            period === "PM" &&
            hour !== 12
        ) {
            hour += 12;
        }

        return {
            normalizedTime:
                `${String(hour)
                    .padStart(2, "0")}:${minute}`,

            dayOffset: 0
        };
    }

    /*
     * Accept:
     * 2:00
     * 12:00
     * 16:00
     * 20:00
     * 24:00
     * 25:00
     */
    const manualMatch =
        value.match(
            /^(\d{1,3}):([0-5]\d)$/
        );

    if (!manualMatch) {
        return null;
    }

    const enteredHour =
        Number(
            manualMatch[1]
        );

    const minute =
        manualMatch[2];

    let normalizedHour: number;
    let dayOffset = 0;

    if (
        enteredHour <= 12
    ) {
        /*
         * Requested rule:
         * 0–12 automatically becomes AM.
         *
         * 2:00  → 02:00 AM
         * 12:00 → 12:00 AM
         */
        normalizedHour =
            enteredHour === 12
                ? 0
                : enteredHour;
    }
    else if (
        enteredHour < 24
    ) {
        /*
         * 13–23 automatically becomes PM.
         *
         * 16:00 → 04:00 PM
         * 20:00 → 08:00 PM
         */
        normalizedHour =
            enteredHour;
    }
    else {
        /*
         * 24 hours or above advances
         * the Due Date.
         *
         * 24:00 → next day 12:00 AM
         * 25:00 → next day 01:00 AM
         * 48:00 → two days later 12:00 AM
         */
        dayOffset =
            Math.floor(
                enteredHour / 24
            );

        normalizedHour =
            enteredHour % 24;
    }

    return {
        normalizedTime:
            `${String(normalizedHour)
                .padStart(2, "0")}:${minute}`,

        dayOffset
    };
}

interface TimeInputProps {
    label: string;
    value: string;
    dateValue: string;
    onChange: (
        value: string
    ) => void;
    onDateChange: (
        value: string
    ) => void;
    onError: (
        message: string
    ) => void;
}

function TimeInput({
    label,
    value,
    dateValue,
    onChange,
    onDateChange,
    onError
}: TimeInputProps) {
    const pickerReference =
        useRef<HTMLInputElement>(
            null
        );

    const [
        displayValue,
        setDisplayValue
    ] = useState(
        value
            ? formatTimeTo12Hour(value)
            : ""
    );

    useEffect(() => {
        setDisplayValue(
            value
                ? formatTimeTo12Hour(value)
                : ""
        );
    }, [value]);

    function handleManualInput(
        input: string
    ) {
        /*
         * Allow numbers, colon,
         * spaces and AM/PM letters.
         */
        if (
            !/^[0-9:aApPmM\s]*$/.test(input) ||
            input.length > 8
        ) {
            return;
        }

        setDisplayValue(input);

        const parsed =
            parseManualTime(input);

        /*
         * A partly entered value such as
         * "2" stays as "2".
         */
        if (!parsed) {
            onChange("");
            return;
        }

        if (
            parsed.dayOffset > 0
        ) {
            if (!dateValue) {
                onChange("");

                onError(
                    "Please select the due date before entering 24 hours or more."
                );

                return;
            }

            onDateChange(
                addDays(
                    dateValue,
                    parsed.dayOffset
                )
            );
        }

        onError("");

        onChange(
            parsed.normalizedTime
        );

        setDisplayValue(
            formatTimeTo12Hour(
                parsed.normalizedTime
            )
        );
    }

    function openTimePicker() {
        const picker =
            pickerReference.current;

        if (!picker) {
            return;
        }

        if (picker.showPicker) {
            picker.showPicker();
        }
        else {
            picker.click();
        }
    }

    return (
        <div
            style={{
                position: "relative",
                width: "100%"
            }}
        >
            <input
                aria-label={label}
                type="text"
                inputMode="text"
                placeholder="--:-- --, e.g. 20:00 or 08:00 PM"
                maxLength={8}
                autoComplete="off"
                value={displayValue}
                style={{
                    width: "100%",
                    paddingRight: "52px",
                    boxSizing: "border-box"
                }}
                onFocus={(event) =>
                    event
                        .currentTarget
                        .select()
                }
                onChange={(event) =>
                    handleManualInput(
                        event.target.value
                    )
                }
            />

            <button
                type="button"
                aria-label={
                    `Open ${label} picker`
                }
                title="Choose time"
                onClick={openTimePicker}
                style={{
                    position: "absolute",
                    top: "50%",
                    right: "10px",
                    width: "36px",
                    height: "36px",
                    padding: 0,
                    border: "none",
                    background: "transparent",
                    color: "#111827",
                    fontSize: "24px",
                    cursor: "pointer",
                    transform:
                        "translateY(-50%)"
                }}
            >
                ◷
            </button>

            <input
                ref={pickerReference}
                type="time"
                value={value}
                tabIndex={-1}
                aria-hidden="true"
                onChange={(event) => {
                    onError("");

                    onChange(
                        event.target.value
                    );
                }}
                style={{
                    position: "absolute",
                    right: "10px",
                    bottom: 0,
                    width: "1px",
                    height: "1px",
                    padding: 0,
                    border: 0,
                    opacity: 0,
                    pointerEvents: "none"
                }}
            />
        </div>
    );
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

    const [
        editDescription,
        setEditDescription
    ] = useState("");

    const [editStatus, setEditStatus] =
        useState("");

    const [
        editPriority,
        setEditPriority
    ] = useState("");

    const [
        editDueDate,
        setEditDueDate
    ] = useState("");

    const [
        editDueTime,
        setEditDueTime
    ] = useState("");

    const [
        editRemark,
        setEditRemark
    ] = useState("");

    const [searchText, setSearchText] =
        useState("");

    const [
        statusFilter,
        setStatusFilter
    ] = useState("All");

    const [
        priorityFilter,
        setPriorityFilter
    ] = useState("All");

    const [
        sortField,
        setSortField
    ] = useState<SortField>(
        "created"
    );

    const [
        sortDirection,
        setSortDirection
    ] = useState<SortDirection>(
        "asc"
    );

    const [viewMode, setViewMode] =
        useState<ViewMode>(
            "pagination"
        );

    const [
        currentPage,
        setCurrentPage
    ] = useState(1);

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
            !taskTitle.trim() ||
            !taskDate ||
            !taskTime
        ) {
            setError(
                "Please enter title, due date and due time."
            );

            return false;
        }

        const validTimePattern =
            /^([01]\d|2[0-3]):[0-5]\d$/;

        if (
            !validTimePattern.test(
                taskTime
            )
        ) {
            setError(
                "Please enter or select a valid due time."
            );

            return false;
        }

        const selectedDateTime =
            new Date(
                `${taskDate}T${taskTime}:00`
            );

        const currentDateTime =
            new Date();

        if (
            selectedDateTime <=
            currentDateTime
        ) {
            setError(
                "Due date and time must be in the future."
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
        setEditingId(
            task.id
        );

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
                            `${firstTask.dueDate}T${firstTask.dueTime}`;

                        secondValue =
                            `${secondTask.dueDate}T${secondTask.dueTime}`;
                    }
                    else if (
                        sortField ===
                        "updated"
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
                        <TimeInput
                            label="Due time"
                            value={dueTime}
                            dateValue={dueDate}
                            onChange={setDueTime}
                            onDateChange={
                                setDueDate
                            }
                            onError={setError}
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
                                setViewMode(
                                    event.target
                                        .value as ViewMode
                                )
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
                                    setSortField(
                                        event.target
                                            .value as SortField
                                    )
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

                                            <TimeInput
                                                label="Edit due time"
                                                value={editDueTime}
                                                dateValue={editDueDate}
                                                onChange={setEditDueTime}
                                                onDateChange={
                                                    setEditDueDate
                                                }
                                                onError={setError}
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

                                                {formatTimeTo12Hour(
                                                    task.dueTime.slice(
                                                        0,
                                                        5
                                                    )
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