import { useState } from "react";
import type { ProjectKind, TvDuration } from "../types";
import { IconBack, IconFilm, IconTv } from "./Icons";

export function NewProject({
  onCancel,
  onCreate,
}: {
  onCancel: () => void;
  onCreate: (input: {
    kind: ProjectKind;
    title: string;
    writtenBy: string;
    contact: string;
    showName: string;
    episodeTitle: string;
    episodeNumber: string;
    duration: TvDuration;
  }) => void;
}) {
  const [kind, setKind] = useState<ProjectKind | null>(null);
  const [title, setTitle] = useState("");
  const [writtenBy, setWrittenBy] = useState("");
  const [contact, setContact] = useState("");
  const [showName, setShowName] = useState("");
  const [episodeTitle, setEpisodeTitle] = useState("");
  const [episodeNumber, setEpisodeNumber] = useState("");
  const [duration, setDuration] = useState<TvDuration>("hour");

  return (
    <div className="wizard">
      <button className="ghost back" onClick={onCancel}>
        <IconBack /> Projects
      </button>

      <header>
        <p className="eyebrow">New script</p>
        <h1>What are you writing?</h1>
        <p className="lede">
          Choose a feature or a TV episode first. Format, title page, and structure hints follow from that choice.
        </p>
      </header>

      <div className="kind-pick">
        <button
          className={`kind-card ${kind === "feature" ? "selected" : ""}`}
          onClick={() => setKind("feature")}
        >
          <IconFilm />
          <h2>Feature</h2>
          <p>Film title page and three-act structure hints. You write the pages.</p>
        </button>
        <button className={`kind-card ${kind === "tv" ? "selected" : ""}`} onClick={() => setKind("tv")}>
          <IconTv />
          <h2>TV episode</h2>
          <p>Show name, episode title, teaser and act breaks. Hour or half-hour presets.</p>
        </button>
      </div>

      {kind === "feature" && (
        <form
          className="wizard-form"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              kind: "feature",
              title: title.trim() || "Untitled",
              writtenBy,
              contact,
              showName: "",
              episodeTitle: "",
              episodeNumber: "",
              duration: "hour",
            });
          }}
        >
          <label>
            Film title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Untitled" autoFocus />
          </label>
          <label>
            Written by
            <input value={writtenBy} onChange={(e) => setWrittenBy(e.target.value)} placeholder="Your name" />
          </label>
          <label>
            Contact
            <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Optional" />
          </label>
          <p className="hint">A feature title page is generated automatically. Structure hints stay in the margin.</p>
          <button className="primary" type="submit">
            Open editor
          </button>
        </form>
      )}

      {kind === "tv" && (
        <form
          className="wizard-form"
          onSubmit={(e) => {
            e.preventDefault();
            onCreate({
              kind: "tv",
              title: episodeTitle.trim() || "Untitled episode",
              writtenBy,
              contact,
              showName: showName.trim() || "Untitled show",
              episodeTitle: episodeTitle.trim() || "Untitled episode",
              episodeNumber,
              duration,
            });
          }}
        >
          <label>
            Show name
            <input value={showName} onChange={(e) => setShowName(e.target.value)} placeholder="Untitled show" autoFocus />
          </label>
          <label>
            Episode title
            <input value={episodeTitle} onChange={(e) => setEpisodeTitle(e.target.value)} placeholder="Untitled episode" />
          </label>
          <label>
            Episode number
            <input value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value)} placeholder="101" />
          </label>
          <fieldset>
            <legend>Preset</legend>
            <label className="radio">
              <input
                type="radio"
                name="duration"
                checked={duration === "hour"}
                onChange={() => setDuration("hour")}
              />
              Hour · Teaser, Acts 1–5, Tag
            </label>
            <label className="radio">
              <input
                type="radio"
                name="duration"
                checked={duration === "half-hour"}
                onChange={() => setDuration("half-hour")}
              />
              Half-hour · Teaser, Acts 1–2, Tag
            </label>
          </fieldset>
          <label>
            Written by
            <input value={writtenBy} onChange={(e) => setWrittenBy(e.target.value)} placeholder="Your name" />
          </label>
          <button className="primary" type="submit">
            Open editor
          </button>
        </form>
      )}
    </div>
  );
}
