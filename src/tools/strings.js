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
  keywordsNoneIgnoring:
    "No repeated keywords yet. Common English words are being ignored; untick the box above to include them.",
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
    `${plural(r.sentences, d.sentences, "sentence", "sentences")}. Reading time ${d.readingTime}.`,

  // ---- Meta Length Checker -------------------------------------------------
  meta: {
    copiedHtml: "HTML copied to clipboard.",
    copyHtmlFailed: "Couldn't copy automatically. Please select the code and copy it manually.",
    placeholderTitle: "Your page title will appear here",
    placeholderDescription: "Your meta description will appear here. Type one above to see how it looks in search results.",
    status: { empty: "Empty", short: "Too short", good: "Good length", long: "Too long" },
    count: ({ chars, px, limitChars, limitPx }) =>
      `${chars} of about ${limitChars} characters · about ${px} of ${limitPx} px`,
    srSummary: ({ title, description }) =>
      `Title: ${title.chars} characters, ${title.statusText}. Description: ${description.chars} characters, ${description.statusText}.`,
    passLabel: "Pass",
    warnLabel: "Warning",
    failLabel: "Problem",
    noChecks: "Type a title or description to see checks.",
    checks: {
      titleEmpty: () => "Add a page title. Without one, search engines make up their own.",
      titleLong: ({ px, limitPx }) =>
        `Too long: about ${px} px against a limit of about ${limitPx} px. The end will probably be cut off.`,
      titleShort: ({ chars, px, minPx }) =>
        `Short: ${chars} characters, about ${px} px. Titles under about ${minPx} px (roughly 30 Latin characters) often leave room to describe the page better.`,
      titleGood: ({ chars, px, limitPx, limitChars, overChars }) =>
        overChars
          ? `Fits by width: ${chars} characters is more than the usual ${limitChars}, but the text is narrow enough (about ${px} of ${limitPx} px). Search results cut titles by width, so this should show in full.`
          : `Good length: ${chars} characters, about ${px} of ${limitPx} px.`,
      titleSpaces: () =>
        "The title has leading, trailing or repeated spaces or line breaks. Search engines collapse them, and the counts here ignore them.",
      descriptionEmpty: () =>
        "No description. Search engines will pick text from the page instead, which is fine but not always what you would choose.",
      descriptionLong: ({ px, limitPx, chars }) =>
        `Too long: ${chars} characters, about ${px} px against a limit of about ${limitPx} px. The end will probably be cut off.`,
      descriptionShort: ({ chars, px, minPx }) =>
        `Short: ${chars} characters, about ${px} px. Descriptions under about ${minPx} px (roughly 70 Latin characters) rarely use the space well.`,
      descriptionGood: ({ chars, px, limitPx, limitChars, overChars }) =>
        overChars
          ? `Fits by width: ${chars} characters is more than the usual ${limitChars}, but the text is narrow enough (about ${px} of ${limitPx} px).`
          : `Good length: ${chars} characters, about ${px} of ${limitPx} px.`,
      descriptionSpaces: () =>
        "The description has leading, trailing or repeated spaces or line breaks. They are collapsed, and the counts here ignore them.",
      descriptionSameAsTitle: () =>
        "The description repeats the title. Use it to add detail the title doesn't have.",
      descriptionQuotes: () =>
        'The description contains a straight double quote ("). That is fine in the text, but it must be escaped when pasted into HTML. The snippet below does that for you.',
      keywordInTitle: ({ keyword }) => `The keyword "${keyword}" appears in the title.`,
      keywordMissingTitle: ({ keyword }) => `The keyword "${keyword}" is not in the title.`,
      keywordInDescription: ({ keyword }) => `The keyword "${keyword}" appears in the description.`,
      keywordMissingDescription: ({ keyword }) => `The keyword "${keyword}" is not in the description.`,
      keywordInUrl: ({ keyword }) => `The keyword "${keyword}" appears in the URL.`,
      keywordMissingUrl: ({ keyword }) => `The keyword "${keyword}" is not in the URL.`
    }
  }
};

const STRINGS = { en };

export function getStrings(lang = document.documentElement.lang || "en") {
  return STRINGS[lang.split("-")[0].toLowerCase()] || STRINGS.en;
}
