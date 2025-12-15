const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });

const DICTIONARY = {
  es: {
    MAIN_MENU_TITLE: "Menú Principal",
    PLAY_VS: "VS",
    PLAY_BOT: "Bot",
    LOADING: "Cargando..."
  },
  en: {
    MAIN_MENU_TITLE: "Main Menu",
    PLAY_VS: "VS",
    PLAY_BOT: "Bot",
    LOADING: "Loading..."
  }
};

exports.translate = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const { key, lang } = req.body;

    if (!key || !lang) {
      return res.status(400).json({ error: "Missing key or lang" });
    }

    const text =
      DICTIONARY[lang]?.[key] ||
      DICTIONARY["es"][key] ||
      key;

    res.json({ text });
  });
});
