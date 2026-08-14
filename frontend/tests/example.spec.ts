import {
    test,
    expect,
    type APIRequestContext
} from "@playwright/test";

const BASE_URL =
    "http://localhost:3001";

interface CreatedTask {
    id: number;
}

function localDate(
    daysFromToday: number
) {

    const date = new Date();

    date.setDate(
        date.getDate() +
        daysFromToday
    );

    const offset =
        date.getTimezoneOffset() *
        60000;

    return new Date(
        date.getTime() -
        offset
    )
        .toISOString()
        .slice(0, 10);

}

async function createTask(
    request: APIRequestContext,
    overrides:
        Record<string, string> = {}
) {

    const response =
        await request.post(
            `${BASE_URL}/api/tasks`,
            {
                data: {
                    title:
                        "Playwright Task",
                    description:
                        "Created by Playwright",
                    status:
                        "Pending",
                    priority:
                        "Medium",
                    dueDate:
                        localDate(7),
                    dueTime:
                        "15:00:00",
                    remark:
                        "Automated test",
                    ...overrides
                }
            }
        );

    expect(
        response.ok()
    ).toBeTruthy();

    const data: CreatedTask =
        await response.json();

    return data;

}

async function deleteTasks(
    request: APIRequestContext,
    ids: number[]
) {

    for (
        const id of ids
    ) {

        await request.delete(
            `${BASE_URL}/api/tasks/${id}`
        );

    }

}

test(
    "Task Management page should load",
    async ({ page }) => {

        await page.goto(
            BASE_URL
        );

        await expect(
            page.getByRole(
                "heading",
                {
                    name:
                        "Task Management"
                }
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "Search tasks"
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "Filter by status"
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "Filter by priority"
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "Sort by"
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "Sort ascending"
            )
        ).toBeVisible();

        await expect(
            page.getByLabel(
                "View Mode"
            )
        ).toHaveValue(
            "pagination"
        );

    }
);

test(
    "Frontend and API should reject past due dates",
    async ({
        page,
        request
    }) => {

        await page.goto(
            BASE_URL
        );

        const dueDate =
            page.getByLabel(
                "Due date"
            );

        await expect(
            dueDate
        ).toHaveAttribute(
            "min",
            localDate(0)
        );

        await page
            .getByPlaceholder(
                "Task title"
            )
            .fill(
                "Past Date Frontend Test"
            );

        await dueDate.fill(
            localDate(-1)
        );

        await page
            .getByLabel(
                "Due time"
            )
            .fill("10:00");

        await page
            .getByRole(
                "button",
                {
                    name:
                        "Add Task"
                }
            )
            .click();

        await expect(
            page.getByRole(
                "alert"
            )
        ).toContainText(
            "Due date cannot be in the past"
        );

        const response =
            await request.post(
                `${BASE_URL}/api/tasks`,
                {
                    data: {
                        title:
                            "Past Date API Test",
                        description: "",
                        status:
                            "Pending",
                        priority:
                            "Medium",
                        dueDate:
                            localDate(-1),
                        dueTime:
                            "10:00:00",
                        remark: ""
                    }
                }
            );

        expect(
            response.status()
        ).toBe(400);

        const result =
            await response.json();

        expect(
            result.detail
        ).toBe(
            "Due date cannot be in the past."
        );

    }
);

test(
    "User should be able to add update and delete a task",
    async (
        { page },
        testInfo
    ) => {

        const token =
            `CRUD-${testInfo.project.name}-${Date.now()}`;

        const updatedTitle =
            `Updated-${token}`;

        await page.goto(
            BASE_URL
        );

        await page
            .getByPlaceholder(
                "Task title"
            )
            .fill(token);

        await page
            .getByPlaceholder(
                "Description",
                {
                    exact: true
                }
            )
            .fill(
                "Task for CRUD testing"
            );

        await page
            .getByLabel(
                "Due date"
            )
            .fill(
                localDate(5)
            );

        await page
            .getByLabel(
                "Due time"
            )
            .fill("16:00");

        await page
            .getByPlaceholder(
                "Remark / Note"
            )
            .fill(
                "Original remark"
            );

        await page
            .getByRole(
                "button",
                {
                    name:
                        "Add Task"
                }
            )
            .click();

        await page
            .getByLabel(
                "Search tasks"
            )
            .fill(token);

        const taskCard =
            page.getByTestId(
                "task-card"
            );

        await expect(
            taskCard.getByRole(
                "heading",
                {
                    name: token
                }
            )
        ).toBeVisible();

        await taskCard
            .getByRole(
                "button",
                {
                    name: "Edit"
                }
            )
            .click();

        await page
            .getByLabel(
                "Edit title"
            )
            .fill(
                updatedTitle
            );

        await page
            .getByLabel(
                "Edit status"
            )
            .selectOption(
                "In Progress"
            );

        await page
            .getByLabel(
                "Edit priority"
            )
            .selectOption(
                "High"
            );

        await page
            .getByRole(
                "button",
                {
                    name: "Save"
                }
            )
            .click();

        await expect(
            taskCard.getByRole(
                "heading",
                {
                    name:
                        updatedTitle
                }
            )
        ).toBeVisible();

        await expect(
            taskCard
        ).toContainText(
            "In Progress"
        );

        await expect(
            taskCard
        ).toContainText(
            "High"
        );

        await taskCard
            .getByRole(
                "button",
                {
                    name: "Delete"
                }
            )
            .click();

        await expect(
            page.getByText(
                "No tasks match your search or filters."
            )
        ).toBeVisible();

    }
);

