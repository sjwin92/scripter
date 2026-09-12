import type { CharacterProfile } from "../types";

export function CharactersPanel({
  profiles,
  onJump,
}: {
  profiles: CharacterProfile[];
  onJump: (elementId: string) => void;
}) {
  if (profiles.length === 0) {
    return (
      <div className="panel-empty">
        <h3>No cues yet</h3>
        <p>
          Character names are detected from CAPS cues — the same way Fountain and Final Draft read the page.
        </p>
      </div>
    );
  }

  return (
    <div className="char-list">
      {profiles.map((profile) => (
        <article key={profile.name} className="char-card">
          <header>
            <h3>{profile.name}</h3>
            <span>
              {profile.appearances} {profile.appearances === 1 ? "cue" : "cues"} · {profile.scenes.length}{" "}
              {profile.scenes.length === 1 ? "scene" : "scenes"}
            </span>
          </header>
          <ul>
            {profile.hits.map((hit, i) => (
              <li key={`${hit.elementId}-${i}`}>
                <button onClick={() => onJump(hit.elementId)}>{hit.sceneLabel}</button>
              </li>
            ))}
          </ul>
          <p className="insight">{profile.insight}</p>
        </article>
      ))}
    </div>
  );
}
