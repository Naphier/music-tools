import * as React from "react"
import classNames from "classnames"
import {Link, NavLink} from "react-router-dom"

import {trigger} from "st/events"
import MidiButton from "st/components/midi_button"
import ThemePicker from "st/components/theme_picker"


import {getSession} from "st/app"

import {toggleActive} from "st/components/util"

import styles from "./header.module.css"

export default class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      menuOpen: true
    }
  }

  renderNavigationMenu() {
    let userLinks = this.getPageLinks()

    let menu = null

    if (this.state.menuOpen) {
      let accountArea = null
      const session = getSession() || {}

      if (session.currentUser) {
        accountArea = <div className={classNames(styles.account_area, styles.logged_in)}>
          <NavLink className={styles.username} to="/account">
            {session.currentUser.displayName || session.currentUser.username}
          </NavLink>
          <a href="#" onClick={this.props.doLogout}>Log out</a>
        </div>
      } else {
        accountArea = <div className={classNames(styles.account_area, styles.logged_out)}>
          <NavLink to="/login" {...toggleActive}>Log in</NavLink>
          <NavLink to="/register" {...toggleActive}>Register</NavLink>
        </div>
      }

      menu = <aside id="tool-navigation" className={styles.sidebar} aria-label="Tools and settings"
        onClick={event => {
          if (event.target.closest("a") && window.matchMedia("(max-width: 760px)").matches) this.closeMenu()
        }}>
        {accountArea}
        <div className={styles.midi_button_wrapper}>{this.renderMidiButton()}</div>
        <nav aria-label="Music tools" className={styles.tool_groups}>
          {[
            ["Train your ear & reading", ["root", "ear-training", "flash-cards"]],
            ["Play & create", ["play-along", "drum-machine", "guitar-scales", "chord-lab", "chord-sheet"]],
            ["Reference & progress", ["chord-reference", "about", "stats"]]
          ].map(([title, keys]) => <section key={title}>
            <h3>{title}</h3>
            <ul>{userLinks.filter(link => keys.includes(link.key)).map(link => <li key={link.key}>{link}</li>)}</ul>
          </section>)}
        </nav>
        <section className={styles.theme_section}>
          <h3>Appearance</h3>
          <ThemePicker inline />
        </section>
      </aside>
    }

    return <>
      <button ref={this.menuButton ||= React.createRef()} className={styles.menu_toggle} type="button"
        aria-label={this.state.menuOpen ? "Close navigation" : "Open navigation"}
        aria-controls="tool-navigation" aria-expanded={this.state.menuOpen}
        onClick={() => this.setState({menuOpen: !this.state.menuOpen})}>
        <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M3 6h18M3 12h18M3 18h18" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      </button>
      {menu && <button type="button" className={styles.backdrop} tabIndex={-1}
        aria-label="Close navigation" onClick={() => this.closeMenu()} />}
      {menu}
    </>
  }

  closeMenu() {
    this.setState({menuOpen: false}, () => this.menuButton.current?.focus())
  }

  getPageLinks() {
    let links = [
      <NavLink end key="root" to="/" {...toggleActive}>Staff</NavLink>,
      <NavLink end key="ear-training" to="/ear-training/interval-melodies" {...toggleActive}>Ear Training</NavLink>,
      <NavLink end key="flash-cards" to="/flash-cards/note-math" {...toggleActive}>Flash Cards</NavLink>,
      <NavLink key="play-along" to="/play-along" {...toggleActive}>Play Along</NavLink>,
      <NavLink key="drum-machine" to="/drum-machine" {...toggleActive}>Drum Machine</NavLink>,
      <NavLink key="guitar-scales" to="/scales" {...toggleActive}>Scales</NavLink>,
      <NavLink key="chord-lab" to="/chord-lab" {...toggleActive}>Chord Lab</NavLink>,
      <NavLink key="chord-sheet" to="/chord-sheet" {...toggleActive}>Chord Sheet</NavLink>,
      <NavLink key="chord-reference" to="/chord-reference" {...toggleActive}>Chord Reference</NavLink>,
      <NavLink end key="about" to="/about" {...toggleActive}>Guide</NavLink>,
    ]

    const session = getSession() || {}

    if (session.currentUser) {
      links.push(<NavLink end key="stats" to="/stats" {...toggleActive}>Stats</NavLink>)
    }

    return links
  }

  renderMidiButton() {
    return <MidiButton
      midiInput={this.props.midiInput}
      pickMidi={() => {
        trigger(this, "pickMidi")
      }} />
  }

  render() {
    return <header className={styles.header} onKeyDown={event => {
      if (!this.state.menuOpen) return
      if (event.key === "Escape") { this.closeMenu(); return }
      if (event.key === "Tab" && window.matchMedia("(max-width: 760px)").matches) {
        const controls = [...event.currentTarget.querySelectorAll('a, button:not([tabindex="-1"])')]
        const target = event.shiftKey ? controls.at(-1) : controls[0]
        if (event.target === (event.shiftKey ? controls[0] : controls.at(-1))) {
          event.preventDefault()
          target.focus()
        }
      }
    }}>
      {this.renderNavigationMenu()}
      <Link to="/" className={styles.logo_link}>
        <span className={styles.wordmark}>Napland <span>Music Tools</span></span>
      </Link>
    </header>
  }
}
