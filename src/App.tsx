import { useEffect, useMemo, useState } from "react";
import { Editor } from "./components/Editor";
import { Home } from "./components/Home";
import { NewProject } from "./components/NewProject";
import { createProject } from "./project";
import { loadPrefs, loadProjects, savePrefs, saveProjects } from "./storage";
import type { Project, SaveStatus } from "./types";

type View = "home" | "new" | "editor";

export default function App() {
  const [projects, setProjects] = useState<Project[]>(() => loadProjects());
  const [prefs, setPrefs] = useState(() => loadPrefs());
  const [view, setView] = useState<View>("home");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");

  const active = useMemo(
    () => projects.find((project) => project.id === activeId) ?? null,
    [projects, activeId],
  );

  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", prefs.theme === "dark" ? "#100e0b" : "#ebe4d6");
  }, [prefs.theme]);

  useEffect(() => {
    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      saveProjects(projects);
      savePrefs(prefs);
      setSaveStatus("saved");
    }, 400);
    return () => window.clearTimeout(timer);
  }, [projects, prefs]);

  const upsert = (next: Project) => {
    setProjects((current) => {
      const exists = current.some((project) => project.id === next.id);
      return exists ? current.map((project) => (project.id === next.id ? next : project)) : [next, ...current];
    });
  };

  return (
    <>
      {view === "home" && (
        <Home
          projects={projects}
          theme={prefs.theme}
          onToggleTheme={() =>
            setPrefs((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))
          }
          onNew={() => setView("new")}
          onOpen={(id) => {
            setActiveId(id);
            setPrefs((current) => ({ ...current, lastProjectId: id }));
            setView("editor");
          }}
          onDelete={(id) => {
            setProjects((current) => current.filter((project) => project.id !== id));
            if (activeId === id) setActiveId(null);
          }}
        />
      )}
      {view === "new" && (
        <NewProject
          onCancel={() => setView("home")}
          onCreate={(input) => {
            const project = createProject(input);
            upsert(project);
            setActiveId(project.id);
            setPrefs((current) => ({ ...current, lastProjectId: project.id }));
            setView("editor");
          }}
        />
      )}
      {view === "editor" && active && (
        <Editor
          project={active}
          saveStatus={saveStatus}
          theme={prefs.theme}
          onToggleTheme={() =>
            setPrefs((current) => ({ ...current, theme: current.theme === "dark" ? "light" : "dark" }))
          }
          onChange={upsert}
          onBack={() => setView("home")}
        />
      )}
    </>
  );
}
