import {guitarScale, ROOTS, SCALE_TYPES} from "st/guitar_scales"

describe("Guitar scales", () => {
  it("shows A minor pentatonic in fifth position on all six strings", () => {
    const {notes, strings, frets} = guitarScale("A", "Minor pentatonic", 5)
    expect(notes.map(note => note.name)).toEqual(["A", "C", "D", "E", "G"])
    expect(frets).toEqual([5, 6, 7, 8, 9, 10])
    expect(strings.map(string => string.cells[0]?.name)).toEqual(["A", "E", "C", "G", "D", "A"])
    expect(strings[0].cells[1]).toBeUndefined()
  })

  it("preserves flat key spellings and identifies roots across octaves", () => {
    const {notes, strings} = guitarScale("Db", "Major", 8)
    expect(notes.map(note => note.name)).toEqual(["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"])
    expect(strings[0].cells[1]).toEqual(notes[0])
    expect(guitarScale("Db", "Major", 19).strings[0].cells[2]).toEqual(notes[0])
  })

  it("includes the correct open strings for E minor blues", () => {
    const {notes, strings} = guitarScale("E", "Minor blues", 0)
    expect(notes.map(note => note.pitchClass)).toEqual([4, 7, 9, 10, 11, 2])
    expect(strings.map(string => string.cells[0]?.degree)).toEqual([1, 5, 2, 6, 3, 1])
  })

  it("has a unique pitch per degree in every supported scale and key", () => {
    for (const root of ROOTS) {
      for (const type of Object.keys(SCALE_TYPES)) {
        const {notes} = guitarScale(root, type, 0)
        expect(notes[0].name).toBe(root)
        expect(new Set(notes.map(note => note.pitchClass)).size).toBe(notes.length)
      }
    }
  })
})
