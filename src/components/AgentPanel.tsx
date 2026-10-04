import { useState, useRef, useEffect } from 'react';
import type { UIMessage } from '../useAgent';
import MicButton from './MicButton';

type Props = {
  open: boolean;
  onClose: () => void;
  messages: UIMessage[];
  isLoading: boolean;
  onSend: (text: string) => void;
  onClear: () => void;
};

const TOOL_LABELS: Record<string, string> = {
  list_actions: 'Reading actions',
  create_action: 'Creating action',
  create_multiple_actions: 'Creating actions',
  update_action: 'Updating action',
  delete_action: 'Deleting action',
};

export default function AgentPanel({ open, onClose, messages, isLoading, onSend, onClear }: Props) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {open && <div className="agent-backdrop" onClick={onClose} />}

      <div className={`agent-panel${open ? ' agent-panel-open' : ''}`}>
        {/* Header */}
        <div className="agent-panel-header">
          <div className="agent-panel-title">
            <span className="agent-panel-logo">EA</span>
            <span>Assistant</span>
          </div>
          <div className="agent-header-btns">
            {messages.length > 0 && (
              <button className="icon-btn" onClick={onClear} title="Clear conversation">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M1.5 11.5L6.5 6.5M11.5 1.5L6.5 6.5M6.5 6.5L1.5 1.5M6.5 6.5L11.5 11.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
            )}
            <button className="icon-btn" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="agent-messages">
          {messages.length === 0 && (
            <div className="agent-welcome">
              <div className="agent-welcome-icon">EA</div>
              <p className="agent-welcome-title">How can I help?</p>
              <div className="agent-suggestions">
                {[
                  'Show me all open urgent items',
                  'What\'s overdue this week?',
                  'Create a task to review the website',
                  'Summarize what\'s in progress',
                ].map(s => (
                  <button key={s} className="suggestion-btn" onClick={() => onSend(s)}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`agent-msg agent-msg-${msg.role}`}>
              {msg.toolCalls && msg.toolCalls.length > 0 && (
                <div className="agent-tool-calls">
                  {msg.toolCalls.map((tc, i) => (
                    <span key={i} className={`tool-badge${tc.done ? ' tool-badge-done' : ' tool-badge-running'}`}>
                      {tc.done
                        ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <span className="tool-spinner" />
                      }
                      {TOOL_LABELS[tc.name] ?? tc.name}
                    </span>
                  ))}
                </div>
              )}
              {msg.content && (
                <div className={`agent-bubble${msg.isError ? ' agent-bubble-error' : ''}`}>
                  {msg.content}
                </div>
              )}
              {!msg.content && msg.role === 'assistant' && isLoading && (
                <div className="agent-bubble agent-typing">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="agent-input-area">
          <MicButton
            onTranscript={text => setInput(i => i ? `${i} ${text}` : text)}
            title="Speak to assistant"
          />
          <textarea
            ref={inputRef}
            className="form-input agent-input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message EA…"
            rows={1}
            disabled={isLoading}
          />
          <button
            className="agent-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            title="Send"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13.5 8L2.5 2.5l1.8 5.5-1.8 5.5 11-5.5z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
    </>
  );
}
