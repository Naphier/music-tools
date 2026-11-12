import * as React from "react"

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
  state = {frets: STRINGS.map(() => null), instrument: "guitar", pianoNotes: []}

  componentDidMount() {
    setTitle("Chord Lab")
  }

  render() {
    const {frets, instrument, pianoNotes} = this.state
    const pitches = instrument === "guitar" ? guitarVoicing(frets) : pianoNotes
    const notes = [...new Set([...pitches].sort((a, b) => a - b).map(chordNote))]
    const matches = identifyChords(pitches)

    return <main className={styles.page}>
      <h1>Chord Lab</h1>
      <label>Instrument
        <select value={instrument} onChange={event => this.setState({instrument: event.target.value})}>
          <option value="guitar">Guitar</option>
          <option value="piano">Piano</option>
        </select>
      </label>
      {instrument === "guitar" ? <>
      <p>Choose an open string or fret 1–12 for each sounding string in standard tuning. Leave unused strings muted.</p>

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

      <section aria-live="polite">
        <h2>Chord matches</h2>
        {notes.length > 0 && <p>Notes from the bass up: {notes.join(" · ")}</p>}
        {notes.length < 3
          ? <p>Select at least three different notes to identify a chord.</p>
          : matches.length === 0
            ? <p>No exact match in the chord library. Check for an extra or missing note.</p>
            : <ul>{matches.map(match => <li key={match}>{match}</li>)}</ul>}
      </section>
      <p>Matches use every distinct note you enter. A slash shows the bass note when it differs from the chord root.</p>
    </main>
  }
}
