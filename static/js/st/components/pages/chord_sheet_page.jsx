import * as React from "react"

import {setTitle} from "st/globals"
import Toast from "st/components/toast"
import {
  parseChordSheet, readChordSheet, SHEET_STORAGE_KEY, SHEET_TITLE_LIMIT, SHEET_SOURCE_LIMIT,
} from "st/chord_sheet"
import styles from "./chord_sheet_page.module.css"

export default class ChordSheetPage extends React.Component {
  state = {title: "", source: "", notice: "", noticeId: 0}

  componentDidMount() {
    setTitle("Chord Sheet Maker")
    try {
      const saved = localStorage.getItem(SHEET_STORAGE_KEY)
      if (saved !== null) this.setState(readChordSheet(saved))
    } catch {
      this.notify("Could not load the draft from this browser.")
    }
  }

  notify(notice) {
    this.setState(({noticeId}) => ({notice, noticeId: noticeId + 1}))
  }

  save() {
    const {title, source} = this.state
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify({title, source}))
      this.notify("Draft saved in this browser.")
    } catch {
      this.notify("Could not save the draft in this browser.")
    }
  }

  render() {
    const {title, source, notice, noticeId} = this.state

    return <main className={styles.page}>
      <div className={styles.editor}>
        <h1>Chord Sheet Maker</h1>
        <p>Put chords in brackets just before the words they go with, like <code>[Am]Here comes [F]the chorus</code>.
          Use blank lines between sections. For an instrumental line, enter just the chords.</p>

        <label>Song title
          <input value={title} maxLength={SHEET_TITLE_LIMIT}
            onChange={event => this.setState({title: event.target.value})} />
        </label>
        <label>Chords and lyrics
          <textarea value={source} maxLength={SHEET_SOURCE_LIMIT} rows={12}
            onChange={event => this.setState({source: event.target.value})} />
        </label>
        <p>Saving replaces the single draft stored in this browser.</p>
        <div className={styles.actions}>
          <button type="button" onClick={() => this.save()}>Save draft</button>
          <button type="button" disabled={!source.trim()} onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      <section className={styles.preview} aria-label="Chord sheet preview">
        <h2>{title.trim() || "Untitled song"}</h2>
        {source.trim() ? parseChordSheet(source).map((line, lineIndex) =>
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
