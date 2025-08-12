import { db } from '../db';
import { tasksTable } from '../db/schema';
import { type GetTaskInput, type Task } from '../schema';
import { eq } from 'drizzle-orm';

export async function getTask(input: GetTaskInput): Promise<Task | null> {
  try {
    // Query task by ID
    const result = await db.select()
      .from(tasksTable)
      .where(eq(tasksTable.id, input.id))
      .execute();

    // Return the task if found, null otherwise
    return result.length > 0 ? result[0] : null;
  } catch (error) {
    console.error('Task retrieval failed:', error);
    throw error;
  }
}