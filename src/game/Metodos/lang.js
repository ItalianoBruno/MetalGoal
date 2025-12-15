export function detectLanguage() {
  const lang = navigator.language || navigator.userLanguage;

  if (lang.startsWith("es")) return "es";
  if (lang.startsWith("en")) return "en";

  return "es"; // fallback
}
