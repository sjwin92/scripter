import { FEATURE_ACTS, tvBeats } from "../structure";
import type { Project } from "../types";

export function TitleFields({
  project,
  onChange,
}: {
  project: Project;
  onChange: (titlePage: Project["titlePage"]) => void;
}) {
  const tp = project.titlePage;
  const set = (patch: Partial<Project["titlePage"]>) => onChange({ ...tp, ...patch });

  return (
    <div className="title-fields">
      {project.kind === "feature" ? (
        <>
          <label>
            Film title
            <input value={tp.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <div className="structure-notes">
            <h3>Three-act map</h3>
            {FEATURE_ACTS.map((act) => (
              <p key={act.id}>
                <strong>{act.label}</strong> <em>{act.pages}</em>
                <span>{act.cue}</span>
              </p>
            ))}
          </div>
        </>
      ) : (
        <>
          <label>
            Show name
            <input value={tp.showName} onChange={(e) => set({ showName: e.target.value })} />
          </label>
          <label>
            Episode title
            <input value={tp.episodeTitle} onChange={(e) => set({ episodeTitle: e.target.value })} />
          </label>
          <label>
            Episode number
            <input value={tp.episodeNumber} onChange={(e) => set({ episodeNumber: e.target.value })} />
          </label>
          <fieldset>
            <legend>Preset</legend>
            <label className="radio">
              <input
                type="radio"
                checked={tp.duration === "hour"}
                onChange={() => set({ duration: "hour" })}
              />
              Hour
            </label>
            <label className="radio">
              <input
                type="radio"
                checked={tp.duration === "half-hour"}
                onChange={() => set({ duration: "half-hour" })}
              />
              Half-hour
            </label>
          </fieldset>
          <p className="quiet">Insert act breaks: {tvBeats(tp.duration).join(" · ")}</p>
        </>
      )}
      <label>
        Written by
        <input value={tp.writtenBy} onChange={(e) => set({ writtenBy: e.target.value })} />
      </label>
      <label>
        Contact
        <input value={tp.contact} onChange={(e) => set({ contact: e.target.value })} />
      </label>
    </div>
  );
}
