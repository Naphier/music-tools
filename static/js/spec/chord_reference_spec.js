import {searchChords} from "st/chord_reference"

describe("Chord Reference", () => {
  it("distinguishes case-sensitive major and minor symbols", () => {
    expect(searchChords("CM7").map(chord => chord.symbol)).toEqual(["Cmaj7"])
    expect(searchChords("Cm7").map(chord => chord.symbol)).toEqual(["Cm7"])
  })

  it("understands accidentals and natural-language chord qualities", () => {
    expect(searchChords("F sharp minor 7").map(chord => chord.symbol)).toEqual(["F♯m7"])
    expect(searchChords("B♭ half-diminished seventh").map(chord => chord.symbol)).toEqual(["B♭m7♭5"])
    expect(searchChords("suspended").some(chord => chord.symbol === "Csus2")).toBe(true)
  })

  it("spells notes by degree, including double accidentals", () => {
    expect(searchChords("C#maj7")[0].notes).toEqual(["C♯", "E♯", "G♯", "B♯"])
    expect(searchChords("Ebdim7")[0].notes).toEqual(["E♭", "G♭", "B♭♭", "D♭♭"])
  })

  it("accepts named suffixes regardless of case", () => {
    expect(searchChords("cMAJ7").map(chord => chord.symbol)).toEqual(["Cmaj7"])
    expect(searchChords("CMin7").map(chord => chord.symbol)).toEqual(["Cm7"])
  })

  it("preserves less common enharmonic roots", () => {
    expect(searchChords("C flat major")[0].notes).toEqual(["C♭", "E♭", "G♭"])
    expect(searchChords("E#")[0].notes).toEqual(["E♯", "G♯♯", "B♯"])
  })

  it("returns no results for blank or unknown queries", () => {
    expect(searchChords("  ")).toEqual([])
    expect(searchChords("unknown chord")).toEqual([])
  })
})
