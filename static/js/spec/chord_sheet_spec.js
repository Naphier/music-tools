import {parseChordSheet, readChordSheet, SHEET_SOURCE_LIMIT} from "st/chord_sheet"

describe("Chord Sheet Maker", () => {
  it("keeps lyrics before the first chord and anchors slash chords to the next lyric", () => {
    expect(parseChordSheet("Oh [Am]here [G/B]we go")).toEqual([[
      {chord: "", lyric: "Oh "},
      {chord: "Am", lyric: "here "},
      {chord: "G/B", lyric: "we go"},
    ]])
  })

  it("preserves blank lines, chord-only lines, and plain section labels", () => {
    expect(parseChordSheet("[Verse 1]\r\n\r\n[C][G]")).toEqual([
      [{chord: "", lyric: "[Verse 1]"}],
      [{chord: "", lyric: ""}],
      [{chord: "C", lyric: ""}, {chord: "G", lyric: ""}],
    ])
  })

  it("round-trips a saved draft and rejects invalid or oversized data", () => {
    const draft = {title: "Test song", source: "[Dm]Hello"}
    expect(readChordSheet(JSON.stringify(draft))).toEqual(draft)
    expect(() => readChordSheet("null")).toThrow()
    expect(() => readChordSheet(JSON.stringify({...draft, source: "a".repeat(SHEET_SOURCE_LIMIT + 1)}))).toThrow()
  })
})
