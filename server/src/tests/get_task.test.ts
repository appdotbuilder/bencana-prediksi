import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput } from '../schema';
import { getTask } from '../handlers/get_task';

describe('getTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should retrieve an existing task', async () => {
    // Create a test task first
    const testTask = await db.insert(tasksTable)
      .values({
        title: 'Test Task',
        description: 'A task for testing retrieval'
      })
      .returning()
      .execute();

    const createdTask = testTask[0];
    const input: GetTaskInput = { id: createdTask.id };

    // Retrieve the task
    const result = await getTask(input);

    // Verify the task is returned correctly
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdTask.id);
    expect(result!.title).toEqual('Test Task');
    expect(result!.description).toEqual('A task for testing retrieval');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should return null for non-existent task', async () => {
    const input: GetTaskInput = { id: 999 };

    const result = await getTask(input);

    expect(result).toBeNull();
  });

  it('should handle valid task ID of 1', async () => {
    // Create a task with ID 1 (serial starts at 1)
    const testTask = await db.insert(tasksTable)
      .values({
        title: 'First Task',
        description: 'The first task in the system'
      })
      .returning()
      .execute();

    const input: GetTaskInput = { id: 1 };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(1);
    expect(result!.title).toEqual('First Task');
    expect(result!.description).toEqual('The first task in the system');
  });

  it('should return the correct task when multiple tasks exist', async () => {
    // Create multiple tasks
    const task1 = await db.insert(tasksTable)
      .values({
        title: 'Task 1',
        description: 'First task'
      })
      .returning()
      .execute();

    const task2 = await db.insert(tasksTable)
      .values({
        title: 'Task 2',
        description: 'Second task'
      })
      .returning()
      .execute();

    // Retrieve the second task specifically
    const input: GetTaskInput = { id: task2[0].id };
    const result = await getTask(input);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(task2[0].id);
    expect(result!.title).toEqual('Task 2');
    expect(result!.description).toEqual('Second task');
    
    // Verify it's not the first task
    expect(result!.id).not.toEqual(task1[0].id);
    expect(result!.title).not.toEqual('Task 1');
  });

  it('should handle negative task ID gracefully', async () => {
    const input: GetTaskInput = { id: -1 };

    const result = await getTask(input);

    expect(result).toBeNull();
  });
});