import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type DeleteTaskInput } from '../schema';
import { deleteTask } from '../handlers/delete_task';
import { eq } from 'drizzle-orm';

// Test inputs
const validDeleteInput: DeleteTaskInput = {
  id: 1
};

const nonExistentDeleteInput: DeleteTaskInput = {
  id: 999
};

describe('deleteTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing task successfully', async () => {
    // First, create a task to delete
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Task to Delete',
        description: 'This task will be deleted in the test'
      })
      .returning()
      .execute();

    const createdTaskId = insertResult[0].id;

    // Delete the task
    const result = await deleteTask({ id: createdTaskId });

    // Verify the deletion was successful
    expect(result.success).toBe(true);

    // Verify the task is actually removed from the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, createdTaskId))
      .execute();

    expect(tasks).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent task', async () => {
    // Try to delete a task that doesn't exist
    const result = await deleteTask(nonExistentDeleteInput);

    // Verify the deletion failed
    expect(result.success).toBe(false);
  });

  it('should handle multiple task deletion scenarios', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'First task description'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Second Task',
        description: 'Second task description'
      })
      .returning()
      .execute();

    // Delete the first task
    const result1 = await deleteTask({ id: task1[0].id });
    expect(result1.success).toBe(true);

    // Verify first task is deleted but second remains
    const remainingTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(remainingTasks).toHaveLength(1);
    expect(remainingTasks[0].id).toEqual(task2[0].id);
    expect(remainingTasks[0].title).toEqual('Second Task');

    // Delete the second task
    const result2 = await deleteTask({ id: task2[0].id });
    expect(result2.success).toBe(true);

    // Verify all tasks are deleted
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(0);
  });

  it('should verify database state after deletion', async () => {
    // Create a task
    const insertResult = await db.insert(tasksTable)
      .values({
        title: 'Database State Test',
        description: 'Testing database state after deletion'
      })
      .returning()
      .execute();

    const taskId = insertResult[0].id;

    // Verify task exists before deletion
    const beforeDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(beforeDeletion).toHaveLength(1);
    expect(beforeDeletion[0].title).toEqual('Database State Test');

    // Delete the task
    const deleteResult = await deleteTask({ id: taskId });
    expect(deleteResult.success).toBe(true);

    // Verify task no longer exists after deletion
    const afterDeletion = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, taskId))
      .execute();

    expect(afterDeletion).toHaveLength(0);
  });
});