import { useState, useRef, useEffect } from 'react';
import type { UIMessage } from '../useAgent';
import MicButton from './MicButton';

type Props = {
  open: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
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

export default function AgentPanel({ open, onClose, apiKey, onSaveApiKey, messages, isLoading, onSend, onClear }: Props) {
  const [input, setInput] = useState('');
  const [keyDraft, setKeyDraft] = useState('');
  const [showKeySetup, setShowKeySetup] = useState(!apiKey);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!apiKey) setShowKeySetup(true);
  }, [apiKey]);

  useEffect(() => {
    if (open && apiKey && !showKeySetup) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, apiKey, showKeySetup]);

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

  const handleSaveKey = () => {
    const key = keyDraft.trim();
    if (!key) return;
    onSaveApiKey(key);
    setKeyDraft('');
    setShowKeySetup(false);
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
            <button
              className="icon-btn"
              onClick={() => setShowKeySetup(s => !s)}
              title="API key settings"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="2.2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M7 1v1.4M7 11.6V13M1 7h1.4M11.6 7H13M2.93 2.93l.99.99M10.08 10.08l.99.99M2.93 11.07l.99-.99M10.08 3.92l.99-.99" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
            <button className="icon-btn" onClick={onClose} title="Close">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* API key setup */}
        {showKeySetup && (
          <div className="agent-key-setup">
            <p className="agent-key-title">Anthropic API key</p>
            <p className="agent-key-hint">
              Stored in your browser only. Never sent anywhere except directly to Anthropic.
            </p>
            <div className="agent-key-row">
              <input
                type="password"
                className="form-input"
                value={keyDraft}
                onChange={e => setKeyDraft(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveKey()}
                placeholder="sk-ant-..."
                autoFocus={!apiKey}
              />
              <button className="btn btn-primary btn-sm" onClick={handleSaveKey} disabled={!keyDraft.trim()}>
                Save
              </button>
            </div>
            {apiKey && (
              <p className="agent-key-saved">
                Key saved.{' '}
                <button className="link-btn" onClick={() => setShowKeySetup(false)}>Hide</button>
              </p>
            )}
          </div>
        )}

        {/* Messages */}
        <div className="agent-messages">
          {messages.length === 0 && !showKeySetup && (
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
        {!showKeySetup && (
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
              placeholder={apiKey ? 'Message EA…' : 'Add API key above to start'}
              rows={1}
              disabled={isLoading || !apiKey}
            />
            <button
              className="agent-send-btn"
              onClick={handleSend}
              disabled={!input.trim() || isLoading || !apiKey}
              title="Send"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M13.5 8L2.5 2.5l1.8 5.5-1.8 5.5 11-5.5z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
