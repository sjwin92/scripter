import type { ScriptElement } from "../types";

export interface OutlineItem {
  id: string;
  index: number;
  type: "scene_heading" | "act_break";
  label: string;
}

export function buildOutline(elements: ScriptElement[]): OutlineItem[] {
  const items: OutlineItem[] = [];
  elements.forEach((el, index) => {
    if (el.type !== "scene_heading" && el.type !== "act_break") return;
    items.push({
      id: el.id,
      index,
      type: el.type,
      label: /^INT\.\s*$/i.test(el.text.trim())
        ? "Untitled scene"
        : el.text.trim() || (el.type === "act_break" ? "Act break" : "Untitled scene"),
    });
  });
  return items;
}

export function SceneList({
  items,
  activeId,
  onJump,
}: {
  items: OutlineItem[];
  activeId: string | null;
  onJump: (id: string) => void;
}) {
  return (
    <nav className="scene-list" aria-label="Scenes">
      <header>
        <h2>Scenes</h2>
        <span>{items.filter((i) => i.type === "scene_heading").length}</span>
      </header>
      {items.length === 0 ? (
        <p className="quiet">Add a slugline (INT./EXT.) to start a scene.</p>
      ) : (
        <ol>
          {items.map((item) => (
            <li key={item.id}>
              <button
                className={`${item.type} ${item.id === activeId ? "active" : ""}`}
                onClick={() => onJump(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
