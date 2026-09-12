import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { requestAssist } from "../ai";
import { extractCharacters } from "../characters";
import { applyType, insertAfter, makeElement, replaceScene, smartNormalize } from "../elements";
import { downloadFdx, downloadFountainFile, fileStem } from "../fdx";
import { isCharacterCue, parseFountain, titlePageFountain, toFountain } from "../fountain";
import { parseImportedFile } from "../importScript";
import { cycleType, nextOnEnter } from "../keyboard";
import { estimatePageCount } from "../pagination";
import { downloadPdf } from "../pdf";
import { missingTvBeats, structureHint } from "../structure";
import type { AiSuggestion, ElementType, Project, SaveStatus, ScriptElement } from "../types";
import { ELEMENT_LABELS } from "../types";
import { AiPanel } from "./AiPanel";
import { CharactersPanel } from "./CharactersPanel";
import { isNarrowViewport, useNarrow } from "../narrow";
import {
  IconBack,
  IconClose,
  IconExport,
  IconFocus,
  IconHelp,
  IconImport,
  IconMoon,
  IconMore,
  IconPanel,
  IconSidebar,
  IconSun,
} from "./Icons";
import { buildOutline, SceneList } from "./SceneList";
import { TitleFields } from "./TitleFields";

type RightTab = "ai" | "characters" | "title";

function caretAtStart(el: HTMLTextAreaElement) {
  return el.selectionStart === 0 && el.selectionEnd === 0;
}

function caretAtEnd(el: HTMLTextAreaElement) {
  return el.selectionStart === el.value.length && el.selectionEnd === el.value.length;
}

function resizeArea(el: HTMLTextAreaElement | null) {
  if (!el) return;
  el.style.height = "0px";
  el.style.height = `${el.scrollHeight}px`;
}

