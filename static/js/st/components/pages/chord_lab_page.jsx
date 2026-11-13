import * as React from "react"

import {Link} from "react-router-dom"
import GuitarFretboard from "st/components/guitar_fretboard"
import ChordDiagram from "st/components/chord_diagram"
import {assignFingers} from "st/guitar_chords"
import ChordMidi from "st/chord_midi"
import {trigger} from "st/events"
import {setTitle} from "st/globals"
import {chordNote, guitarVoicing, identifyChords} from "st/chord_lab"
import styles from "./chord_lab_page.module.css"

const STRINGS = ["Low E", "A", "D", "G", "B", "High E"]
const PIANO_KEYS = Array.from({length: 25}, (_, index) => 48 + index)
const FRETS = Array.from({length: 13}, (_, fret) => fret)
const EXAMPLES = {
  "C major": [null, 3, 2, 0, 1, 0],
  "D minor": [null, null, 0, 2, 3, 1],
  "G7": [3, 2, 0, 0, 0, 1],
  "C over E": [0, 3, 2, 0, 1, 0],
}

export default class ChordLabPage extends React.Component {
  state = {frets: STRINGS.map(() => null), instrument: "guitar", pianoNotes: [], midiNotes: []}

  midiChord = new ChordMidi()

  resetMidi = () => {
    this.midiChord.reset()
    this.setState({midiNotes: []})
  }

  handleInputState = () => {
    if (this.props.midiInput?.state === "disconnected") this.resetMidi()
  }

  onMidiMessage(message) {
    if (this.state.instrument !== "midi" || this.props.midiInput?.state === "disconnected") return
    this.midiChord.receive(message.data)
    this.setState({midiNotes: this.midiChord.notes})
  }

  componentDidUpdate(previous) {
    if (previous.midiInput !== this.props.midiInput) {
      previous.midiInput?.removeEventListener("statechange", this.handleInputState)
      this.props.midiInput?.addEventListener("statechange", this.handleInputState)
      this.resetMidi()
    }
  }

  componentWillUnmount() {
    this.props.midiInput?.removeEventListener("statechange", this.handleInputState)
    this.midiChord.reset()
  }

  componentDidMount() {
    this.props.midiInput?.addEventListener("statechange", this.handleInputState)
    setTitle("Chord Lab")
    const incoming = new URLSearchParams(window.location.search).get("frets")
    if (incoming && /^(x|[0-9]|1[0-2])(,(x|[0-9]|1[0-2])){5}$/.test(incoming)) {
      this.setState({frets: incoming.split(",").map(fret => fret === "x" ? null : Number(fret))})
    }
  }

  render() {
    const {frets, instrument, pianoNotes, midiNotes} = this.state
    const pitches = instrument === "guitar" ? guitarVoicing(frets) : instrument === "midi" ? midiNotes : pianoNotes
    const notes = [...new Set([...pitches].sort((a, b) => a - b).map(chordNote))]
    const matches = identifyChords(pitches)

    return <main className={styles.page}>
      <div className={styles.page_heading}><div><h1>Chord Lab</h1>
        <p>Build a voicing. Discover the chord.</p></div><Link to="/chord-reference">Search chords →</Link></div>
      <label>Instrument
        <select value={instrument} onChange={event => { this.resetMidi(); this.setState({instrument: event.target.value}) }}>
          <option value="guitar">Guitar</option>
          <option value="piano">Piano</option>
          <option value="midi">MIDI keyboard</option>
        </select>
      </label>
      {instrument === "guitar" ? <>
      <GuitarFretboard frets={frets} onChange={frets => this.setState({frets})} />
      <details className={styles.precise}><summary>Enter frets by string</summary>
      <div className={styles.strings}>
        {STRINGS.map((string, index) => <label key={string}>
          {string}
          <select value={frets[index] ?? "mute"} onChange={event => {
            const value = event.target.value
            this.setState(({frets}) => ({
              frets: frets.map((fret, position) =>
                position === index ? (value === "mute" ? null : Number(value)) : fret),
            }))
          }}>
            <option value="mute">Muted</option>
            {FRETS.map(fret => <option key={fret} value={fret}>
              {fret === 0 ? "Open (0)" : fret}
            </option>)}
          </select>
        </label>)}
      </div>
      </details>

      <div className={styles.actions}>
        <label>Try an example
          <select value="" onChange={event => this.setState({frets: EXAMPLES[event.target.value]})}>
            <option value="" disabled>Select a voicing</option>
            {Object.keys(EXAMPLES).map(example => <option key={example}>{example}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => this.setState({frets: STRINGS.map(() => null)})}>
          Clear
        </button>
      </div>

      </> : instrument === "midi" ? <>
        <p>Play and hold a chord on your MIDI keyboard. Sustain pedal notes count until you release the pedal. Use the device picker to enable MIDI audio forwarding if you want sound.</p>
        <p role="status">{this.props.midiInput && this.props.midiInput.state !== "disconnected"
          ? `Input: ${this.props.midiInput.name || "MIDI keyboard"}` : "No connected MIDI input selected. Connect a keyboard and choose it below."}</p>
        <div className={styles.actions}>
          <button type="button" onClick={() => trigger(this, "pickMidi")}>Choose MIDI device</button>
          <button type="button" onClick={this.resetMidi}>Reset MIDI notes</button>
        </div>
      </> : <>
        <p id="piano-help">Select notes from C3 to C5. Select a note again to remove it. The lowest selected note determines the bass.</p>
        <div className={styles.piano} role="group" aria-label="Piano notes" aria-describedby="piano-help">
          {PIANO_KEYS.map(pitch => {
            const label = `${chordNote(pitch)}${Math.floor(pitch / 12) - 1}`
            return <button type="button" key={pitch} aria-pressed={pianoNotes.includes(pitch)}
              className={chordNote(pitch).match(/[♯♭]/) ? styles.accidental : undefined}
              onClick={() => this.setState(({pianoNotes}) => ({pianoNotes: pianoNotes.includes(pitch)
                ? pianoNotes.filter(note => note !== pitch) : [...pianoNotes, pitch]}))}>
              {label}
            </button>
          })}
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={() => this.setState({pianoNotes: []})}>Clear piano notes</button>
        </div>
      </>}

      <div className={styles.analysis}>
      {instrument === "guitar" && <ChordDiagram frets={frets} fingers={assignFingers(frets)} name={matches[0] || "Your voicing"} />}
      <section aria-live="polite">
        <h2>Chord matches</h2>
        {notes.length > 0 && <p>Notes from the bass up: {notes.join(" · ")}</p>}
        {notes.length < 3
          ? <p>Select at least three different notes to identify a chord.</p>
          : matches.length === 0
            ? <p>No exact match in the chord library. Check for an extra or missing note.</p>
            : <ul>{matches.map(match => <li key={match}>{match}</li>)}</ul>}
      </section>
      </div>
      <p>Matches use every distinct note you enter. A slash shows the bass note when it differs from the chord root.</p>
    </main>
  }
}
