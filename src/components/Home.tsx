import { estimatePageCount } from "../pagination";
import { displayTitle } from "../structure";
import type { Project } from "../types";
import { IconFilm, IconMoon, IconPlus, IconSun, IconTrash, IconTv } from "./Icons";

function relativeTime(ts: number): string {
  const delta = Date.now() - ts;
  const mins = Math.floor(delta / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function Home({
  projects,
  theme,
  onToggleTheme,
  onNew,
  onOpen,
  onDelete,
}: {
  projects: Project[];
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onNew: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const sorted = [...projects].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="home">
      <header className="home-top">
        <div className="brand">
          <span className="mark">S</span>
          <div>
            <strong>Scripter</strong>
            <p>You write. Format holds. AI assists — it never takes over.</p>
          </div>
        </div>
        <div className="home-actions">
          <button className="ghost" onClick={onToggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <IconSun /> : <IconMoon />}
          </button>
          <button className="primary" onClick={onNew}>
            <IconPlus /> New script
          </button>
        </div>
      </header>

      <section className="home-promise">
        <p>
          <strong>Assist, don’t replace.</strong> No full-script generation from a one-liner.
        </p>
        <p>
          <strong>Format is non-negotiable.</strong> Sluglines, cues, and dialogue land where the industry expects.
        </p>
        <p>
          <strong>Privacy.</strong> Your scripts are not used to train models.
        </p>
      </section>

      {sorted.length === 0 ? (
        <div className="empty-projects">
          <h2>No scripts yet</h2>
          <p>Start a feature or a TV episode. The page stays paper; the assistant stays in the margin.</p>
          <button className="primary" onClick={onNew}>
            <IconPlus /> Create a project
          </button>
        </div>
      ) : (
        <ul className="project-grid">
          {sorted.map((project) => (
            <li key={project.id}>
              <button className="project-card" onClick={() => onOpen(project.id)}>
                <span className={`kind-badge ${project.kind}`}>
                  {project.kind === "feature" ? <IconFilm /> : <IconTv />}
                  {project.kind === "feature" ? "Feature" : project.titlePage.duration === "hour" ? "TV · Hour" : "TV · Half-hour"}
                </span>
                <h3>{displayTitle(project)}</h3>
                <p>{project.titlePage.writtenBy ? `Written by ${project.titlePage.writtenBy}` : "No writer credited yet"}</p>
                <footer>
                  <span>{estimatePageCount(project.elements)} pp</span>
                  <span>{relativeTime(project.updatedAt)}</span>
                </footer>
              </button>
              <button
                className="icon-danger"
                aria-label={`Delete ${displayTitle(project)}`}
                onClick={() => {
                  if (confirm(`Delete “${displayTitle(project)}”? This cannot be undone.`)) {
                    onDelete(project.id);
                  }
                }}
              >
                <IconTrash />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
