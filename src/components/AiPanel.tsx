import { AI_ACTIONS, hasLiveAi } from "../ai";
import type { AiAction, AiSuggestion } from "../types";

export function AiPanel({
  busy,
  suggestion,
  editing,
  draft,
  onDraft,
  onStartEdit,
  onCancelEdit,
  onRun,
  onAccept,
  onReject,
}: {
  busy: boolean;
  suggestion: AiSuggestion | null;
  editing: boolean;
  draft: string;
  onDraft: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onRun: (action: AiAction) => void;
  onAccept: () => void;
  onReject: () => void;
}) {
  const live = hasLiveAi();

  return (
    <div className="ai-panel">
      <p className="ai-positioning">
        Assist, don’t replace. Suggestions stay in this margin until you accept them. There is no “write the
        script” button.
      </p>
      <div className="ai-actions">
        {AI_ACTIONS.map((action) => (
          <button key={action.id} disabled={busy} onClick={() => onRun(action.id)}>
            <strong>{action.label}</strong>
            <span>{action.hint}</span>
          </button>
        ))}
      </div>

      {busy && <div className="ai-pending">Listening to this scene…</div>}

      {suggestion && !busy && (
        <section className="suggestion">
          <header>
            <h3>{suggestion.title}</h3>
            <span className={`source ${suggestion.source}`}>{suggestion.source === "live" ? "Live" : "Demo"}</span>
          </header>
          {editing ? (
            <textarea className="suggest-edit" value={draft} onChange={(e) => onDraft(e.target.value)} rows={10} />
          ) : (
            <pre>{suggestion.body}</pre>
          )}
          <footer>
            <button className="primary" onClick={onAccept}>
              Accept
            </button>
            {editing ? (
              <button className="ghost" onClick={onCancelEdit}>
                Cancel edit
              </button>
            ) : (
              <button className="ghost" onClick={onStartEdit}>
                Edit
              </button>
            )}
            <button className="ghost" onClick={onReject}>
              Reject
            </button>
          </footer>
          {!suggestion.insertable && (
            <p className="quiet">Accept copies this to the clipboard. It is not dropped onto the page.</p>
          )}
        </section>
      )}

      <p className="privacy">
        {live
          ? "Live assistant is on via your local API key. Your scripts are not used to train models."
          : "Demo mode — no API key. Suggestions are local and contextual. Your scripts are not used to train models."}
      </p>
    </div>
  );
}
