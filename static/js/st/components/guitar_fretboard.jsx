import * as React from "react"
import {chordNote} from "st/chord_lab"
import {OPEN_PITCHES, STRING_NAMES} from "st/guitar_chords"
import styles from "./guitar_visuals.module.css"

export default function GuitarFretboard({frets, onChange}) {
  const [showNotes, setShowNotes] = React.useState(false)
  const select = (string, fret) => onChange(frets.map((value, index) => index === string ? (value === fret ? null : fret) : value))
  return <section aria-label="Guitar fretboard" className={styles.instrument}>
    <div className={styles.toolbar}>
      <span>Standard tuning · E A D G B E</span>
      <button type="button" aria-pressed={showNotes} onClick={() => setShowNotes(!showNotes)}>Note names</button>
    </div>
    <p>Tap a fret to place a note. Tap it again to mute that string. ○ = open, × = muted.</p>
    <div className={styles.scroll} tabIndex="0" role="group" aria-label="Scrollable fretboard, frets 0 to 12">
      <div className={styles.fretboard}>
        {[5, 4, 3, 2, 1, 0].map(string => <div className={styles.string} key={string}>
          <button type="button" className={styles.open} aria-label={`${STRING_NAMES[string]} open`}
            aria-pressed={frets[string] === 0} onClick={() => select(string, 0)}>
            {frets[string] === null ? "×" : frets[string] === 0 ? "○" : STRING_NAMES[string].replace("High ", "").replace("Low ", "")}
          </button>
          {Array.from({length: 12}, (_, index) => index + 1).map(fret => {
            const selected = frets[string] === fret
            return <button type="button" key={fret} aria-pressed={selected}
              aria-label={`${STRING_NAMES[string]} fret ${fret}, ${chordNote(OPEN_PITCHES[string] + fret)}`}
              onClick={() => select(string, fret)}>
              <span className={selected ? styles.selected_note : styles.note}>{selected || showNotes ? chordNote(OPEN_PITCHES[string] + fret) : ""}</span>
            </button>
          })}
        </div>)}
        <div className={styles.fret_numbers}>{Array.from({length: 13}, (_, fret) => <span key={fret}>
          {fret}{[3, 5, 7, 9, 12].includes(fret) && <small>{fret === 12 ? "••" : "•"}</small>}
        </span>)}</div>
      </div>
    </div>
  </section>
}