test(
    "Long text should wrap inside task card",
    async ({
        page,
        request
    }, testInfo) => {

        const ids: number[] = [];

        const token =
            `WRAP-${testInfo.project.name}-${Date.now()}`;

        const longText =
            "LongUnbrokenText"
                .repeat(35);

        try {

            const task =
                await createTask(
                    request,
                    {
                        title:
                            `${token}-${longText}`,
                        description:
                            longText,
                        remark:
                            longText
                    }
                );

            ids.push(
                task.id
            );

            await page.goto(
                BASE_URL
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(token);

            const card =
                page.getByTestId(
                    "task-card"
                );

            await expect(
                card
            ).toBeVisible();

            const fitsInside =
                await card.evaluate(
                    (element) =>
                        element.scrollWidth <=
                        element.clientWidth
                );

            expect(
                fitsInside
            ).toBeTruthy();

        }
        finally {

            await deleteTasks(
                request,
                ids
            );

        }

    }
);

test(
    "Search filters and sorting should work",
    async ({
        page,
        request
    }, testInfo) => {

        const ids: number[] = [];

        const token =
            `FILTER-${testInfo.project.name}-${Date.now()}`;

        try {

            const firstTask =
                await createTask(
                    request,
                    {
                        title:
                            `${token}-Alpha`,
                        description:
                            "unique-description-search",
                        remark: "",
                        status:
                            "Pending",
                        priority:
                            "Low",
                        dueDate:
                            localDate(3),
                        dueTime:
                            "09:00:00"
                    }
                );

            ids.push(
                firstTask.id
            );

            const secondTask =
                await createTask(
                    request,
                    {
                        title:
                            `${token}-Beta`,
                        description: "",
                        remark:
                            "unique-remark-search",
                        status:
                            "In Progress",
                        priority:
                            "High",
                        dueDate:
                            localDate(4),
                        dueTime:
                            "10:00:00"
                    }
                );

            ids.push(
                secondTask.id
            );

            const thirdTask =
                await createTask(
                    request,
                    {
                        title:
                            `${token}-Gamma`,
                        status:
                            "Completed",
                        priority:
                            "Medium",
                        dueDate:
                            localDate(5),
                        dueTime:
                            "11:00:00"
                    }
                );

            ids.push(
                thirdTask.id
            );

            await page.goto(
                BASE_URL
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(
                    "unique-description-search"
                );

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(1);

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toContainText(
                `${token}-Alpha`
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(
                    "unique-remark-search"
                );

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(1);

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toContainText(
                `${token}-Beta`
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(token);

            await page
                .getByLabel(
                    "Filter by status"
                )
                .selectOption(
                    "In Progress"
                );

            await page
                .getByLabel(
                    "Filter by priority"
                )
                .selectOption(
                    "High"
                );

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(1);

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toContainText(
                `${token}-Beta`
            );

            await page
                .getByLabel(
                    "Filter by status"
                )
                .selectOption(
                    "All"
                );

            await page
                .getByLabel(
                    "Filter by priority"
                )
                .selectOption(
                    "All"
                );

            await page
                .getByLabel(
                    "Sort by"
                )
                .selectOption(
                    "due"
                );

            const headings =
                page
                    .getByTestId(
                        "task-card"
                    )
                    .locator("h3");

            await expect(
                headings.first()
            ).toContainText(
                `${token}-Alpha`
            );

            await page
                .getByLabel(
                    "Sort ascending"
                )
                .click();

            await expect(
                page.getByLabel(
                    "Sort descending"
                )
            ).toBeVisible();

            await expect(
                headings.first()
            ).toContainText(
                `${token}-Gamma`
            );

            await page
                .getByLabel(
                    "Sort by"
                )
                .selectOption(
                    "updated"
                );

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(3);

        }
        finally {

            await deleteTasks(
                request,
                ids
            );

        }

    }
);

test(
    "Pagination page reset and Show All should work",
    async ({
        page,
        request
    }, testInfo) => {

        const ids: number[] = [];

        const token =
            `PAGE-${testInfo.project.name}-${Date.now()}`;

        try {

            for (
                let index = 1;
                index <= 10;
                index++
            ) {

                const numberText =
                    index < 10
                        ? `0${index}`
                        : `${index}`;

                const task =
                    await createTask(
                        request,
                        {
                            title:
                                `${token}-${numberText}`,
                            dueDate:
                                localDate(index),
                            dueTime:
                                "12:00:00"
                        }
                    );

                ids.push(
                    task.id
                );

            }

            await page.goto(
                BASE_URL
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(token);

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(9);

            await expect(
                page.getByRole(
                    "navigation",
                    {
                        name:
                            "Task pagination"
                    }
                )
            ).toBeVisible();

            await expect(
                page.getByRole(
                    "button",
                    {
                        name:
                            "Previous"
                    }
                )
            ).toBeDisabled();

            await expect(
                page.getByRole(
                    "button",
                    {
                        name: "1",
                        exact: true
                    }
                )
            ).toHaveAttribute(
                "aria-current",
                "page"
            );

            await page
                .getByRole(
                    "button",
                    {
                        name: "2",
                        exact: true
                    }
                )
                .click();

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(1);

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(
                    `${token}-01`
                );

            await expect(
                page.getByRole(
                    "button",
                    {
                        name: "1",
                        exact: true
                    }
                )
            ).toHaveAttribute(
                "aria-current",
                "page"
            );

            await page
                .getByLabel(
                    "Search tasks"
                )
                .fill(token);

            await page
                .getByLabel(
                    "View Mode"
                )
                .selectOption(
                    "all"
                );

            await expect(
                page.getByTestId(
                    "task-card"
                )
            ).toHaveCount(10);

            await expect(
                page.getByRole(
                    "navigation",
                    {
                        name:
                            "Task pagination"
                    }
                )
            ).toHaveCount(0);

        }
        finally {

            await deleteTasks(
                request,
                ids
            );

        }

    }
);