import * as React from "react"

import {Link} from "react-router-dom"
import GuitarFretboard from "st/components/guitar_fretboard"
import ChordDiagram from "st/components/chord_diagram"
import {assignFingers} from "st/guitar_chords"
import ToolOptions from "st/components/tool_options"
import PianoVisual from "st/components/piano_visual"
import ChordVoicings from "st/components/chord_voicings"
import Toast from "st/components/toast"
import {chordTones} from "st/chord_display"
import {labState, readToolState, persistToolPage} from "st/tool_preferences"
import ChordMidi from "st/chord_midi"
import {trigger} from "st/events"
import {setTitle} from "st/globals"
import {chordNote, guitarVoicing, identifyChords, suggestChords} from "st/chord_lab"
import styles from "./chord_lab_page.module.css"

export default class ChordLabPage extends React.Component {
  state = {...readToolState("chord-lab", labState), midiNotes: []}

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

  componentDidUpdate(previous, previousState) {
    persistToolPage(this, "chord-lab", labState, previousState)
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
      this.setState({instrument: "guitar", frets: incoming.split(",").map(fret => fret === "x" ? null : Number(fret))})
    }
  }

  render() {
    const {frets, instrument, pianoNotes, midiNotes, labels, showAllNotes} = this.state
    const pitches = instrument === "guitar" ? guitarVoicing(frets) : instrument === "midi" ? midiNotes : pianoNotes
    const notes = [...new Set([...pitches].sort((a, b) => a - b).map(chordNote))]
    const matches = identifyChords(pitches)
    const selected = matches.includes(this.state.selectedMatch) ? this.state.selectedMatch : matches[0]
    const tones = chordTones(selected, pitches)
    const suggestions = matches.length ? [] : suggestChords(pitches)
    const chooseVoicing = frets => this.setState({frets: [...frets], instrument: "guitar"})
    return <main className={styles.page}>
      <div className={styles.page_heading}><div><h1>Chord Lab</h1><p>Build a voicing. Discover the chord.</p></div>
        <div className={styles.heading_actions}><Link to="/chord-reference">Search chords →</Link>
        <ToolOptions>
          <label>Instrument<select value={instrument} onChange={event => { this.resetMidi(); this.setState({instrument: event.target.value}) }}>
            <option value="guitar">Guitar</option><option value="piano">Piano</option><option value="midi">MIDI keyboard</option>
          </select></label>
          <label><input type="checkbox" checked={showAllNotes} onChange={event => this.setState({showAllNotes: event.target.checked})} />Show all fretboard notes</label>
          <label>Chord labels<select value={labels} onChange={event => this.setState({labels: event.target.value})}>
            <option value="notes">Chord notes</option><option value="degrees">Chord degrees</option><option value="both">Notes and degrees</option>
          </select></label>
        </ToolOptions></div>
      </div>
      {instrument === "guitar" ? <GuitarFretboard frets={frets} tones={tones} labels={labels} showAllNotes={showAllNotes}
        onChange={frets => this.setState({frets})} onReset={() => this.setState({frets: Array(6).fill(null), selectedMatch: ""})} />
        : instrument === "midi" ? <>
          <p>Play and hold a chord on your MIDI keyboard. Sustain pedal notes count until you release the pedal.</p>
          <p role="status">{this.props.midiInput && this.props.midiInput.state !== "disconnected"
            ? `Input: ${this.props.midiInput.name || "MIDI keyboard"}` : "No connected MIDI input selected. Connect a keyboard and choose it below."}</p>
          <div className={styles.actions}><button type="button" onClick={() => trigger(this, "pickMidi")}>Choose MIDI device</button>
            <button type="button" onClick={this.resetMidi}>Reset MIDI notes</button></div>
        </> : <>
          <p>Select piano keys to build a chord. The lowest note sets the bass.</p>
          <PianoVisual selected={pianoNotes} labels={labels} noteLabels={tones} onToggle={pitch => this.setState(({pianoNotes}) => ({pianoNotes: pianoNotes.includes(pitch)
            ? pianoNotes.filter(note => note !== pitch) : [...pianoNotes, pitch]}))} />
          <button type="button" onClick={() => this.setState({pianoNotes: []})}>Clear piano notes</button>
        </>}
      {labels !== "notes" && <p>Degrees relative to {selected ? `${selected.split("/")[0]} root` : `the current bass (${notes[0] || "select a note"})`}.</p>}
      <div className={styles.analysis}>
        {instrument === "guitar" && <ChordDiagram frets={frets} fingers={assignFingers(frets)} name={selected || "Your voicing"} />}
        <section aria-live="polite"><h2>Chord matches</h2>
          {notes.length > 0 && <p>Notes from the bass up: {notes.join(" · ")}</p>}
          {matches.length ? <ul className={styles.match_list}>{matches.map(match => <li key={match}>
            <button type="button" aria-pressed={selected === match} onClick={() => this.setState({selectedMatch: match})}>{match}</button>
          </li>)}</ul> : <p>{notes.length < 3 ? "Select at least three different notes to identify a chord." : "No exact match. Explore the closest chords below."}</p>}
        </section>
      </div>
      {selected && <section className={styles.variants}><h2>{selected} voicings</h2>
        <ChordVoicings notes={tones.map(tone => tone.name)} bassNote={selected.split("/")[1]} name={selected} onChoose={chooseVoicing} />
      </section>}
      {suggestions.length > 0 && <section className={styles.variants}><h2>Closest chord suggestions</h2><p>These are near matches, not identifications of your current notes.</p>
        {suggestions.map(suggestion => <div key={suggestion.name} className={styles.suggestion}>
          <h3>{suggestion.name}</h3><p>{suggestion.missing.length ? `Add ${suggestion.missing.join(", ")}. ` : ""}{suggestion.extra.length ? `Remove ${suggestion.extra.join(", ")}.` : ""}</p>
          <details><summary>Explore suggested voicings</summary><ChordVoicings notes={chordTones(suggestion.name).map(tone => tone.name)} name={suggestion.name} onChoose={chooseVoicing} /></details>
        </div>)}
      </section>}
      <p>Exact matches use every distinct note you enter. Slash symbols show a different bass note.</p>
      <Toast message={this.state.storageWarning} onDismiss={() => this.setState({storageWarning: null})} />
    </main>
  }
}
