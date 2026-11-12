import {exportChordSheet, exportSongbook, importSongbook, parseChordSheet, readChordSheet, SHEET_SOURCE_LIMIT, readSongbook, SHEET_STORAGE_KEY, SONGBOOK_STORAGE_KEY} from "st/chord_sheet"

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

describe("chord sheet", function() {
  it("keeps lyric placement, blank lines and consecutive chords", function() {
    expect(parseChordSheet("Intro [C][G]go\r\n\r\nNext")).toEqual([
      [{chord: "", lyric: "Intro "}, {chord: "C", lyric: ""}, {chord: "G", lyric: "go"}],
      [{chord: "", lyric: ""}],
      [{chord: "", lyric: "Next"}],
    ])
  })

  it("transposes chord roots and basses while preserving qualities", function() {
    expect(parseChordSheet("[B♭maj7/F][C6/9][N.C.]", -1)[0].map(cell => cell.chord))
      .toEqual(["Amaj7/E", "B6/9", "N.C."])
  })

  it("supports flat spelling and preserves original spelling at zero", function() {
    expect(parseChordSheet("[C/E]", 1, true)[0][0].chord).toBe("Db/F")
    expect(parseChordSheet("[C♯/G♯]")[0][0].chord).toBe("C♯/G♯")
  })
})

describe("saved chord sheets", () => {
  const legacy = {title: "Old song", source: "[Am]Verse"}
  const first = {...legacy, id: "one", shift: 2, flats: true}
  const second = {...first, id: "two", source: "[G]Chorus", shift: -3}
  const storage = entries => ({getItem: key => entries[key] ?? null})

  it("loads the legacy draft when there is no songbook", () => {
    expect(readSongbook(storage({[SHEET_STORAGE_KEY]: JSON.stringify(legacy)})))
      .toEqual([{...legacy, id: "legacy", shift: 0, flats: false}])
  })

  it("keeps songs with the same title distinct and restores transposition", () => {
    expect(readSongbook(storage({[SONGBOOK_STORAGE_KEY]: JSON.stringify([first, second])})))
      .toEqual([first, second])
  })

  it("does not resurrect a deleted legacy draft", () => {
    expect(readSongbook(storage({
      [SHEET_STORAGE_KEY]: JSON.stringify(legacy),
      [SONGBOOK_STORAGE_KEY]: "[]",
    }))).toEqual([])
  })

  it("rejects duplicate IDs, invalid transposition, and corrupt data", () => {
    for (const value of [JSON.stringify([first, first]), JSON.stringify([{...first, shift: 13}]), "{"]) {
      expect(() => readSongbook(storage({[SONGBOOK_STORAGE_KEY]: value}))).toThrow()
    }
  })
})

describe("songbook backups", () => {
  const song = {id: "one", title: "Practice 🎸", source: "[B♭/D]Verse", shift: -2, flats: true}
  const createId = () => "new-id"

  it("round-trips saved sheets with their transposition and preserves separate IDs", () => {
    const sheets = [song, {...song, id: "two"}]
    expect(importSongbook(exportSongbook(sheets), [], createId)).toEqual(sheets)
  })

  it("keeps the local edit, avoids reserved IDs and skips a repeated import", () => {
    const local = {...song, source: "[G]Edited verse"}
    const backup = exportSongbook([song, {...song, id: "new-id", title: "Other"}])
    const ids = ["new-id", "replacement"]
    const merged = importSongbook(backup, [local], () => ids.shift())
    expect(merged).toEqual([local, {...song, id: "replacement"}, {...song, id: "new-id", title: "Other"}])
    expect(importSongbook(backup, merged, createId)).toEqual(merged)
  })

  it("rejects malformed, unsupported and partially invalid backups without changing existing sheets", () => {
    const existing = [song]
    for (const backup of ["{", '{"version":2,"sheets":[]}',
      JSON.stringify({version: 1, sheets: [song, {...song, id: "two", shift: 13}]})]) {
      expect(() => importSongbook(backup, existing, createId)).toThrow()
    }
    expect(existing).toEqual([song])
  })
})

describe("chord sheet text export", () => {
  it("preserves lyrics, section labels, Unicode and chord-only lines", () => {
    const source = "[Verse 1]\nOh [Am]héllo [G/B]world\n\n[C][G]\n"
    expect(exportChordSheet(source)).toBe(source)
  })

  it("exports the preview key with slash basses and chosen accidentals", () => {
    const source = "[C/E]Hello [B♭maj7/F]there [N.C.]\r\n[C6/9]"
    const text = exportChordSheet(source, 1, true)
    expect(text).toBe("[Db/F]Hello [Bmaj7/Gb]there [N.C.]\n[Db6/9]")
    expect(parseChordSheet(text)).toEqual(parseChordSheet(source, 1, true))
    expect(source).toContain("[C/E]")
  })

  it("handles empty sheets and downward octave transposition", () => {
    expect(exportChordSheet("")).toBe("")
    expect(exportChordSheet("[C#m7/G#]", -12)).toBe("[C#m7/G#]")
  })
})
