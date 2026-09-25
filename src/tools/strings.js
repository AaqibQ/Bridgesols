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

// ---- Slug Generator ---------------------------------------------------------
// Messages are count-aware: with one slug they say "This slug", with a list "N of M slugs".
// verb is [singular, plural]: "This slug has", "1 of 3 slugs has", "2 of 3 slugs have".
const slugSubject = (p, verb) =>
  p.total === 1
    ? `This slug ${verb[0]}`
    : `${p.count} of ${p.total} slugs ${p.count === 1 ? verb[0] : verb[1]}`;

en.slug = {
  copied: "Slugs copied to clipboard.",
  copyFailed: "Couldn't copy automatically. Please select the text and copy it manually.",
  count: (n) => (n === 0 ? "No slugs yet" : n === 1 ? "1 slug" : `${n} slugs`),
  previewLabel: (n) => (n > 1 ? `Preview (first of ${n})` : "Preview"),
  noPreview: "Type a title to see the slug.",
  noChecks: "Type a title to see checks.",
  passLabel: "Pass",
  warnLabel: "Warning",
  failLabel: "Problem",
  checks: {
    slugEmpty: (p) =>
      p.total === 1
        ? "Nothing usable was left, so there is no slug. Try a different title, or switch to “Keep original letters” if it isn't written in Latin letters."
        : `${p.count} of ${p.total} lines produced no slug. Check them, or switch to “Keep original letters” if they aren't written in Latin letters.`,
    slugRemoved: (p) =>
      `${p.removed} ${p.removed === 1 ? "character" : "characters"} couldn't be converted to Latin letters and ${p.removed === 1 ? "was" : "were"} left out. Arabic, Urdu, Hindi, Chinese, Japanese and Korean can't be converted reliably, so use “Keep original letters” or write the slug in English yourself.`,
    slugLong: (p) =>
      `${slugSubject(p, ["is", "are"])} longer than ${p.limit} characters. Shorter URLs are easier to read and share; consider a max length or removing stop words.`,
    slugWordy: (p) =>
      `${slugSubject(p, ["has", "have"])} more than ${p.limit} words. Keeping the main topic words and dropping filler usually works better.`,
    slugUnderscore: (p) =>
      `${slugSubject(p, ["uses", "use"])} underscores. Google's guidance is to use hyphens to separate words, since underscores may not be treated as separators.`,
    slugNonAscii: (p) =>
      `${slugSubject(p, ["contains", "contain"])} non-Latin letters. They work in modern browsers, but when the link is copied they are percent-encoded and become long (up to ${p.encoded} characters here).`,
    slugTrimmed: (p) =>
      `${slugSubject(p, ["was", "were"])} shortened at a word boundary to fit your maximum length.`,
    slugGood: (p) =>
      p.total === 1
        ? "Looks good: short, readable and safe to use in a URL."
        : `All ${p.count} slugs look good: short, readable and safe to use in a URL.`
  }
};

// ---- Case Converter -----------------------------------------------------------
en.caseTool = {
  copied: "Text copied to clipboard.",
  copyFailed: "Couldn't copy automatically. Please select the text and copy it manually.",
  empty: "Type or paste some text to convert it.",
  stats: (chars, words) =>
    `${chars} ${chars === 1 ? "character" : "characters"}, ${words} ${words === 1 ? "word" : "words"}`
};

// ---- UTM Link Builder ---------------------------------------------------------
const fieldList = (fields) => fields.map((f) => `utm_${f}`).join(", ");

en.utm = {
  copied: "Link copied to clipboard.",
  copyFailed: "Couldn't copy automatically. Please select the link and copy it manually.",
  placeholder: "Enter your page address and at least a source to build the link.",
  passLabel: "Pass",
  warnLabel: "Warning",
  failLabel: "Problem",
  noChecks: "Fill in the form to see checks.",
  checks: {
    utmInvalidUrl: () =>
      "That doesn't look like a web address. Use a full page address such as https://example.com/page.",
    utmNoParams: () => "Add at least a campaign source (utm_source) to build a tracked link.",
    utmAssumedHttps: () => "No https:// was given, so it was added for you. Check that the address is right.",
    utmMissingSource: () => "utm_source is missing. Google Analytics needs it to say where the visit came from.",
    utmMissingRecommended: (p) =>
      `${fieldList(p.fields)} ${p.fields.length === 1 ? "is" : "are"} empty. Source, medium and campaign together give the clearest reports.`,
    utmUppercase: (p) =>
      `${fieldList(p.fields)} contain${p.fields.length === 1 ? "s" : ""} capital letters. Analytics treats "Facebook" and "facebook" as different sources, so stick to one case, usually lowercase.`,
    utmSpaces: (p) =>
      `${fieldList(p.fields)} contain${p.fields.length === 1 ? "s" : ""} spaces, which become %20 in the link. Hyphens or underscores are easier to read.`,
    utmReplaced: (p) =>
      `The page address already had ${p.names.join(", ")}. ${p.names.length === 1 ? "It was" : "They were"} replaced with your values.`,
    utmLong: (p) =>
      `The link is ${p.length} characters long. Some systems cut links longer than ${p.limit}, so shorten the values.`,
    utmGood: () => "Looks good: the link is ready to use."
  }
};

const STRINGS = { en };

export function getStrings(lang = document.documentElement.lang || "en") {
  return STRINGS[lang.split("-")[0].toLowerCase()] || STRINGS.en;
}