export function Editor({
  project,
  saveStatus,
  theme,
  onToggleTheme,
  onChange,
  onBack,
}: {
  project: Project;
  saveStatus: SaveStatus;
  theme: "light" | "dark";
  onToggleTheme: () => void;
  onChange: (project: Project) => void;
  onBack: () => void;
}) {
  const narrow = useNarrow();
  const [focusId, setFocusId] = useState(project.elements[0]?.id ?? "");
  const [leftOpen, setLeftOpen] = useState(() => !isNarrowViewport());
  const [rightOpen, setRightOpen] = useState(() => !isNarrowViewport());
  const [rightTab, setRightTab] = useState<RightTab>("ai");
  const [focusMode, setFocusMode] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [suggestion, setSuggestion] = useState<AiSuggestion | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const areas = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const importRef = useRef<HTMLInputElement>(null);
  const pendingFocus = useRef<string | null>(null);

  const outline = useMemo(() => buildOutline(project.elements), [project.elements]);
  const characters = useMemo(() => extractCharacters(project.elements), [project.elements]);
  const pages = estimatePageCount(project.elements);
  const hint = structureHint(project);
  const missing = missingTvBeats(project);
  const focusIndex = Math.max(
    0,
    project.elements.findIndex((el) => el.id === focusId),
  );
  const activeScene =
    [...outline].reverse().find((item) => item.index <= focusIndex)?.id ?? outline[0]?.id ?? null;

  useEffect(() => {
    document.documentElement.classList.toggle("focus-mode", focusMode);
    return () => document.documentElement.classList.remove("focus-mode");
  }, [focusMode]);

  useEffect(() => {
    if (narrow) {
      setLeftOpen(false);
      setRightOpen(false);
    } else {
      setLeftOpen(true);
      setRightOpen(true);
    }
  }, [narrow]);

  useEffect(() => {
    const id = pendingFocus.current ?? focusId;
    const node = areas.current[id];
    if (node) {
      node.focus();
      resizeArea(node);
      if (pendingFocus.current) {
        node.selectionStart = node.selectionEnd = node.value.length;
        pendingFocus.current = null;
      }
    }
    for (const el of project.elements) resizeArea(areas.current[el.id]);
  }, [project.elements, focusId]);

  const updateElements = (elements: ScriptElement[], nextFocus?: string) => {
    if (nextFocus) {
      pendingFocus.current = nextFocus;
      setFocusId(nextFocus);
    }
    onChange({ ...project, elements, updatedAt: Date.now() });
  };

  const closeDrawers = () => {
    setLeftOpen(false);
    setRightOpen(false);
    setMoreOpen(false);
    setExportOpen(false);
  };

  const blurPage = () => {
    if (narrow && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  const toggleLeft = () => {
    setMoreOpen(false);
    setExportOpen(false);
    const next = !leftOpen;
    if (next && narrow) {
      setRightOpen(false);
      blurPage();
    }
    setLeftOpen(next);
  };

  const openRight = (tab: RightTab) => {
    setMoreOpen(false);
    setExportOpen(false);
    if (narrow) setLeftOpen(false);
    if (rightOpen && rightTab === tab && narrow) {
      setRightOpen(false);
      return;
    }
    setRightTab(tab);
    setRightOpen(true);
    if (narrow) blurPage();
  };

  const jumpTo = (id: string) => {
    setFocusId(id);
    pendingFocus.current = id;
    if (narrow) closeDrawers();
    requestAnimationFrame(() => {
      areas.current[id]?.scrollIntoView({ block: "center", behavior: "smooth" });
      areas.current[id]?.focus();
    });
  };

  const changeText = (id: string, text: string) => {
    updateElements(
      project.elements.map((el) => {
        if (el.id !== id) return el;
        if (el.type === "character" || el.type === "scene_heading" || el.type === "transition" || el.type === "act_break") {
          return { ...el, text: text.toUpperCase() };
        }
        return { ...el, text };
      }),
    );
  };

  const changeType = (id: string, type: ElementType) => {
    updateElements(project.elements.map((el) => (el.id === id ? applyType(el, type) : el)));
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>, index: number) => {
    const el = project.elements[index];
    const node = event.currentTarget;

    if (event.key === "Tab") {
      event.preventDefault();
      const next = cycleType(el.type, event.shiftKey ? -1 : 1);
      if (
        !event.shiftKey &&
        el.type === "action" &&
        el.text.trim() &&
        !isCharacterCue(el.text) &&
        next === "character"
      ) {
        const fresh = makeElement("character", "");
        const nextEls = [...project.elements];
        nextEls.splice(index + 1, 0, fresh);
        updateElements(nextEls, fresh.id);
        return;
      }
      changeType(el.id, next);
      return;
    }

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const normalized = smartNormalize(el);
      const nextType = nextOnEnter(normalized.type);
      const fresh = makeElement(nextType, nextType === "scene_heading" ? "INT. " : "");
      const next = [...project.elements];
      next[index] = normalized;
      next.splice(index + 1, 0, fresh);
      updateElements(next, fresh.id);
      return;
    }

    if (event.key === "Backspace" && caretAtStart(node) && el.text.length === 0 && project.elements.length > 1) {
      event.preventDefault();
      const next = project.elements.filter((_, i) => i !== index);
      updateElements(next, next[Math.max(0, index - 1)].id);
      return;
    }

    if (event.key === "ArrowUp" && caretAtStart(node) && index > 0) {
      event.preventDefault();
      jumpTo(project.elements[index - 1].id);
    }
    if (event.key === "ArrowDown" && caretAtEnd(node) && index < project.elements.length - 1) {
      event.preventDefault();
      jumpTo(project.elements[index + 1].id);
    }
  };

  const insertBeat = (label: string) => {
    const beat = makeElement("act_break", label);
    const scene = makeElement("scene_heading", "INT. ");
    const action = makeElement("action", "");
    const result = insertAfter(project.elements, project.elements.length - 1, [beat, scene, action]);
    updateElements(result.elements, scene.id);
  };

  const runAi = async (action: Parameters<typeof requestAssist>[2]) => {
    setBusy(true);
    setEditing(false);
    try {
      const result = await requestAssist(project, focusIndex, action);
      setSuggestion(result);
      setDraft(result.body);
    } finally {
      setBusy(false);
    }
  };

  const acceptSuggestion = async () => {
    if (!suggestion) return;
    const body = (editing ? draft : suggestion.body).trim();
    if (!body) return;
    if (!suggestion.insertable) {
      await navigator.clipboard.writeText(body);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
      setSuggestion(null);
      setEditing(false);
      return;
    }
    const incoming = parseFountain(body);
    const replace = suggestion.action === "rewrite-tone" || suggestion.action === "tighten" || suggestion.action === "more-visual";
    const result = replace
      ? replaceScene(project.elements, focusIndex, incoming)
      : insertAfter(project.elements, focusIndex, incoming);
    updateElements(result.elements, result.focusId);
    setSuggestion(null);
    setEditing(false);
  };

  const exportFountain = () => {
    const header = titlePageFountain(project.kind, project.titlePage);
    downloadFountainFile(`${fileStem(project)}.fountain`, `${header}\n${toFountain(project.elements)}`);
    setExportOpen(false);
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    const elements = parseImportedFile(file.name, text);
    updateElements(elements, elements[0]?.id);
  };

  return (
    <div className={`workspace ${focusMode ? "is-focus" : ""}`}>
      <header className="chrome">
        <div className="chrome-left">
          <button className="ghost" onClick={onBack} aria-label="Back to projects">
            <IconBack />
          </button>
          {!narrow && (
            <button className="ghost" onClick={toggleLeft} aria-label="Toggle scenes">
              <IconSidebar />
            </button>
          )}
          <div className="doc-title">
            <button className="title-btn" onClick={() => openRight("title")}>
              {project.kind === "tv"
                ? project.titlePage.episodeTitle || project.titlePage.showName || "Untitled episode"
                : project.titlePage.title || "Untitled"}
            </button>
            <span className={`kind-badge ${project.kind}`}>
              {project.kind === "feature" ? "Feature" : project.titlePage.duration === "hour" ? "TV · Hour" : "TV · Half-hour"}
            </span>
          </div>
        </div>
        <div className="chrome-center">
          <span className="structure-pill">{hint.label}</span>
          <span className="pages">{pages} {pages === 1 ? "page" : "pages"}</span>
          <span className={`save ${saveStatus}`}>{saveStatus === "saving" ? "Saving…" : "Saved"}</span>
        </div>
        <div className="chrome-right">
          {narrow ? (
            <>
              <button className="ghost" onClick={onToggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
              <div className="menu-wrap">
                <button
                  className="ghost"
                  onClick={() => {
                    setExportOpen(false);
                    setMoreOpen((v) => !v);
                  }}
                  aria-label="More"
                  aria-expanded={moreOpen}
                >
                  <IconMore />
                </button>
                {moreOpen && (
                  <div className="menu">
                    <button
                      onClick={() => {
                        setHelpOpen(true);
                        setMoreOpen(false);
                      }}
                    >
                      Keyboard help
                    </button>
                    <button
                      onClick={() => {
                        importRef.current?.click();
                        setMoreOpen(false);
                      }}
                    >
                      Import
                    </button>
                    <button
                      onClick={() => {
                        exportFountain();
                        setMoreOpen(false);
                      }}
                    >
                      Export Fountain
                    </button>
                    <button
                      onClick={() => {
                        void downloadPdf(project);
                        setMoreOpen(false);
                      }}
                    >
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        downloadFdx(project);
                        setMoreOpen(false);
                      }}
                    >
                      Export Final Draft (FDX)
                    </button>
                    <button
                      onClick={() => {
                        setFocusMode((v) => !v);
                        setMoreOpen(false);
                      }}
                    >
                      Focus mode
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <button className="ghost" onClick={() => setHelpOpen(true)} aria-label="Keyboard help">
                <IconHelp />
              </button>
              <button className="ghost" onClick={() => importRef.current?.click()} aria-label="Import">
                <IconImport />
              </button>
              <div className="menu-wrap">
                <button className="ghost" onClick={() => setExportOpen((v) => !v)} aria-label="Export">
                  <IconExport />
                </button>
                {exportOpen && (
                  <div className="menu">
                    <button onClick={exportFountain}>Fountain</button>
                    <button
                      onClick={() => {
                        void downloadPdf(project);
                        setExportOpen(false);
                      }}
                    >
                      PDF
                    </button>
                    <button
                      onClick={() => {
                        downloadFdx(project);
                        setExportOpen(false);
                      }}
                    >
                      Final Draft (FDX)
                    </button>
                  </div>
                )}
              </div>
              <button className="ghost" onClick={() => setFocusMode((v) => !v)} aria-label="Focus mode">
                <IconFocus />
              </button>
              <button className="ghost" onClick={onToggleTheme} aria-label="Toggle theme">
                {theme === "dark" ? <IconSun /> : <IconMoon />}
              </button>
              <button className="ghost" onClick={() => setRightOpen((v) => !v)} aria-label="Toggle assistant">
                <IconPanel />
              </button>
            </>
          )}
        </div>
      </header>

      <input
        ref={importRef}
        type="file"
        hidden
        accept=".fountain,.txt,.fdx,text/plain"
        onChange={(e) => onImport(e.target.files?.[0])}
      />

      <div className="workspace-body">
        {narrow && (leftOpen || rightOpen) && !focusMode && (
          <button className="rail-backdrop" aria-label="Close panel" onClick={closeDrawers} />
        )}
        {leftOpen && !focusMode && (
          <aside className="left-rail" aria-label="Scene list">
            {narrow && (
              <div className="drawer-head">
                <span>Scenes</span>
                <button className="ghost" onClick={() => setLeftOpen(false)} aria-label="Close scenes">
                  <IconClose />
                </button>
              </div>
            )}
            <SceneList items={outline} activeId={activeScene} onJump={jumpTo} />
            {project.kind === "tv" && missing.length > 0 && (
              <div className="beat-insert">
                <p>Insert act break</p>
                {missing.map((beat) => (
                  <button key={beat} onClick={() => insertBeat(beat)}>
                    {beat}
                  </button>
                ))}
              </div>
            )}
            {project.kind === "feature" && <p className="rail-hint">{hint.detail}</p>}
          </aside>
        )}

        <main className="page-scroll" onClick={() => { setExportOpen(false); setMoreOpen(false); }}>
          <article className="paper" aria-label="Screenplay">
            <div className="title-page">
              {project.kind === "tv" ? (
                <>
                  <p className="tp-show">{project.titlePage.showName || "UNTITLED SHOW"}</p>
                  {project.titlePage.episodeNumber && <p>{project.titlePage.episodeNumber}</p>}
                  <p className="tp-ep">“{project.titlePage.episodeTitle || "Untitled"}”</p>
                </>
              ) : (
                <p className="tp-show">{project.titlePage.title || "UNTITLED"}</p>
              )}
              <p className="tp-credit">Written by</p>
              <p>{project.titlePage.writtenBy || " "}</p>
            </div>
            {project.elements.map((el, index) => (
              <div key={el.id} className={`el-wrap el-${el.type}`} data-id={el.id}>
                <label className="el-type">{ELEMENT_LABELS[el.type]}</label>
                <textarea
                  ref={(node) => {
                    areas.current[el.id] = node;
                  }}
                  className={`el el-${el.type}`}
                  value={el.text}
                  spellCheck={el.type === "action" || el.type === "dialogue" || el.type === "parenthetical"}
                  rows={1}
                  aria-label={ELEMENT_LABELS[el.type]}
                  onFocus={() => {
                    setFocusId(el.id);
                    if (el.type === "scene_heading" && /^INT\.\s*$/i.test(el.text)) {
                      requestAnimationFrame(() => areas.current[el.id]?.select());
                    }
                  }}
                  onChange={(e) => changeText(el.id, e.target.value)}
                  onKeyDown={(e) => onKeyDown(e, index)}
                  onBlur={() => {
                    const current = project.elements.find((item) => item.id === el.id);
                    if (!current) return;
                    const next = smartNormalize(current);
                    if (next.text !== current.text || next.type !== current.type) {
                      updateElements(project.elements.map((item) => (item.id === el.id ? next : item)));
                    }
                  }}
                />
              </div>
            ))}
          </article>
        </main>

        {rightOpen && !focusMode && (
          <aside className="right-rail" aria-label="Assistant">
            {narrow && (
              <div className="drawer-head">
                <span>{rightTab === "ai" ? "AI" : rightTab === "characters" ? "Characters" : "Title"}</span>
                <button className="ghost" onClick={() => setRightOpen(false)} aria-label="Close panel">
                  <IconClose />
                </button>
              </div>
            )}
            <div className="tabs">
              <button className={rightTab === "ai" ? "active" : ""} onClick={() => setRightTab("ai")}>
                AI
              </button>
              <button className={rightTab === "characters" ? "active" : ""} onClick={() => setRightTab("characters")}>
                Characters
              </button>
              <button className={rightTab === "title" ? "active" : ""} onClick={() => setRightTab("title")}>
                Title
              </button>
            </div>
            <div className="rail-body">
              {rightTab === "ai" && (
                <AiPanel
                  busy={busy}
                  suggestion={suggestion}
                  editing={editing}
                  draft={draft}
                  onDraft={setDraft}
                  onStartEdit={() => {
                    if (suggestion) {
                      setDraft(suggestion.body);
                      setEditing(true);
                    }
                  }}
                  onCancelEdit={() => setEditing(false)}
                  onRun={runAi}
                  onAccept={() => void acceptSuggestion()}
                  onReject={() => {
                    setSuggestion(null);
                    setEditing(false);
                  }}
                />
              )}
              {rightTab === "characters" && <CharactersPanel profiles={characters} onJump={jumpTo} />}
              {rightTab === "title" && (
                <TitleFields
                  project={project}
                  onChange={(titlePage) => onChange({ ...project, titlePage, updatedAt: Date.now() })}
                />
              )}
            </div>
          </aside>
        )}
      </div>

      {narrow && !focusMode && (
        <nav className="mobile-dock" aria-label="Editor panels">
          <button
            className={leftOpen ? "active" : ""}
            aria-pressed={leftOpen}
            onClick={toggleLeft}
          >
            Scenes
          </button>
          <button
            className={rightOpen && rightTab === "ai" ? "active" : ""}
            aria-pressed={rightOpen && rightTab === "ai"}
            onClick={() => openRight("ai")}
          >
            AI
          </button>
          <button
            className={rightOpen && rightTab === "characters" ? "active" : ""}
            aria-pressed={rightOpen && rightTab === "characters"}
            onClick={() => openRight("characters")}
          >
            Characters
          </button>
        </nav>
      )}

      {focusMode && (
        <button className="focus-exit" onClick={() => setFocusMode(false)}>
          Exit focus
        </button>
      )}
      {copied && <div className="toast">Copied — not inserted into the script</div>}

      {helpOpen && (
        <div className="modal-backdrop" onClick={() => setHelpOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <header>
              <h2>Write like Final Draft</h2>
              <button className="ghost" onClick={() => setHelpOpen(false)} aria-label="Close">
                <IconClose />
              </button>
            </header>
            <ul className="help-list">
              <li>
                <kbd>Tab</kbd> / <kbd>Shift+Tab</kbd> cycle slugline, action, character, parenthetical, dialogue,
                transition, act break. Tab after a written action line starts a new character cue.
              </li>
              <li>
                <kbd>Enter</kbd> next logical element — character leads to dialogue, dialogue returns to action
              </li>
              <li>
                Type <strong>INT./EXT.</strong> on an action line and press Enter to lock a slugline
              </li>
              <li>
                ALL CAPS on its own line becomes a character cue
              </li>
              <li>
                <kbd>Shift+Enter</kbd> line break inside the current element
              </li>
            </ul>
            <p className="quiet">Format is non-negotiable. The assistant never writes the whole script.</p>
          </div>
        </div>
      )}
    </div>
  );
}
