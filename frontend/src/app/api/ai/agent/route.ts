// ============================================================================
// GUILDOS — Agentic AI API Endpoint
// POST /api/ai/agent — Run the agentic AI with tool-use capability
// Supports: streaming responses, tool calls, multi-turn conversations
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentLoop } from '@/lib/ai/agent';
import { withHardening } from '@/lib/auth/server-auth';
import type { AgentMessage } from '@/lib/types';

const AgentQuerySchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000),
  history: z
    .array(
      z.object({
        id: z.string(),
        role: z.enum(['user', 'assistant', 'system', 'tool']),
        content: z.string(),
        tool_calls: z.array(z.any()).optional(),
        timestamp: z.string(),
      })
    )
    .optional()
    .default([]),
  session_id: z.string().optional(),
  mode: z.enum(['merchant', 'customer']).optional().default('merchant'),
  stream: z.boolean().optional().default(false),
});

export const POST = withHardening(
  async (request, session) => {

  try {
    const body = await request.json();
    const parsed = AgentQuerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { message, history, mode, stream } = parsed.data;

    // Check if AI is available (NVIDIA NIM key configured)
    const useAI = !!process.env.NVIDIA_NIM_API_KEY && process.env.NODE_ENV === 'production';

    if (stream) {
      // SSE streaming response
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          try {
            // Send thinking event
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'thinking', content: 'Analyzing your request...' })}\n\n`)
            );

            const { message: agentMessage, toolCalls } = await runAgentLoop(
              message,
              history as AgentMessage[],
              mode,
              useAI
            );

            // Send tool calls if any
            if (toolCalls.length > 0) {
              for (const tc of toolCalls) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'tool_call', toolCall: tc })}\n\n`)
                );
                // Small delay for animation
                await new Promise((r) => setTimeout(r, 200));
              }
            }

            // Send final message
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'message', message: agentMessage })}\n\n`)
            );

            // Done
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
            controller.close();
          } catch (error) {
            console.error('[ai/agent] SSE stream error:', error);
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: 'Processing failed' })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new NextResponse(readable, {
        status: 200,
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Non-streaming response
    const { message: agentMessage, toolCalls } = await runAgentLoop(
      message,
      history as AgentMessage[],
      mode,
      useAI
    );

    return NextResponse.json({
      message: agentMessage,
      tool_calls: toolCalls,
      mode,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[ai/agent] Error:', error);
    return NextResponse.json(
      { error: 'Agent processing failed. Please try again.' },
      { status: 500 }
    );
  }
  },
  {
    rateLimit: { key: 'ai-agent', maxRequests: 20, windowMs: 60_000 },
  }
);

// GET — health check + available tools (requires auth)
export const GET = withHardening(
  async (req, session) => {
    const { getToolDefinitions } = await import('@/lib/ai/tools');
    const tools = getToolDefinitions();

    return NextResponse.json({
      status: 'operational',
      mode: process.env.NVIDIA_NIM_API_KEY ? 'live' : 'demo',
      available_tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        category: t.category,
      })),
      tool_count: tools.length,
      capabilities: [
        'inventory_search',
        'bounty_management',
        'order_tracking',
        'market_pricing',
        'customer_lookup',
        'store_analytics',
        'product_recommendations',
      ],
    });
  },
  {
    rateLimit: { key: 'ai-agent-health', maxRequests: 30, windowMs: 60_000 },
  }
);
