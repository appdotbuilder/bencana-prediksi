import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { getTasks } from '../handlers/get_tasks';

// Test task inputs
const testTask1: CreateTaskInput = {
  title: 'First Task',
  description: 'Description for first task'
};

const testTask2: CreateTaskInput = {
  title: 'Second Task',
  description: 'Description for second task'
};

const testTask3: CreateTaskInput = {
  title: 'Third Task',
  description: 'Description for third task'
};

describe('getTasks', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no tasks exist', async () => {
    const result = await getTasks();

    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should fetch all tasks from database', async () => {
    // Create test tasks with separate inserts to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: testTask2.title,
        description: testTask2.description
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(2);
    expect(result[0].title).toEqual(testTask2.title); // Should be second task (newer)
    expect(result[0].description).toEqual(testTask2.description);
    expect(result[1].title).toEqual(testTask1.title); // Should be first task (older)
    expect(result[1].description).toEqual(testTask1.description);
  });

  it('should return tasks with all required fields', async () => {
    // Create a test task
    await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(1);
    const task = result[0];
    
    // Verify all fields are present
    expect(task.id).toBeDefined();
    expect(typeof task.id).toBe('number');
    expect(task.title).toEqual(testTask1.title);
    expect(task.description).toEqual(testTask1.description);
    expect(task.created_at).toBeInstanceOf(Date);
    expect(task.updated_at).toBeInstanceOf(Date);
  });

  it('should return tasks ordered by creation date (newest first)', async () => {
    // Create tasks with small delays to ensure different timestamps
    await db.insert(tasksTable)
      .values({
        title: testTask1.title,
        description: testTask1.description
      })
      .execute();

    // Small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: testTask2.title,
        description: testTask2.description
      })
      .execute();

    // Another small delay
    await new Promise(resolve => setTimeout(resolve, 10));

    await db.insert(tasksTable)
      .values({
        title: testTask3.title,
        description: testTask3.description
      })
      .execute();

    const result = await getTasks();

    expect(result).toHaveLength(3);
    
    // Verify ordering - newest first
    expect(result[0].title).toEqual(testTask3.title); // Most recent
    expect(result[1].title).toEqual(testTask2.title); // Middle
    expect(result[2].title).toEqual(testTask1.title); // Oldest

    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle large number of tasks', async () => {
    // Create multiple tasks
    const taskPromises = [];
    for (let i = 0; i < 50; i++) {
      taskPromises.push(
        db.insert(tasksTable)
          .values({
            title: `Task ${i + 1}`,
            description: `Description for task ${i + 1}`
          })
          .execute()
      );
    }

    await Promise.all(taskPromises);

    const result = await getTasks();

    expect(result).toHaveLength(50);
    
    // Verify all tasks have required fields
    result.forEach(task => {
      expect(task.id).toBeDefined();
      expect(task.title).toMatch(/^Task \d+$/);
      expect(task.description).toMatch(/^Description for task \d+$/);
      expect(task.created_at).toBeInstanceOf(Date);
      expect(task.updated_at).toBeInstanceOf(Date);
    });

    // Verify ordering is maintained
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].created_at >= result[i + 1].created_at).toBe(true);
    }
  });
});