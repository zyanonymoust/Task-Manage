import { test, expect } from '@playwright/test';

test('Task Management page should load', async ({ page }) => {

    await page.goto('http://localhost:3001');

    await expect(
        page.getByRole('heading', {
            name: 'Task Management'
        })
    ).toBeVisible();

});

test('User should be able to add a task', async ({ page }, testInfo) => {

    const taskTitle =
        `Playwright Test Task ${testInfo.project.name} ${Date.now()}`;

    await page.goto('http://localhost:3001');

    await page
        .getByPlaceholder('Task title')
        .fill(taskTitle);

    await page
        .locator('textarea')
        .first()
        .fill('Created automatically by Playwright');

    await page
        .locator('input[type="date"]')
        .fill('2026-08-20');

    await page
        .locator('input[type="time"]')
        .fill('15:00');

    await page
        .getByRole('button', {
            name: 'Add Task'
        })
        .click();

    const createdHeading =
        page.getByRole('heading', {
            name: taskTitle
        });

    await expect(createdHeading).toBeVisible();

    const createdCard =
        createdHeading.locator(
            'xpath=ancestor::*[.//button[normalize-space()="Delete"]][1]'
        );

    await createdCard
        .getByRole('button', {
            name: 'Delete'
        })
        .click();

    await expect(createdHeading).not.toBeVisible();

});

test('User should be able to update a task', async ({ page }, testInfo) => {

    const taskTitle =
        `Update Test ${testInfo.project.name} ${Date.now()}`;

    const updatedTitle =
        `Updated ${taskTitle}`;

    await page.goto('http://localhost:3001');

    await page
        .getByPlaceholder('Task title')
        .fill(taskTitle);

    await page
        .locator('textarea')
        .first()
        .fill('Task for update testing');

    await page
        .locator('input[type="date"]')
        .fill('2026-08-20');

    await page
        .locator('input[type="time"]')
        .fill('16:00');

    await page
        .getByRole('button', {
            name: 'Add Task'
        })
        .click();

    const taskHeading =
        page.getByRole('heading', {
            name: taskTitle
        });

    await expect(taskHeading).toBeVisible();

    const taskCard =
        taskHeading.locator(
            'xpath=ancestor::*[.//button[normalize-space()="Edit"]][1]'
        );

    await taskCard
        .getByRole('button', {
            name: 'Edit'
        })
        .click();

    const inputs = page.locator('input');

    const inputCount = await inputs.count();

    for (let i = 0; i < inputCount; i++) {

        const input = inputs.nth(i);

        if (await input.inputValue() === taskTitle) {

            await input.fill(updatedTitle);

            break;

        }

    }

    await page
        .getByRole('button', {
            name: 'Save'
        })
        .click();

    const updatedHeading =
        page.getByRole('heading', {
            name: updatedTitle
        });

    await expect(updatedHeading).toBeVisible();

    const updatedCard =
        updatedHeading.locator(
            'xpath=ancestor::*[.//button[normalize-space()="Delete"]][1]'
        );

    await updatedCard
        .getByRole('button', {
            name: 'Delete'
        })
        .click();

    await expect(updatedHeading).not.toBeVisible();

});

test('User should be able to delete a task', async ({ page }, testInfo) => {

    const taskTitle =
        `Delete Test ${testInfo.project.name} ${Date.now()}`;

    await page.goto('http://localhost:3001');

    await page
        .getByPlaceholder('Task title')
        .fill(taskTitle);

    await page
        .locator('textarea')
        .first()
        .fill('Delete testing');

    await page
        .locator('input[type="date"]')
        .fill('2026-08-20');

    await page
        .locator('input[type="time"]')
        .fill('17:00');

    await page
        .getByRole('button', {
            name: 'Add Task'
        })
        .click();

    const taskHeading =
        page.getByRole('heading', {
            name: taskTitle
        });

    await expect(taskHeading).toBeVisible();

    const taskCard =
        taskHeading.locator(
            'xpath=ancestor::*[.//button[normalize-space()="Delete"]][1]'
        );

    await taskCard
        .getByRole('button', {
            name: 'Delete'
        })
        .click();

    await expect(taskHeading).not.toBeVisible();

});