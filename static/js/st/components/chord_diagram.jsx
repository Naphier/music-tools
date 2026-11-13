import * as React from "react"
import {STRING_NAMES} from "st/guitar_chords"
import styles from "./guitar_visuals.module.css"

export default function ChordDiagram({frets, fingers, name = "Guitar chord"}) {
  const stopped = frets.filter(fret => fret > 0)
  const start = stopped.length && Math.max(...stopped) > 5 ? Math.min(...stopped) : 1
  const rows = Math.max(5, ...stopped.map(fret => fret - start + 1))
  const bottom = 50 + rows * 28
  const summary = frets.map((fret, index) => `${STRING_NAMES[index]} ${fret === null ? "muted" : fret === 0 ? "open" : `fret ${fret}${fingers?.[index] ? ` finger ${fingers[index]}` : ""}`}`).join(", ")
  return <figure className={styles.diagram}>
    <svg viewBox={`0 0 210 ${bottom + 30}`} role="img" aria-label={`${name}: ${summary}`}>
      <title>{`${name}: ${summary}`}</title>
      {Array.from({length: rows + 1}, (_, row) => <line key={`f${row}`} x1="35" x2="175"
        y1={50 + row * 28} y2={50 + row * 28} stroke="currentColor" strokeWidth={row === 0 && start === 1 ? 6 : 2} />)}
      {[1, 2, 3, 4].map(finger => {
        const strings = frets.map((fret, index) => ({fret, index})).filter(({fret, index}) => fret > 0 && fingers?.[index] === finger)
        if (strings.length < 2 || strings.some(({fret}) => fret !== strings[0].fret)) return null
        const y = 50 + (strings[0].fret - start + .5) * 28
        return <line key={`barre${finger}`} x1={35 + strings[0].index * 28} x2={35 + strings.at(-1).index * 28}
          y1={y} y2={y} stroke="currentColor" strokeWidth="18" strokeLinecap="round" />
      })}
      {frets.map((fret, index) => {
        const x = 35 + index * 28
        return <g key={index}>
          <line x1={x} x2={x} y1="50" y2={bottom} stroke="currentColor" strokeWidth="1.5" />
          <text x={x} y={bottom + 22} textAnchor="middle" fill="currentColor" fontSize="12">{["E", "A", "D", "G", "B", "e"][index]}</text>
          {fret === null ? <text x={x} y="35" textAnchor="middle" fill="currentColor" fontSize="23">×</text>
            : fret === 0 ? <circle cx={x} cy="28" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
              : <>
                <circle cx={x} cy={50 + (fret - start + .5) * 28} r="11" fill="currentColor" />
                {fingers?.[index] && <text x={x} y={54 + (fret - start + .5) * 28} textAnchor="middle"
                  className={styles.finger} fontSize="13" fontWeight="700">{fingers[index]}</text>}
              </>}
        </g>
      })}
      {start > 1 && <text x="9" y="68" fill="currentColor" fontSize="12">{start}fr</text>}
    </svg>
    <figcaption>{name}</figcaption>
  </figure>
}
