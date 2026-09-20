// UI strings that are produced by JavaScript at run time (status messages, units).
// Static page copy lives in the HTML. Adding a language later means adding an
// entry here and generating the localised page; nothing else needs to change.

// English plural helper. `count` is the raw number, `shown` its formatted text.
const plural = (count, shown, one, many) => `${shown} ${count === 1 ? one : many}`;

const en = {
  units: { min: "min", sec: "sec" },
  limitLeft: (count, shown) => `${plural(count, shown, "character", "characters")} left`,
  limitOver: (count, shown) => `Over the limit by ${plural(count, shown, "character", "characters")}`,
  copied: "Results copied to clipboard.",
  copyFailed: "Couldn't copy automatically. Please select the numbers and copy them manually.",
  keywordsEmpty: "Start typing to see your most-used words.",
  keywordsNone: "No repeated words yet. Keywords appear once a word is used at least twice.",
  summaryLabels: {
    words: "Words",
    characters: "Characters",
    charactersNoSpaces: "Characters (no spaces)",
    sentences: "Sentences",
    paragraphs: "Paragraphs",
    uniqueWords: "Unique words",
    avgWordLength: "Average word length",
    readingTime: "Reading time",
    speakingTime: "Speaking time"
  },
  srSummary: (r, d) =>
    `${plural(r.words, d.words, "word", "words")}, ` +
    `${plural(r.characters, d.characters, "character", "characters")}, ` +
    `${plural(r.sentences, d.sentences, "sentence", "sentences")}. Reading time ${d.readingTime}.`
};

const STRINGS = { en };

export function getStrings(lang = document.documentElement.lang || "en") {
  return STRINGS[lang.split("-")[0].toLowerCase()] || STRINGS.en;
}
