export function detectLanguage() {
  const navLang = navigator.language || navigator.userLanguage;
  return navLang.startsWith('es') ? 'es' : 'en';
}
