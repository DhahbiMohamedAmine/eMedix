const dictionaries = {
  en: () => import("../dictionaries/en.json").then((module) => module.default),
  fr: () => import("../dictionaries/fr.json").then((module) => module.default),
  ar: () => import("../dictionaries/ar.json").then((module) => module.default),
};

export type Language = keyof typeof dictionaries;

export const getDictionary = async (locale: Language) => {
  return dictionaries[locale]();
};
