const LANGUAGE_MAP: Record<string, string> = {
  Korean: "korean",
  English: "english",
  Spanish: "spanish",
  French: "french",
  German: "german",
  Portuguese: "portuguese",
  Italian: "italian",
  Dutch: "dutch",
  Swedish: "swedish",
  Norwegian: "norwegian",
  Danish: "danish",
  Finnish: "finnish",
  Polish: "polish",
  Czech: "czech",
  Hungarian: "hungarian",
  Greek: "greek",
  Turkish: "turkish",
  Japanese: "japanese",
  Chinese: "chinese",
  Hebrew: "hebrew",
  Slovak: "slovak",
  Slovene: "slovene",
  Icelandic: "icelandic",
  Estonian: "estonian",
  Latvian: "latvian",
  Lithuanian: "lithuanian",
  Other: "english",
};

export const normalizeLanguage = (language: string): string => {
  return LANGUAGE_MAP[language] ?? "english";
};