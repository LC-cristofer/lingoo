import worldsJson from "../../content/worlds.json";
import forestAnimalsJson from "../../content/lessons/forest-animals.json";
import { parseLesson, parseWorlds, type Lesson, type World } from "./content-schema";

const lessonFiles: Record<string, unknown> = {
  "forest-animals": forestAnimalsJson,
};

export function getWorlds(): World[] {
  return parseWorlds(worldsJson);
}

export function getLesson(id: string): Lesson | null {
  if (!Object.hasOwn(lessonFiles, id)) return null;
  return parseLesson(lessonFiles[id]);
}
