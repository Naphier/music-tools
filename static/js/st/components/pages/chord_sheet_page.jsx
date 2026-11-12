import * as React from "react"

import {setTitle} from "st/globals"
import Toast from "st/components/toast"
import {
  exportChordSheet, importChordSheet, exportSongbook, importSongbook, SONGBOOK_BACKUP_SIZE_LIMIT,
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

  downloadBackup() {
    try {
      const backup = exportSongbook(readSongbook(localStorage))
      const url = URL.createObjectURL(new Blob([backup], {type: "application/json"}))
      const link = document.createElement("a")
      link.href = url
      link.download = "music-tools-songbook.json"
      try {
        link.click()
      } finally {
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }
    } catch {
      this.notify("Could not download the songbook backup.")
    }
  }

  downloadText() {
    const {title, source, shift, flats} = this.state
    let url
    try {
      url = URL.createObjectURL(new Blob([exportChordSheet(source, shift, flats)], {type: "text/plain;charset=utf-8"}))
      const link = document.createElement("a")
      link.href = url
      const filename = title.trim().replace(/[^\p{L}\p{N} _-]/gu, "").slice(0, 80).trim() || "chord-sheet"
      link.download = `${filename}.txt`
      link.click()
    } catch {
      this.notify("Could not download the chord sheet text.")
    } finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000)
    }
  }

  async importText(event) {
    const input = event.currentTarget
    const file = input.files[0]
    input.value = ""
    if (!file || this.state.importingText) return
    // UTF-8 can use up to four bytes per character; validate decoded length too.
    if (file.size > SHEET_SOURCE_LIMIT * 4 + 3) {
      this.setState({textImportError: "Choose a text sheet with no more than 16,000 characters."})
      return
    }
    this.setState({importingText: true, textImportError: ""})
    try {
      const sheet = importChordSheet(await file.text(), file.name)
      if ((this.state.title || this.state.source) &&
          !window.confirm("Replace the current editor with this text sheet? Saved sheets will be kept.")) return
      this.setState({...sheet, activeId: ""})
      this.notify("Text sheet opened. Save it to keep it in this browser.")
    } catch {
      this.setState({textImportError: "Choose a nonempty text sheet with no more than 16,000 characters and no null characters."})
    } finally {
      this.setState({importingText: false})
    }
  }

  async restoreBackup(event) {
    const input = event.currentTarget
    const file = input.files[0]
    input.value = ""
    if (!file) return
    if (file.size > SONGBOOK_BACKUP_SIZE_LIMIT) {
      this.setState({importError: "Choose a songbook backup no larger than 32 MB."})
      return
    }

    this.setState({importing: true, importError: ""})
    try {
      const backup = await file.text()
      const existing = readSongbook(localStorage)
      let sheets
      try {
        sheets = importSongbook(backup, existing, () => crypto.randomUUID())
      } catch {
        this.setState({importError: "Choose a valid Music Tools songbook backup."})
        return
      }
      const added = sheets.length - existing.length
      if (added) localStorage.setItem(SONGBOOK_STORAGE_KEY, JSON.stringify(sheets))
      this.setState({sheets})
      this.notify(added ? `Imported ${added} ${added === 1 ? "sheet" : "sheets"}.` : "No new sheets to import.")
    } catch {
      this.setState({importError: "Could not read the backup or save the imported sheets in this browser."})
    } finally {
      this.setState({importing: false})
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
        <div className={styles.actions}>
          <button type="button" disabled={!sheets.length} onClick={() => this.downloadBackup()}>
            Download saved sheets
          </button>
          <label>Import songbook backup
            <input type="file" accept=".json,application/json" disabled={this.state.importing}
              onChange={event => this.restoreBackup(event)} />
          </label>
        </div>
        <p>Backups include saved sheets only. Import keeps existing sheets and skips unchanged copies of previously imported sheets.</p>
        {this.state.importError && <p role="alert">{this.state.importError}</p>}
        <label>Open chord sheet text
          <input type="file" accept=".txt,text/plain" disabled={this.state.importingText}
            onChange={event => this.importText(event)} />
        </label>
        <p>Open a UTF-8 text file with bracketed chords. The filename becomes its title.
          Imported text starts in its written key as a new, unsaved sheet.</p>
        {this.state.textImportError && <p role="alert">{this.state.textImportError}</p>}
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
          <button type="button" disabled={!source.trim()} onClick={() => this.downloadText()}>
            Download chord sheet text
          </button>
          <button type="button" disabled={!source.trim()} onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
        <p>Text downloads include the current edits and transposition, with chords in brackets. Downloading does not change your saved sheet.</p>
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
