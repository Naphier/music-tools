import * as React from "react"
import {renderToStaticMarkup} from "react-dom/server"
import {searchChords} from "st/chord_reference"
import {OPEN_PITCHES, guitarChordVoicings, noteClass, assignFingers} from "st/guitar_chords"
import Header from "st/components/header"
import ThemePicker from "st/components/theme_picker"
import MidiButton from "st/components/midi_button"
import ChordDiagram from "st/components/chord_diagram"
import ChordLabPage from "st/components/pages/chord_lab_page"
import GuitarFretboard from "st/components/guitar_fretboard"

function elements(node) {
  if (!node || typeof node !== "object") return []
  return [node, ...[node.props?.children].flat(Infinity).flatMap(elements)]
}

describe("Guitar chord diagrams and voicings", () => {
  it("offers familiar C, G and D fingerings before moveable shapes", () => {
    for (const [symbol, frets] of [["C", [null, 3, 2, 0, 1, 0]], ["G", [3, 2, 0, 0, 0, 3]], ["D", [null, null, 0, 2, 3, 2]]]) {
      const shape = guitarChordVoicings(searchChords(symbol)[0].notes)[0]
      expect(shape.frets).toEqual(frets)
      expect(shape.fingers.filter(Boolean).length).toBe(frets.filter(fret => fret > 0).length)
    }
  })

  it("includes every chord tone, no extra tones, and root bass for all search qualities", () => {
    const chords = ["major", "minor", "seventh", "suspended", "diminished", "augmented", "quartal", "ninth"].flatMap(searchChords)
    for (const chord of chords) {
      const shapes = guitarChordVoicings(chord.notes)
      const expected = [...new Set(chord.notes.map(noteClass))].sort()
      for (const shape of shapes) {
        const pitches = shape.frets.flatMap((fret, i) => fret === null ? [] : [OPEN_PITCHES[i] + fret])
        expect([...new Set(pitches.map(pitch => pitch % 12))].sort()).withContext(chord.symbol).toEqual(expected)
        expect(Math.min(...pitches) % 12).toBe(noteClass(chord.notes[0]))
        expect(shape.frets.every(fret => fret === null || (fret >= 0 && fret <= 12))).toBeTrue()
      }
    }
  })

  it("handles double accidentals and rejects invalid notes without inventing shapes", () => {
    expect(noteClass("B♭♭")).toBe(9)
    expect(guitarChordVoicings(["not a note", "E", "G"])).toEqual([])
    expect(guitarChordVoicings(["C", "E"])).toEqual([])
    const chord = searchChords("Ebdim7")[0]
    expect(guitarChordVoicings(chord.notes).length).toBeGreaterThan(0)
    expect(assignFingers([1, 2, 3, 4, 5, 6])).toBeNull()
  })

  it("renders open/muted labels, finger numbers, barres and high fret positions accessibly", () => {
    const shape = guitarChordVoicings(searchChords("F")[0].notes)[0]
    const markup = renderToStaticMarkup(<ChordDiagram {...shape} name="F" />)
    expect(markup).toContain('role="img"')
    expect(markup).toContain("finger 1")
    expect(markup).toContain('stroke-linecap="round"')
    const high = renderToStaticMarkup(<ChordDiagram frets={[null, 10, 12, 12, 12, 10]} name="G" />)
    expect(high).toContain("10fr")
    expect(high).toContain("Low E muted")
    const open = renderToStaticMarkup(<ChordDiagram frets={[null, 3, 2, 0, 1, 0]} name="C" />)
    expect(open).toContain("High E open")
  })
})

describe("Visual guitar input", () => {
  it("connects fretboard changes to identification without losing piano input", () => {
    const page = new ChordLabPage({})
    page.setState = update => Object.assign(page.state, typeof update === "function" ? update(page.state) : update)
    const board = elements(page.render()).find(node => node.type === GuitarFretboard)
    board.props.onChange([null, 3, 2, 0, 1, 0])
    expect(page.state.frets).toEqual([null, 3, 2, 0, 1, 0])
    expect(elements(page.render()).some(node => node.type === "li" && node.props.children === "C")).toBeTrue()
    expect(page.state.pianoNotes).toEqual([])
  })
})


describe("Sidebar navigation", () => {
  it("starts open, contains appearance and MIDI only in the sidebar, and toggles with the hamburger", () => {
    const header = new Header({})
    header.setState = update => Object.assign(header.state, update)
    const nodes = () => elements(header.render())
    expect(header.state.menuOpen).toBeTrue()
    const sidebar = nodes().find(node => node.type === "aside")
    expect(elements(sidebar).some(node => node.type === ThemePicker && node.props.inline)).toBeTrue()
    expect(elements(sidebar).filter(node => node.type === MidiButton).length).toBe(1)
    expect(nodes().filter(node => node.type === MidiButton).length).toBe(1)
    expect(nodes().some(node => node.props?.children === "Your music workspace")).toBeFalse()
    nodes().find(node => node.props?.["aria-label"] === "Close navigation" && node.props["aria-controls"]).props.onClick()
    expect(header.state.menuOpen).toBeFalse()
    expect(nodes().some(node => node.type === "aside")).toBeFalse()
    nodes().find(node => node.props?.["aria-label"] === "Open navigation").props.onClick()
    expect(header.state.menuOpen).toBeTrue()
  })
})
