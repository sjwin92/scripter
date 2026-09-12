import { uid } from "./id";
import type { Project, ProjectKind, ScriptElement, TitlePage, TvDuration } from "./types";

export function blankTitlePage(duration: TvDuration = "hour"): TitlePage {
  return {
    title: "",
    writtenBy: "",
    contact: "",
    showName: "",
    episodeTitle: "",
    episodeNumber: "",
    duration,
  };
}

function starterElements(kind: ProjectKind): ScriptElement[] {
  if (kind === "tv") {
    return [
      { id: uid(), type: "act_break", text: "TEASER" },
      { id: uid(), type: "scene_heading", text: "INT. " },
      { id: uid(), type: "action", text: "" },
    ];
  }
  return [
    { id: uid(), type: "scene_heading", text: "INT. " },
    { id: uid(), type: "action", text: "" },
  ];
}

export function createProject(input: {
  kind: ProjectKind;
  title?: string;
  writtenBy?: string;
  contact?: string;
  showName?: string;
  episodeTitle?: string;
  episodeNumber?: string;
  duration?: TvDuration;
}): Project {
  const now = Date.now();
  const duration = input.duration ?? "hour";
  const titlePage = blankTitlePage(duration);
  titlePage.title = input.title?.trim() ?? "";
  titlePage.writtenBy = input.writtenBy?.trim() ?? "";
  titlePage.contact = input.contact?.trim() ?? "";
  titlePage.showName = input.showName?.trim() ?? "";
  titlePage.episodeTitle = input.episodeTitle?.trim() ?? "";
  titlePage.episodeNumber = input.episodeNumber?.trim() ?? "";

  if (input.kind === "tv" && !titlePage.title) {
    titlePage.title = titlePage.episodeTitle || titlePage.showName || "Untitled episode";
  }

  return {
    id: uid(),
    kind: input.kind,
    titlePage,
    elements: starterElements(input.kind),
    createdAt: now,
    updatedAt: now,
  };
}

export function touch(project: Project, patch: Partial<Project>): Project {
  return { ...project, ...patch, updatedAt: Date.now() };
}

export function duplicateProject(project: Project): Project {
  const now = Date.now();
  const copyTitle =
    project.kind === "tv"
      ? `${project.titlePage.episodeTitle || "Untitled"} (copy)`
      : `${project.titlePage.title || "Untitled"} (copy)`;
  return {
    ...project,
    id: uid(),
    titlePage: {
      ...project.titlePage,
      title: project.kind === "feature" ? copyTitle : project.titlePage.title,
      episodeTitle: project.kind === "tv" ? copyTitle : project.titlePage.episodeTitle,
    },
    elements: project.elements.map((el) => ({ ...el, id: uid() })),
    createdAt: now,
    updatedAt: now,
  };
}
