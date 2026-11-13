import * as React from "react"
import {Link} from "react-router-dom"
import ChordDiagram from "st/components/chord_diagram"
import {guitarChordVoicings} from "st/guitar_chords"
import styles from "./chord_voicings.module.css"

export default function ChordVoicings({notes, bassNote, name, onChoose, linkToLab = false}) {
  const shapes = React.useMemo(() => guitarChordVoicings(notes, 18, bassNote), [notes.join(","), bassNote])
  if (!shapes.length) return <p>No compact voicing found for this chord and bass.</p>
  return <div className={styles.groups}>
    {["Common", "Moveable", "Less common"].map(category => {
      const group = shapes.filter(shape => shape.category === category)
      return <section key={category}>
        <h3>{category} voicings</h3>
        {group.length ? <div className={styles.shapes}>{group.slice(0, 2).map((shape, index) => <div key={shape.frets.join(",")}>
          <ChordDiagram {...shape} name={`${name} · ${category.toLowerCase()} ${index + 1}`} />
          {onChoose && <button type="button" onClick={() => onChoose(shape.frets)}>Use this voicing</button>}
          {linkToLab && <Link to={`/chord-lab?frets=${shape.frets.map(fret => fret ?? "x").join(",")}`}>Explore on fretboard →</Link>}
        </div>)}</div> : <p>{category === "Moveable" ? "No compact moveable shape found in frets 1–12 for this chord and bass." : "No shape available in this group."}</p>}
        {group.length > 2 && <details><summary>More {category.toLowerCase()} shapes</summary><div className={styles.shapes}>
          {group.slice(2).map((shape, index) => <div key={shape.frets.join(",")}>
            <ChordDiagram {...shape} name={`${name} · ${category.toLowerCase()} ${index + 3}`} />
            {onChoose && <button type="button" onClick={() => onChoose(shape.frets)}>Use this voicing</button>}
          {linkToLab && <Link to={`/chord-lab?frets=${shape.frets.map(fret => fret ?? "x").join(",")}`}>Explore on fretboard →</Link>}
          </div>)}
        </div></details>}
      </section>
    })}
  </div>
}
