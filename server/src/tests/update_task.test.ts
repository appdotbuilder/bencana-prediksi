import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type CreateTaskInput, type UpdateTaskInput } from '../schema';
import { updateTask } from '../handlers/update_task';
import { eq } from 'drizzle-orm';

// Helper function to create a test task
const createTestTask = async (input: CreateTaskInput) => {
  const result = await db.insert(tasksTable)
    .values({
      title: input.title,
      description: input.description
    })
    .returning()
    .execute();
  
  return result[0];
};

describe('updateTask', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update task title only', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Original description'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should update task description only', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('Original Title'); // Should remain unchanged
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should update both title and description', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title',
      description: 'Updated description'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('Updated Title');
    expect(result!.description).toEqual('Updated description');
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should update task in database', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Database Updated Title',
      description: 'Database Updated description'
    };

    await updateTask(updateInput);

    // Verify the task was updated in the database
    const tasks = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, testTask.id))
      .execute();

    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toEqual('Database Updated Title');
    expect(tasks[0].description).toEqual('Database Updated description');
    expect(tasks[0].updated_at).toBeInstanceOf(Date);
    expect(tasks[0].updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should return null for non-existent task', async () => {
    const updateInput: UpdateTaskInput = {
      id: 999999, // Non-existent ID
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).toBeNull();
  });

  it('should update updated_at timestamp even with no field changes', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Test Title',
      description: 'Test description'
    });

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateTaskInput = {
      id: testTask.id
      // No title or description provided
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('Test Title'); // Should remain unchanged
    expect(result!.description).toEqual('Test description'); // Should remain unchanged
    expect(result!.updated_at).toBeInstanceOf(Date);
    expect(result!.updated_at.getTime()).toBeGreaterThan(testTask.updated_at.getTime());
  });

  it('should handle empty string updates correctly', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: '',
      description: ''
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(testTask.id);
    expect(result!.title).toEqual('');
    expect(result!.description).toEqual('');
    expect(result!.updated_at).toBeInstanceOf(Date);
  });

  it('should maintain created_at timestamp unchanged', async () => {
    // Create test task
    const testTask = await createTestTask({
      title: 'Original Title',
      description: 'Original description'
    });

    const updateInput: UpdateTaskInput = {
      id: testTask.id,
      title: 'Updated Title'
    };

    const result = await updateTask(updateInput);

    expect(result).not.toBeNull();
    expect(result!.created_at.getTime()).toEqual(testTask.created_at.getTime());
  });
});