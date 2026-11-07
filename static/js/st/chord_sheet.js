export const SHEET_STORAGE_KEY = "chord-sheet:v1"
export const SHEET_TITLE_LIMIT = 120
export const SHEET_SOURCE_LIMIT = 16000

export function readChordSheet(value) {
  const sheet = JSON.parse(value)
  if (typeof sheet?.title !== "string" || sheet.title.length > SHEET_TITLE_LIMIT ||
      typeof sheet.source !== "string" || sheet.source.length > SHEET_SOURCE_LIMIT) {
    throw new Error("Invalid chord sheet")
  }
  return {title: sheet.title, source: sheet.source}
}

export function parseChordSheet(source) {
  return source.split(/\r\n?|\n/).map(line => {
    const segments = []
    let chord = ""
    let end = 0
    for (const match of line.matchAll(/\[([^[\]\s]{1,24})\]/g)) {
      const lyric = line.slice(end, match.index)
      if (lyric || chord) segments.push({chord, lyric})
      chord = match[1]
      end = match.index + match[0].length
    }
    segments.push({chord, lyric: line.slice(end)})
    return segments
  })
}
