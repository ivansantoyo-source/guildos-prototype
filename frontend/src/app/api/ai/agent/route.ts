// ============================================================================
// GUILDOS — Agentic AI API Endpoint
// POST /api/ai/agent — Run the agentic AI with tool-use capability
// Supports: streaming responses, tool calls, multi-turn conversations
// ============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { runAgentLoop } from '@/lib/ai/agent';
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

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 20;
const RATE_LIMIT_WINDOW = 60_000;

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(request: NextRequest) {
  // Rate limit
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const ua = request.headers.get('user-agent') || 'unknown';
  const rateLimitKey = `${ip}:${ua.slice(0, 32)}`;

  if (!checkRateLimit(rateLimitKey)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Try again shortly.' },
      { status: 429 }
    );
  }

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
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`)
            );
            controller.close();
          }
        },
      });

      return new Response(readable, {
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
}

// GET — health check + available tools
export async function GET() {
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
}
