import * as React from "react"
import {Link} from "react-router-dom"
import ChordDiagram from "st/components/chord_diagram"
import {guitarChordVoicings} from "st/guitar_chords"
import {CHORD_ROOTS} from "st/chord_lab"
import {setTitle} from "st/globals"
import {searchChords, CHORD_SEARCH_EXAMPLES} from "st/chord_reference"
import styles from "./chord_reference_page.module.css"

export default class ChordReferencePage extends React.Component {
  state = {query: "C major", root: "C", family: "major", visible: 24}

  componentDidMount() {
    setTitle("Chord Reference")
  }

  render() {
    const {query} = this.state
    const results = query.trim() ? searchChords(query) : []
    return <main className={styles.page}>
      <h1>Chord Reference</h1>
      <p>Find a chord by symbol, name, mood, or style to see its notes and interval formula.</p>
      <div className={styles.workspace}>
      <section className={styles.search_panel} aria-label="Find a chord">
      <div className={styles.root_picker} role="group" aria-label="Chord root">
        {CHORD_ROOTS.map(root => <button type="button" key={root} aria-pressed={query === `${root} ${this.state.family}`}
          onClick={() => this.setState({root, query: `${root} ${this.state.family}`, visible: 24})}>{root.replace("b", "♭").replace("#", "♯")}</button>)}
      </div>
      <label>Chord type<select value={this.state.family}
        onChange={event => this.setState({family: event.target.value, query: `${this.state.root} ${event.target.value}`, visible: 24})}>
        {["major", "minor", "dominant seventh", "major seventh", "minor seventh", "suspended second", "suspended fourth", "diminished", "augmented"].map(family => <option key={family}>{family}</option>)}
      </select></label>
      <label htmlFor="chord-query">Search chords</label>
      <input id="chord-query" type="search" value={query} maxLength={80}
        aria-describedby="chord-query-help" autoComplete="off"
        onChange={event => this.setState({query: event.target.value, visible: 24})} />
      <p id="chord-query-help">Try Cmaj7, F sharp minor 7, or C dreamy. Combine a root, quality, and descriptive words.</p>
      <div className={styles.suggestions} role="group" aria-label="Example chord searches">
        {CHORD_SEARCH_EXAMPLES.map(example => <button key={example} type="button"
          onClick={() => this.setState({query: example, visible: 24})}>{example}</button>)}
      </div>
      <p>Mood and style are starting points for exploration: voicing and musical context change how a chord feels.</p>
      </section>
      <section className={styles.chord_panel} aria-label="Chord diagrams and details">
      <p role="status">{query.trim()
        ? results.length ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "No chords matched. Try a chord symbol or a word such as dreamy, dark, blues, or open."
        : "Enter a chord symbol or a quality such as suspended."}</p>
      {results.length > 0 && <ul className={styles.results} aria-label="Matching chords">
        {results.slice(0, this.state.visible).map(({symbol, quality, formula, notes, descriptors}) => {
          const shapes = guitarChordVoicings(notes, 3)
          return <li key={symbol}>
          <h2>{symbol}</h2>
          {shapes.length ? <>
            <ChordDiagram {...shapes[0]} name={symbol} />
            <Link to={`/chord-lab?frets=${shapes[0].frets.map(fret => fret ?? "x").join(",")}`}>Explore on fretboard →</Link>
            {shapes.length > 1 && <details><summary>More voicings</summary>
              <div className={styles.voicings}>{shapes.slice(1).map((shape, index) => <div key={index}>
                <ChordDiagram {...shape} name={`${symbol} · voicing ${index + 2}`} />
                <Link to={`/chord-lab?frets=${shape.frets.map(fret => fret ?? "x").join(",")}`}>Analyze voicing</Link>
              </div>)}</div>
            </details>}
          </> : <p>No compact guitar voicing available. Explore these notes in Chord Lab.</p>}
          <p>{quality}</p>
          <dl>
            <dt>Notes</dt><dd>{notes.join(" · ")}</dd>
            <dt>Formula</dt><dd>{formula}</dd>
            <dt>Explore</dt><dd>{descriptors.join(" · ")}</dd>
          </dl>
        </li>})}
      </ul>}
      {results.length > this.state.visible && <button type="button" onClick={() => this.setState({visible: this.state.visible + 24})}>Show more chords</button>}
      <p className={styles.legend}>Diagrams: low E at left, high e at right. ○ open · × muted · 1–4 fingers, index to little finger. Repeated numbers indicate a barre.</p>
      </section></div>
      <p>Have a guitar fingering or piano notes? <Link to="/chord-lab">Identify a chord in Chord Lab</Link>.</p>
    </main>
  }
}
