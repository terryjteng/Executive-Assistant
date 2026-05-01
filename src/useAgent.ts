import { useState, useRef, useCallback } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import type { ActionItem, AreaTag, Priority, Status } from './actionSchema';
import type { NewAction } from './useStudioActions';

const TODAY = new Date().toISOString().split('T')[0];

const SYSTEM_PROMPT = `You are EA, an executive assistant AI for Kato8 Studios. You help the studio director manage action items, track tasks, and stay organized.

You have access to the studio's action tracking system and can list, create, update, and delete action items. Today's date is ${TODAY}.

Area tags: overall (Overall Studio), web (Website/UI·UX), social (Social & Marketing), last-light (Last Light), corebound (Corebound), big-boss-cleanup (Big Boss Cleanup).

When organizing tasks, be decisive — mark things urgent if they need attention, group by area when summarizing, and highlight overdue items. After making changes, confirm concisely what you did. Keep responses brief and actionable.`;

const TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'list_actions',
    description: 'List action items, optionally filtered by area, priority, status, owner, or due date.',
    input_schema: {
      type: 'object' as const,
      properties: {
        areaTag: { type: 'string', enum: ['overall', 'web', 'social', 'last-light', 'corebound', 'big-boss-cleanup'] },
        priority: { type: 'string', enum: ['normal', 'urgent', 'decision'] },
        status: { type: 'string', enum: ['open', 'in-progress', 'done'] },
        owner: { type: 'string', description: 'Filter by owner name (case-insensitive)' },
        dueBefore: { type: 'string', description: 'ISO date YYYY-MM-DD' },
        dueAfter: { type: 'string', description: 'ISO date YYYY-MM-DD' },
      },
      required: [],
    },
  },
  {
    name: 'create_action',
    description: 'Create a new action item.',
    input_schema: {
      type: 'object' as const,
      properties: {
        task: { type: 'string', description: 'Description of the action item' },
        owner: { type: 'string' },
        dueDate: { type: 'string', description: 'YYYY-MM-DD format' },
        areaTag: { type: 'string', enum: ['overall', 'web', 'social', 'last-light', 'corebound', 'big-boss-cleanup'] },
        priority: { type: 'string', enum: ['normal', 'urgent', 'decision'] },
        status: { type: 'string', enum: ['open', 'in-progress', 'done'] },
        notes: { type: 'string' },
      },
      required: ['task'],
    },
  },
  {
    name: 'create_multiple_actions',
    description: 'Create several action items at once.',
    input_schema: {
      type: 'object' as const,
      properties: {
        actions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              task: { type: 'string' },
              owner: { type: 'string' },
              dueDate: { type: 'string' },
              areaTag: { type: 'string', enum: ['overall', 'web', 'social', 'last-light', 'corebound', 'big-boss-cleanup'] },
              priority: { type: 'string', enum: ['normal', 'urgent', 'decision'] },
              status: { type: 'string', enum: ['open', 'in-progress', 'done'] },
              notes: { type: 'string' },
            },
            required: ['task'],
          },
        },
      },
      required: ['actions'],
    },
  },
  {
    name: 'update_action',
    description: 'Update an existing action item by ID. Only provided fields are changed.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
        task: { type: 'string' },
        owner: { type: 'string' },
        dueDate: { type: 'string' },
        areaTag: { type: 'string', enum: ['overall', 'web', 'social', 'last-light', 'corebound', 'big-boss-cleanup'] },
        priority: { type: 'string', enum: ['normal', 'urgent', 'decision'] },
        status: { type: 'string', enum: ['open', 'in-progress', 'done'] },
        notes: { type: 'string' },
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_action',
    description: 'Permanently delete an action item by ID.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
  },
];

export type UIMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: Array<{ name: string; done: boolean }>;
  isError?: boolean;
};

type FilterOpts = {
  areaTag?: AreaTag;
  priority?: Priority;
  status?: Status;
  owner?: string;
  dueBefore?: string;
  dueAfter?: string;
};

type StudioActions = {
  actions: ActionItem[];
  addAction: (data: NewAction) => ActionItem;
  addActions: (data: NewAction[]) => ActionItem[];
  updateAction: (id: string, patch: Partial<ActionItem>) => void;
  removeAction: (id: string) => void;
  filterBy: (opts: FilterOpts) => ActionItem[];
};

const KEY_STORAGE = 'ea_anthropic_key';

function uid() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export function useAgent(studio: StudioActions) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) ?? '');
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const historyRef = useRef<Anthropic.Messages.MessageParam[]>([]);
  const studioRef = useRef(studio);
  studioRef.current = studio;

  const saveApiKey = useCallback((key: string) => {
    localStorage.setItem(KEY_STORAGE, key);
    setApiKey(key);
  }, []);

  const clearChat = useCallback(() => {
    historyRef.current = [];
    setMessages([]);
  }, []);

  const executeTool = useCallback((name: string, input: Record<string, unknown>) => {
    const s = studioRef.current;
    switch (name) {
      case 'list_actions':
        return { count: s.actions.length, actions: s.filterBy(input as FilterOpts) };
      case 'create_action':
        return { success: true, action: s.addAction(input as NewAction) };
      case 'create_multiple_actions': {
        const items = (input as { actions: NewAction[] }).actions;
        return { success: true, count: items.length, actions: s.addActions(items) };
      }
      case 'update_action': {
        const { id, ...patch } = input as { id: string } & Partial<ActionItem>;
        s.updateAction(id, patch);
        return { success: true, id };
      }
      case 'delete_action':
        s.removeAction((input as { id: string }).id);
        return { success: true };
      default:
        return { error: `Unknown tool: ${name}` };
    }
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    if (!apiKey || isLoading) return;

    setMessages(prev => [...prev, { id: uid(), role: 'user', content: text }]);
    const assistantId = uid();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '', toolCalls: [] }]);
    setIsLoading(true);

    historyRef.current = [...historyRef.current, { role: 'user', content: text }];

    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    try {
      let continueLoop = true;
      while (continueLoop) {
        const response = await client.messages.create({
          model: 'claude-opus-4-7',
          max_tokens: 4096,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          thinking: { type: 'adaptive' } as any,
          system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
          tools: TOOLS,
          messages: historyRef.current,
        });

        historyRef.current = [...historyRef.current, { role: 'assistant', content: response.content }];

        if (response.stop_reason === 'end_turn') {
          const text = response.content
            .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
            .map(b => b.text)
            .join('');
          setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: text } : m));
          continueLoop = false;
        } else if (response.stop_reason === 'tool_use') {
          const toolBlocks = response.content.filter(
            (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use'
          );

          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, toolCalls: toolBlocks.map(t => ({ name: t.name, done: false })) }
              : m
          ));

          const results: Anthropic.Messages.ToolResultBlockParam[] = toolBlocks.map(t => ({
            type: 'tool_result',
            tool_use_id: t.id,
            content: JSON.stringify(executeTool(t.name, t.input as Record<string, unknown>)),
          }));

          setMessages(prev => prev.map(m =>
            m.id === assistantId
              ? { ...m, toolCalls: toolBlocks.map(t => ({ name: t.name, done: true })) }
              : m
          ));

          historyRef.current = [...historyRef.current, { role: 'user', content: results }];
        } else {
          continueLoop = false;
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'An error occurred';
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: msg, isError: true } : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, isLoading, executeTool]);

  return { apiKey, saveApiKey, messages, isLoading, sendMessage, clearChat };
}
