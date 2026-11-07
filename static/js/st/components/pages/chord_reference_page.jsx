import * as React from "react"
import {Link} from "react-router-dom"
import {setTitle} from "st/globals"
import {searchChords} from "st/chord_reference"
import styles from "./chord_reference_page.module.css"

export default class ChordReferencePage extends React.Component {
  state = {query: "C major"}

  componentDidMount() {
    setTitle("Chord Reference")
  }

  render() {
    const {query} = this.state
    const results = query.trim() ? searchChords(query) : []
    return <main className={styles.page}>
      <h1>Chord Reference</h1>
      <p>Find a chord by symbol or by name to see its notes and interval formula.</p>
      <label htmlFor="chord-query">Search chords</label>
      <input id="chord-query" type="search" value={query} maxLength={80}
        aria-describedby="chord-query-help" autoComplete="off"
        onChange={event => this.setState({query: event.target.value})} />
      <p id="chord-query-help">Try Cmaj7, F sharp minor 7, or half diminished.</p>
      <p role="status">{query.trim()
        ? results.length ? `${results.length} ${results.length === 1 ? "match" : "matches"}` : "No chords matched. Try a shorter name or a chord symbol."
        : "Enter a chord symbol or a quality such as suspended."}</p>
      {results.length > 0 && <ul className={styles.results} aria-label="Matching chords">
        {results.map(({symbol, quality, formula, notes}) => <li key={symbol}>
          <h2>{symbol}</h2>
          <p>{quality}</p>
          <dl>
            <dt>Notes</dt><dd>{notes.join(" · ")}</dd>
            <dt>Formula</dt><dd>{formula}</dd>
          </dl>
        </li>)}
      </ul>}
      <p>Have a guitar fingering? <Link to="/chord-lab">Identify it in Chord Lab</Link>.</p>
    </main>
  }
}
