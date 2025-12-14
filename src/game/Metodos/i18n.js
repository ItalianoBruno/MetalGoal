const API_URL = "https://libretranslate.de/translate";

export async function translate(text, targetLang) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      q: text,
      source: "es",
      target: targetLang,
      format: "text"
    })
  });

  const data = await res.json();
  return data.translatedText;
}
