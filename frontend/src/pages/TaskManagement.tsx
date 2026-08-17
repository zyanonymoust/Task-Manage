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

interface ThemeColors {
    pageBackground: string;
    cardBackground: string;
    inputBackground: string;
    textColor: string;
    secondaryTextColor: string;
    accentColor: string;
    borderColor: string;
}

interface ParsedTime {
    normalizedTime: string;
    dayOffset: number;
}

interface TimeInputProps {
    label: string;
    value: string;
    dateValue: string;
    onChange: (value: string) => void;
    onDateChange: (value: string) => void;
    onError: (message: string) => void;
}

type SortField = "created" | "due" | "updated";
type SortDirection = "asc" | "desc";
type ViewMode = "pagination" | "all";

const PAGE_SIZE = 9;

const lightColors: ThemeColors = {
    pageBackground: "#f3f4f6",
    cardBackground: "#ffffff",
    inputBackground: "#ffffff",
    textColor: "#111827",
    secondaryTextColor: "#6b7280",
    accentColor: "#4f46e5",
    borderColor: "#d1d5db"
};

const darkColors: ThemeColors = {
    pageBackground: "#111827",
    cardBackground: "#1f2937",
    inputBackground: "#374151",
    textColor: "#f9fafb",
    secondaryTextColor: "#d1d5db",
    accentColor: "#818cf8",
    borderColor: "#4b5563"
};

function getSavedTheme(): ThemeColors {
    try {
        const savedTheme =
            localStorage.getItem(
                "task-management-theme"
            );

        if (!savedTheme) {
            return lightColors;
        }

        return {
            ...lightColors,
            ...JSON.parse(savedTheme)
        };
    }
    catch {
        return lightColors;
    }
}

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

    return [
        date.getFullYear(),
        String(
            date.getMonth() + 1
        ).padStart(2, "0"),
        String(
            date.getDate()
        ).padStart(2, "0")
    ].join("-");
}

function formatTimeTo12Hour(time: string) {
    const match =
        time.match(
            /^([01]\d|2[0-3]):([0-5]\d)/
        );

    if (!match) {
        return time;
    }

    const hour = Number(match[1]);
    const minute = match[2];
    const period =
        hour >= 12 ? "PM" : "AM";

    const displayHour =
        hour % 12 || 12;

    return (
        `${String(displayHour)
            .padStart(2, "0")}:${minute} ${period}`
    );
}

