import * as React from "react"

import {setTitle} from "st/globals"
import Toast from "st/components/toast"
import {
  parseChordSheet, readSongbook, SONGBOOK_STORAGE_KEY, SHEET_TITLE_LIMIT, SHEET_SOURCE_LIMIT,
} from "st/chord_sheet"
import styles from "./chord_sheet_page.module.css"

const EMPTY_SHEET = {title: "", source: "", shift: 0, flats: false}

export default class ChordSheetPage extends React.Component {
  state = {...EMPTY_SHEET, sheets: [], activeId: "", notice: "", noticeId: 0}

  componentDidMount() {
    setTitle("Chord Sheet Maker")
    try {
      const sheets = readSongbook(localStorage)
      const first = sheets[0]
      this.setState({sheets, ...(first || EMPTY_SHEET), activeId: first?.id || ""})
    } catch {
      this.notify("Could not load saved sheets from this browser.")
    }
  }

  notify(notice) {
    this.setState(({noticeId}) => ({notice, noticeId: noticeId + 1}))
  }

  open(id) {
    const {sheets, activeId, title, source, shift, flats} = this.state
    if (id === activeId) return
    const saved = sheets.find(sheet => sheet.id === activeId) || EMPTY_SHEET
    const dirty = title !== saved.title || source !== saved.source ||
      shift !== saved.shift || flats !== saved.flats
    if (dirty && !window.confirm("Discard unsaved changes to this sheet?")) return
    this.setState({...(sheets.find(sheet => sheet.id === id) || EMPTY_SHEET), activeId: id})
  }

  save() {
    const {activeId, title, source, shift, flats} = this.state
    try {
      const sheets = readSongbook(localStorage)
      const id = activeId || crypto.randomUUID()
      const sheet = {id, title, source, shift, flats}
      const updated = sheets.some(saved => saved.id === id)
        ? sheets.map(saved => saved.id === id ? sheet : saved)
        : [sheet, ...sheets]
      localStorage.setItem(SONGBOOK_STORAGE_KEY, JSON.stringify(updated))
      this.setState({sheets: updated, activeId: id})
      this.notify("Sheet saved in this browser.")
    } catch {
      this.notify("Could not save the sheet in this browser.")
    }
  }

  remove() {
    const {activeId} = this.state
    if (!window.confirm("Delete this saved sheet and discard any unsaved changes?")) return
    try {
      const sheets = readSongbook(localStorage).filter(sheet => sheet.id !== activeId)
      localStorage.setItem(SONGBOOK_STORAGE_KEY, JSON.stringify(sheets))
      this.setState({...EMPTY_SHEET, sheets, activeId: ""})
      this.notify("Saved sheet deleted.")
    } catch {
      this.notify("Could not delete the saved sheet.")
    }
  }

  render() {
    const {title, source, notice, noticeId, shift, flats, sheets, activeId} = this.state

    return <main className={styles.page}>
      <div className={styles.editor}>
        <h1>Chord Sheet Maker</h1>
        <p>Put chords in brackets just before the words they go with, like <code>[Am]Here comes [F]the chorus</code>.
          Use blank lines between sections. For an instrumental line, enter just the chords.</p>

        <div className={styles.actions}>
          <label>Saved sheets
            <select value={activeId} onChange={event => this.open(event.target.value)}>
              <option value="">New sheet</option>
              {sheets.map((sheet, index) => <option key={sheet.id} value={sheet.id}>
                {index + 1}. {sheet.title.trim() || "Untitled song"}
              </option>)}
            </select>
          </label>
          <button type="button" disabled={!activeId} onClick={() => this.remove()}>
            Delete saved sheet
          </button>
        </div>
        <label>Song title
          <input value={title} maxLength={SHEET_TITLE_LIMIT}
            onChange={event => this.setState({title: event.target.value})} />
        </label>
        <label>Chords and lyrics
          <textarea value={source} maxLength={SHEET_SOURCE_LIMIT} rows={12}
            onChange={event => this.setState({source: event.target.value})} />
        </label>
        <p>Sheets and their transposition settings are saved in this browser. Saving an open sheet updates that sheet.</p>
        <div className={styles.actions}>
          <label>Transpose
            <select value={shift} onChange={event => this.setState({shift: Number(event.target.value)})}>
              {Array.from({length: 25}, (_, index) => index - 12).map(steps =>
                <option key={steps} value={steps}>{steps === 0 ? "Original key" :
                  `${steps > 0 ? "+" : ""}${steps} semitones`}</option>)}
            </select>
          </label>
          <label>Accidentals when transposed
            <select value={flats ? "flats" : "sharps"} onChange={event => this.setState({flats: event.target.value === "flats"})}>
              <option value="sharps">Sharps</option>
              <option value="flats">Flats</option>
            </select>
          </label>
          <button type="button" disabled={!title.trim() && !source.trim()} onClick={() => this.save()}>Save sheet</button>
          <button type="button" disabled={!source.trim()} onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <section className={styles.preview} aria-label="Chord sheet preview">
        <h2>{title.trim() || "Untitled song"}</h2>
        {source.trim() ? parseChordSheet(source, shift, flats).map((line, lineIndex) =>
          <div className={styles.line} key={lineIndex}>
            {line.map(({chord, lyric}, segmentIndex) => <span className={styles.segment} key={segmentIndex}>
              {chord && <strong>{chord}</strong>}
              <span>{lyric}</span>
            </span>)}
          </div>
        ) : <p>Add chords or lyrics to preview your sheet.</p>}
      </section>
      <Toast message={notice} notificationId={noticeId}
        onDismiss={() => this.setState({notice: ""})} />
    </main>
  }
}
