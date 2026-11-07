import * as React from "react"

import {setTitle} from "st/globals"
import {guitarScale, ROOTS, SCALE_TYPES} from "st/guitar_scales"
import styles from "./guitar_scales_page.module.css"

function displayNote(note) {
  return note.replace("#", "♯").replace("b", "♭")
}

export default class GuitarScalesPage extends React.Component {
  state = {root: "A", type: "Minor pentatonic", firstFret: 5}

  componentDidMount() {
    setTitle("Guitar Scales")
  }

  render() {
    const {root, type, firstFret} = this.state
    const {notes, frets, strings} = guitarScale(root, type, firstFret)
    const scaleName = `${displayNote(root)} ${type.toLowerCase()}`

    return <main className={styles.page}>
      <h1>Guitar Scales</h1>
      <p>Find scale notes in standard tuning (E A D G B E).</p>
      <div className={styles.controls}>
        <label>Root
          <select value={root} onChange={event => this.setState({root: event.target.value})}>
            {ROOTS.map(note => <option key={note} value={note}>{displayNote(note)}</option>)}
          </select>
        </label>
        <label>Scale
          <select value={type} onChange={event => this.setState({type: event.target.value})}>
            {Object.keys(SCALE_TYPES).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        <label>Frets
          <select value={firstFret} onChange={event => this.setState({firstFret: Number(event.target.value)})}>
            {[0, 5, 10, 15, 19].map(fret =>
              <option key={fret} value={fret}>{fret}–{fret + 5}</option>)}
          </select>
        </label>
      </div>
      <p aria-live="polite"><strong>{scaleName}</strong> · {notes.map(note => displayNote(note.name)).join(" · ")}</p>
      <table className={styles.fretboard}>
        <caption>Fretboard · ★ marks the root · Fret 0 is the open string</caption>
        <thead>
          <tr>
            <th scope="col">String</th>
            {frets.map(fret => <th scope="col" key={fret}>{fret}</th>)}
          </tr>
        </thead>
        <tbody>
          {strings.map(string => <tr key={string.number}>
            <th scope="row">{string.number} · {string.name}</th>
            {string.cells.map((note, index) => <td key={frets[index]}>
              {note && (note.degree === 1
                ? <strong className={styles.root}>{displayNote(note.name)} ★</strong>
                : displayNote(note.name))}
            </td>)}
          </tr>)}
        </tbody>
      </table>
    </main>
  }
}