function parseManualTime(
    input: string
): ParsedTime | null {
    const value =
        input
            .trim()
            .toUpperCase();

    const twelveHourMatch =
        value.match(
            /^(0?[1-9]|1[0-2]):([0-5]\d)\s*(AM|PM)$/
        );

    if (twelveHourMatch) {
        let hour =
            Number(twelveHourMatch[1]);

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

    const manualMatch =
        value.match(
            /^(\d{1,3}):([0-5]\d)$/
        );

    if (!manualMatch) {
        return null;
    }

    const enteredHour =
        Number(manualMatch[1]);

    const minute =
        manualMatch[2];

    let normalizedHour: number;
    let dayOffset = 0;

    if (enteredHour <= 12) {
        normalizedHour =
            enteredHour === 12
                ? 0
                : enteredHour;
    }
    else if (enteredHour < 24) {
        normalizedHour = enteredHour;
    }
    else {
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

function getStatusClass(status: string) {
    switch (status) {
        case "Completed":
            return "completed";

        case "In Progress":
            return "in-progress";

        default:
            return "pending";
    }
}

function getPriorityClass(priority: string) {
    switch (priority) {
        case "High":
            return "priority-high";

        case "Low":
            return "priority-low";

        default:
            return "priority-medium";
    }
}

function getDueInformation(task: TaskItem) {
    if (task.status === "Completed") {
        return {
            className: "due-completed",
            text: "Completed"
        };
    }

    const time =
        task.dueTime.slice(0, 5);

    const dueDateTime =
        new Date(
            `${task.dueDate}T${time}:00`
        );

    const now = new Date();
    const today = getLocalDateString();

    if (
        !Number.isNaN(
            dueDateTime.getTime()
        ) &&
        dueDateTime < now
    ) {
        return {
            className: "due-overdue",
            text: "Overdue"
        };
    }

    if (task.dueDate === today) {
        return {
            className: "due-today",
            text: "Due Today"
        };
    }

    const difference =
        dueDateTime.getTime() -
        now.getTime();

    const hoursRemaining =
        difference /
        (1000 * 60 * 60);

    if (
        hoursRemaining > 0 &&
        hoursRemaining <= 48
    ) {
        return {
            className: "due-soon",
            text: "Due Soon"
        };
    }

    return {
        className: "due-upcoming",
        text: "Upcoming"
    };
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

function TimeInput({
    label,
    value,
    dateValue,
    onChange,
    onDateChange,
    onError
}: TimeInputProps) {
    const pickerReference =
        useRef<HTMLInputElement>(null);

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
        if (
            !/^[0-9:aApPmM\s]*$/.test(input) ||
            input.length > 8
        ) {
            return;
        }

        setDisplayValue(input);

        if (!input.trim()) {
            onChange("");
            onError("");
            return;
        }

        const parsed =
            parseManualTime(input);

        if (!parsed) {
            onChange("");
            return;
        }

        if (parsed.dayOffset > 0) {
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
        <div className="time-input-container">
            <input
                aria-label={label}
                type="text"
                inputMode="text"
                placeholder="--:-- --, e.g. 20:00 or 08:00 PM"
                maxLength={8}
                autoComplete="off"
                value={displayValue}
                onFocus={(event) =>
                    event.currentTarget.select()
                }
                onChange={(event) =>
                    handleManualInput(
                        event.target.value
                    )
                }
            />

            <button
                type="button"
                className="time-picker-button"
                aria-label={
                    label === "Edit due time"
                        ? "Open edit time picker"
                        : "Open time picker"
                }
                title="Choose time"
                onClick={openTimePicker}
            >
                ◷
            </button>

            <input
                ref={pickerReference}
                className="hidden-time-picker"
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
            />
        </div>
    );
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
    ] = useState<SortField>("created");

    const [
        sortDirection,
        setSortDirection
    ] = useState<SortDirection>("asc");

    const [
        viewMode,
        setViewMode
    ] = useState<ViewMode>("pagination");

    const [
        currentPage,
        setCurrentPage
    ] = useState(1);

    const [error, setError] =
        useState("");

    const [
        showThemeSettings,
        setShowThemeSettings
    ] = useState(false);

    const [colors, setColors] =
        useState<ThemeColors>(
            getSavedTheme
        );

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

    useEffect(() => {
        const root =
            document.documentElement;

        root.style.setProperty(
            "--page-background",
            colors.pageBackground
        );

        root.style.setProperty(
            "--card-background",
            colors.cardBackground
        );

        root.style.setProperty(
            "--input-background",
            colors.inputBackground
        );

        root.style.setProperty(
            "--text-color",
            colors.textColor
        );

        root.style.setProperty(
            "--secondary-text-color",
            colors.secondaryTextColor
        );

        root.style.setProperty(
            "--accent-color",
            colors.accentColor
        );

        root.style.setProperty(
            "--border-color",
            colors.borderColor
        );

        localStorage.setItem(
            "task-management-theme",
            JSON.stringify(colors)
        );
    }, [colors]);

    useEffect(() => {
        if (!showThemeSettings) {
            return;
        }

        function closeWithEscape(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                setShowThemeSettings(false);
            }
        }

        document.addEventListener(
            "keydown",
            closeWithEscape
        );

        return () => {
            document.removeEventListener(
                "keydown",
                closeWithEscape
            );
        };
    }, [showThemeSettings]);

    function updateColor(
        property: keyof ThemeColors,
        value: string
    ) {
        setColors(
            (currentColors) => ({
                ...currentColors,
                [property]: value
            })
        );
    }

    async function loadTasks() {
        try {
            setError("");

            const response =
                await fetch("/api/tasks");

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

        if (
            Number.isNaN(
                selectedDateTime.getTime()
            )
        ) {
            setError(
                "Please enter a valid due date and time."
            );

            return false;
        }

        if (
            selectedDateTime <=
            new Date()
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

    function startEdit(task: TaskItem) {
        setEditingId(task.id);
        setEditTitle(task.title);
        setEditDescription(
            task.description ?? ""
        );
        setEditStatus(task.status);
        setEditPriority(task.priority);
        setEditDueDate(task.dueDate);
        setEditDueTime(
            task.dueTime.slice(0, 5)
        );
        setEditRemark(
            task.remark ?? ""
        );
        setError("");
    }

    function cancelEdit() {
        setEditingId(null);
        setError("");
    }

    async function saveTask(id: number) {
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

    async function deleteTask(id: number) {
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
                    await readFailure(
                        response,
                        `Failed to delete task. Status: ${response.status}`
                    )
                );

                return;
            }

            if (editingId === id) {
                setEditingId(null);
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

            return [...tasks]
                .filter((task) => {
                    const searchableText =
                        [
                            task.title,
                            task.description,
                            task.remark
                        ]
                            .filter(Boolean)
                            .join(" ")
                            .toLowerCase();

                    const matchesSearch =
                        query === "" ||
                        searchableText.includes(
                            query
                        );

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
                    let firstValue: string;
                    let secondValue: string;

                    if (sortField === "due") {
                        firstValue =
                            `${firstTask.dueDate}T${firstTask.dueTime}`;

                        secondValue =
                            `${secondTask.dueDate}T${secondTask.dueTime}`;
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

    const taskSummary =
        useMemo(() => {
            const pending =
                tasks.filter(
                    (task) =>
                        task.status === "Pending"
                ).length;

            const inProgress =
                tasks.filter(
                    (task) =>
                        task.status === "In Progress"
                ).length;

            const completed =
                tasks.filter(
                    (task) =>
                        task.status === "Completed"
                ).length;

            const percentage =
                tasks.length === 0
                    ? 0
                    : Math.round(
                        completed /
                        tasks.length *
                        100
                    );

            return {
                pending,
                inProgress,
                completed,
                percentage
            };
        }, [tasks]);

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

    function clearFilters() {
        setSearchText("");
        setStatusFilter("All");
        setPriorityFilter("All");
        setSortField("created");
        setSortDirection("asc");
    }

    return (
        <div className="task-page">
            <header className="task-header">
                <div className="task-title">
                    <span className="dashboard-label">
                        Personal Productivity Dashboard
                    </span>

                    <h1>
                        Task Management
                    </h1>

                    <p>
                        Manage your daily tasks and deadlines.
                    </p>
                </div>

                <button
                    type="button"
                    className="open-theme-button"
                    onClick={() =>
                        setShowThemeSettings(true)
                    }
                >
                    🎨 Customize Theme
                </button>
            </header>

            {showThemeSettings && (
                <div
                    className="theme-overlay"
                    onClick={() =>
                        setShowThemeSettings(false)
                    }
                >
                    <aside
                        className="theme-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Theme settings"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <div className="theme-drawer-header">
                            <div>
                                <h2>
                                    Theme Settings
                                </h2>

                                <p>
                                    Customize the page appearance.
                                </p>
                            </div>

                            <button
                                type="button"
                                className="close-theme-button"
                                aria-label="Close theme settings"
                                onClick={() =>
                                    setShowThemeSettings(false)
                                }
                            >
                                ×
                            </button>
                        </div>

                        <div className="theme-preset-buttons">
                            <button
                                type="button"
                                onClick={() =>
                                    setColors(lightColors)
                                }
                            >
                                ☀️ Light
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setColors(darkColors)
                                }
                            >
                                🌙 Dark
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setColors(lightColors)
                                }
                            >
                                ↺ Reset
                            </button>
                        </div>

                        <div className="theme-color-list">
                            {(
                                [
                                    [
                                        "pageBackground",
                                        "Page Background"
                                    ],
                                    [
                                        "cardBackground",
                                        "Card Background"
                                    ],
                                    [
                                        "inputBackground",
                                        "Input Background"
                                    ],
                                    [
                                        "textColor",
                                        "Main Word Color"
                                    ],
                                    [
                                        "secondaryTextColor",
                                        "Secondary Word Color"
                                    ],
                                    [
                                        "accentColor",
                                        "Button Color"
                                    ],
                                    [
                                        "borderColor",
                                        "Border Color"
                                    ]
                                ] as Array<
                                    [
                                        keyof ThemeColors,
                                        string
                                    ]
                                >
                            ).map(
                                ([
                                    property,
                                    label
                                ]) => (
                                    <label key={property}>
                                        <span>
                                            {label}
                                        </span>

                                        <input
                                            type="color"
                                            value={
                                                colors[property]
                                            }
                                            onChange={(event) =>
                                                updateColor(
                                                    property,
                                                    event.target.value
                                                )
                                            }
                                        />
                                    </label>
                                )
                            )}
                        </div>
                    </aside>
                </div>
            )}

            <section
                className="task-summary"
                aria-label="Task summary"
            >
                <article className="summary-card total-summary">
                    <span>Total Tasks</span>
                    <strong>{tasks.length}</strong>
                </article>

                <article className="summary-card pending-summary">
                    <span>Pending</span>
                    <strong>
                        {taskSummary.pending}
                    </strong>
                </article>

                <article className="summary-card progress-summary">
                    <span>In Progress</span>
                    <strong>
                        {taskSummary.inProgress}
                    </strong>
                </article>

                <article className="summary-card completed-summary">
                    <span>Completed</span>
                    <strong>
                        {taskSummary.completed}
                    </strong>
                </article>

                <div className="completion-panel">
                    <div className="completion-heading">
                        <span>
                            Task Progress
                        </span>

                        <strong>
                            {taskSummary.percentage}% Completed
                        </strong>
                    </div>

                    <div
                        className="completion-track"
                        role="progressbar"
                        aria-label="Task completion progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                            taskSummary.percentage
                        }
                    >
                        {tasks.length > 0 && (
                            <>
                                <div
                                    className="progress-segment pending-segment"
                                    style={{
                                        width: `${taskSummary.pending /
                                            tasks.length *
                                            100
                                            }%`
                                    }}
                                />

                                <div
                                    className="progress-segment in-progress-segment"
                                    style={{
                                        width: `${taskSummary.inProgress /
                                            tasks.length *
                                            100
                                            }%`
                                    }}
                                />

                                <div
                                    className="progress-segment completed-segment"
                                    style={{
                                        width: `${taskSummary.completed /
                                            tasks.length *
                                            100
                                            }%`
                                    }}
                                />
                            </>
                        )}
                    </div>

                    <div className="progress-legend">
                        <span>
                            <i className="legend-dot pending-dot" />
                            Pending {taskSummary.pending}
                        </span>

                        <span>
                            <i className="legend-dot in-progress-dot" />
                            In Progress {taskSummary.inProgress}
                        </span>

                        <span>
                            <i className="legend-dot completed-dot" />
                            Completed {taskSummary.completed}
                        </span>
                    </div>
                </div>

            </section>

            {error && (
                <div
                    className="error-message"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <section className="task-form">
                <h2>Add Task</h2>

                <div className="task-form-grid">
                    <div className="full-width">
                        <input
                            aria-label="Task title"
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
                            aria-label="Description"
                            placeholder="Description"
                            value={description}
                            onChange={(event) =>
                                setDescription(
                                    event.target.value
                                )
                            }
                        />
                    </div>

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

                    <TimeInput
                        label="Due time"
                        value={dueTime}
                        dateValue={dueDate}
                        onChange={setDueTime}
                        onDateChange={setDueDate}
                        onError={setError}
                    />

                    <div className="full-width">
                        <textarea
                            aria-label="Remark"
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
                    type="button"
                    className="add-button"
                    onClick={addTask}
                >
                    Add Task
                </button>
            </section>

            <section className="task-list">
                <div className="list-heading">
                    <div>
                        <h2>My Tasks</h2>

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
                        <span>Search</span>

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
                        <span>Status</span>

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
                        <span>Priority</span>

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
                            <span>Sort Tasks</span>

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

                    <button
                        type="button"
                        className="clear-filters-button"
                        onClick={clearFilters}
                    >
                        Clear
                    </button>
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
                            (task) => {
                                const dueInformation =
                                    getDueInformation(
                                        task
                                    );

                                return (
                                    <article
                                        key={task.id}
                                        data-testid="task-card"
                                        className={
                                            `task-card ${getStatusClass(
                                                task.status
                                            )}`
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
                                                        type="button"
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
                                                        type="button"
                                                        className="cancel-button"
                                                        onClick={cancelEdit}
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="task-card-header">
                                                    <h3>
                                                        {task.title}
                                                    </h3>

                                                    <span
                                                        className={
                                                            `due-badge ${dueInformation.className}`
                                                        }
                                                    >
                                                        {dueInformation.text}
                                                    </span>
                                                </div>

                                                <p className="task-description">
                                                    {task.description ||
                                                        "No description"}
                                                </p>

                                                <div className="task-badges">
                                                    <span
                                                        className={
                                                            `status-badge ${getStatusClass(
                                                                task.status
                                                            )}`
                                                        }
                                                    >
                                                        {task.status}
                                                    </span>

                                                    <span
                                                        className={
                                                            `priority-badge ${getPriorityClass(
                                                                task.priority
                                                            )}`
                                                        }
                                                    >
                                                        {task.priority} Priority
                                                    </span>
                                                </div>

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
                                                        type="button"
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
                                                        type="button"
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
                                    </article>
                                );
                            }
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
                                type="button"
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
                                    length: totalPages
                                },
                                (_, index) =>
                                    index + 1
                            ).map(
                                (pageNumber) => (
                                    <button
                                        type="button"
                                        key={pageNumber}
                                        className={
                                            pageNumber ===
                                                safePage
                                                ? "active"
                                                : ""
                                        }
                                        aria-current={
                                            pageNumber ===
                                                safePage
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
                                type="button"
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
            </section>
        </div>
    );
}

export default TaskManagement;