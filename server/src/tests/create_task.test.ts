import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput } from '../schema';
import { createTask } from '../handlers/create_task';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateTaskInput = {
  title: 'Test Task',
  description: 'A task for testing'
};

describe('createTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a task', async () => {
    const result = await createTask(testInput);

    // Basic field validation
    expect(result.title).toEqual('Test Task');
    expect(result.description).toEqual('A task for testing');
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save task to database', async () => {
    const result = await createTask(testInput);

    // Query using proper drizzle syntax
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Test Task');
    expect(tasks[0].description).toEqual('A task for testing');
    expect(tasks[0].created_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
  });

  it('should handle empty description', async () => {
    const inputWithEmptyDescription: CreateTaskInput = {
      title: 'Task with Empty Description',
      description: ''
    };

    const result = await createTask(inputWithEmptyDescription);

    expect(result.title).toEqual('Task with Empty Description');
    expect(result.description).toEqual('');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should handle long task title and description', async () => {
    const longInput: CreateTaskInput = {
      title: 'Very Long Task Title '.repeat(10).trim(),
      description: 'Very long task description that contains lots of details about what this task should accomplish '.repeat(20).trim()
    };

    const result = await createTask(longInput);

    expect(result.title).toEqual(longInput.title);
    expect(result.description).toEqual(longInput.description);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify it was saved correctly
    const savedTasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, result.id))
      .execute();

    expect(savedTasks[0].title).toEqual(longInput.title);
    expect(savedTasks[0].description).toEqual(longInput.description);
  });

  it('should create multiple tasks with unique IDs', async () => {
    const task1 = await createTask({
      title: 'First Task',
      description: 'First task description'
    });

    const task2 = await createTask({
      title: 'Second Task',
      description: 'Second task description'
    });

    // Verify unique IDs
    expect(task1.id).not.toEqual(task2.id);
    expect(task1.title).toEqual('First Task');
    expect(task2.title).toEqual('Second Task');

    // Verify both tasks exist in database
    const allTasks = await db.select()
      .from(tasksTable)
      .execute();

    expect(allTasks).toHaveLength(2);
    const titles = allTasks.map(task => task.title);
    expect(titles).toContain('First Task');
    expect(titles).toContain('Second Task');
  });

  it('should set timestamps correctly', async () => {
    const beforeCreation = new Date();
    
    const result = await createTask(testInput);
    
    const afterCreation = new Date();

    // Verify timestamps are within expected range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
    
    // For newly created tasks, created_at and updated_at should be very close
    const timeDiff = Math.abs(result.updated_at.getTime() - result.created_at.getTime());
    expect(timeDiff).toBeLessThan(1000); // Less than 1 second difference
  });
});