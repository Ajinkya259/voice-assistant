import { createClient } from '@/lib/supabase/server';
import { getAllMemories, deleteMemory, deleteAllMemories } from '@/lib/mem0';
import { deleteUserMessages } from '@/lib/qdrant';

/**
 * GET /api/memory - Get all memories for the current user
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const memories = await getAllMemories(user.id);

    return Response.json({ memories });
  } catch (error) {
    console.error('Get memories error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to get memories' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/memory - Delete a specific memory or all memories
 */
export async function DELETE(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const memoryId = searchParams.get('id');
    const deleteAll = searchParams.get('all') === 'true';

    if (deleteAll) {
      // Delete all memories from both systems
      await Promise.all([
        deleteAllMemories(user.id),
        deleteUserMessages(user.id),
      ]);

      return Response.json({ success: true, message: 'All memories deleted' });
    } else if (memoryId) {
      // Delete specific memory from Mem0
      const success = await deleteMemory(memoryId);

      if (success) {
        return Response.json({ success: true, message: 'Memory deleted' });
      } else {
        return Response.json({ error: 'Failed to delete memory' }, { status: 500 });
      }
    } else {
      return Response.json({ error: 'Missing memory ID or deleteAll flag' }, { status: 400 });
    }
  } catch (error) {
    console.error('Delete memory error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to delete memory' },
      { status: 500 }
    );
  }
}
