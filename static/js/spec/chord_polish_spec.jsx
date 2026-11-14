import * as React from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {MemoryRouter} from "react-router-dom"
import {identifyChordMatches, identifyChords, guitarVoicing, chordNote} from "st/chord_lab"
import {guitarChordVoicings, OPEN_PITCHES} from "st/guitar_chords"
import {searchChords} from "st/chord_reference"
import {chordDiagramAscii, copyChordDiagram} from "st/chord_diagram_data"
import ChordDiagram from "st/components/chord_diagram"
import ChordVoicings from "st/components/chord_voicings"
import Scales from "st/components/pages/guitar_scales_page"
import Lab from "st/components/pages/chord_lab_page"
import Reference from "st/components/pages/chord_reference_page"
import ToolOptions from "st/components/tool_options"

function elements(node) {
  if (!node || typeof node !== "object") return []
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)]
}
const html = node => renderToStaticMarkup(<MemoryRouter>{node}</MemoryRouter>)

describe("Jazz voicing recognition", () => {
  it("recognizes the requested C7 and includes it as a common diagram", () => {
    const frets = [null, 3, 2, 3, 1, null]
    expect(identifyChordMatches(guitarVoicing(frets))).toContain({name: "C7", omittedFifth: true})
    const shape = guitarChordVoicings(searchChords("C7")[0].notes, 18).find(shape => shape.frets.join(",") === frets.join(","))
    expect(shape).toBeDefined()
    expect(shape.category).toBe("Common")
    expect(shape.omittedFifth).toBeTrue()
  })
  it("accepts transposed major/minor/dominant seventh and ninth shells with no fifth", () => {
    for (let root = 0; root < 12; root++) {
      for (const [suffix, intervals] of [["7", [0, 4, 10]], ["M7", [0, 4, 11]], ["m7", [0, 3, 10]], ["9", [0, 4, 10, 14]]]) {
        const matches = identifyChordMatches(intervals.map(interval => 48 + root + interval))
        expect(matches).toContain({name: chordNote(root) + suffix, omittedFifth: true})
      }
    }
  })
  it("does not infer a missing third, seventh, altered fifth, root, or ordinary triad fifth", () => {
    expect(identifyChords([60, 64])).not.toContain("C")
    expect(identifyChords([60, 67, 70])).not.toContain("C7")
    expect(identifyChords([60, 64, 67])).not.toContain("C7")
    expect(identifyChords([64, 67, 70])).not.toContain("C7/E")
    expect(identifyChords([60, 63, 70])).not.toContain("Cm7♭5")
    expect(identifyChords([60, 64, 70, 71])).not.toContain("C7")
  })
})

describe("Shared chord diagram presentation and export", () => {
  const frets = [null, 3, 2, 0, 1, 0]
  it("renders fingers, notes, intervals and combined labels without redundant captions", () => {
    for (const labels of ["fingers", "notes", "intervals", "both"]) {
      const text = html(<ChordDiagram frets={frets} fingers={[null, 3, 2, null, 1, null]} name="C" labels={labels} />)
      expect(text).toContain('aria-label="Copy chord diagram"')
      expect(text).toContain('aria-label="Copy as"')
      expect(text).not.toContain("<figcaption>")
      expect(text).toContain(">Block</button>")
      expect(text).toContain(">Line</button>")
      if (labels === "notes" || labels === "both") expect(text).toContain(">C</text>")
      if (labels === "intervals" || labels === "both") expect(text).toContain(">3</text>")
    }
  })
  it("exports exact single-line tabs and five-fret blocks with open/muted/high positions", () => {
    expect(chordDiagramAscii(frets, "C", "line")).toBe("C = x-3-2-0-1-0")
    expect(chordDiagramAscii(frets, "D♭7", "line")).toBe("Db7 = x-3-2-0-1-0")
    const block = chordDiagramAscii(frets, "C", "block")
    expect(block).toContain("Frets 1-5")
    expect(block.split("\n").filter(line => /^\s*\d+\s/.test(line)).length).toBe(5)
    expect(block).toContain("x           o       o")
    expect(chordDiagramAscii([null, 10, 12, 12, 12, 10], "G", "block")).toContain("Frets 10-14")
    const wide = chordDiagramAscii([0, 1, 3, 7, 9, 12], "Wide", "block")
    expect(wide.split("\n").filter(line => /^\s*\d+\s/.test(line)).length).toBe(15)
    expect(wide).toContain("Frets 11-15")
  })
  it("copies the selected format and reports clipboard rejection for retry", async () => {
    let copied
    await copyChordDiagram(frets, "C", "line", {writeText: async text => {copied = text}})
    expect(copied).toBe("C = x-3-2-0-1-0")
    await expectAsync(copyChordDiagram(frets, "C", "block", {writeText: async () => {throw new Error("denied")}})).toBeRejected()
    await copyChordDiagram(frets, "C", "block", {writeText: async text => {copied = text}})
    expect(copied).toContain("Frets 1-5")
  })
  it("shows all returned voicings without details foldouts or indexed captions", () => {
    const text = html(<ChordVoicings notes={searchChords("C7")[0].notes} name="C7" />)
    expect(text).not.toContain("More moveable")
    expect(text).not.toContain("C7 ·")
    expect(text).toContain("Common voicings")
    expect(text).toContain("Moveable voicings")
    expect((text.match(/Copy chord diagram/g) || []).length).toBe(guitarChordVoicings(searchChords("C7")[0].notes, 24).length)
  })
})

describe("Trimmed tool UI", () => {
  it("keeps guitar scale notes/degrees while removing tuning/help/storage text and piano summary", () => {
    const page = new Scales({})
    page.state.instrument = "guitar"
    let text = html(page.render())
    expect(text).toContain("A (1) · C (♭3)")
    expect(text).not.toContain("Standard tuning")
    expect(text).not.toContain("Highlighted notes belong")
    expect(text).not.toContain("minor pentatonic</strong>")
    expect(text).not.toContain("saved on this browser")
    page.state.instrument = "piano"
    text = html(page.render())
    expect(text).not.toContain("A (1) · C (♭3)")
    expect(text).toContain("Two-octave piano")
  })
  it("shows note-letter chord tabs and keeps guitar diagrams out of piano mode", () => {
    const page = new Lab({})
    page.state.frets = [null, 3, 2, 3, 1, null]
    let nodes = elements(page.render())
    const tab = nodes.find(node => node.props?.role === "tab" && node.props["aria-selected"])
    expect(html(tab)).toContain("C7")
    expect(html(tab)).toContain("C · E · B♭")
    expect(html(tab)).toContain("no 5")
    expect(html(page.render())).not.toContain("Notes from the bass up:")
    page.state.instrument = "piano"
    page.state.pianoNotes = [48, 52, 58]
    nodes = elements(page.render())
    expect(nodes.some(node => node.type === ChordDiagram || node.type === ChordVoicings)).toBeFalse()
    const ref = new Reference({})
    expect(html(ref.render())).not.toContain("without account sync")
    expect(html(<ToolOptions />)).not.toContain("saved on this browser")
  })
})
