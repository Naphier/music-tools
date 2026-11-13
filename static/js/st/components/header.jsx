import * as React from "react"
import classNames from "classnames"
import {Link, NavLink} from "react-router-dom"

import {trigger} from "st/events"
import MidiButton from "st/components/midi_button"
import ThemePicker from "st/components/theme_picker"
import {IconDownArrow} from "st/components/icons"

import Lightbox from "st/components/lightbox"

import {getSession} from "st/app"

import {toggleActive} from "st/components/util"

import styles from "./header.module.css"

export default class Header extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      menuOpen: false
    }
  }

  renderNavigationMenu() {
    let userLinks = this.getPageLinks()

    let menu = null

    if (this.state.menuOpen) {
      let accountArea = null
      const session = getSession()

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

      menu = <Lightbox
        key="navigation_menu"
        className={styles.navigation_menu}
        ariaLabelledby="tool-navigation-title"
        onClick={e => {
          if (e.target.closest("a")) {
            this.setState({ menuOpen: false })
          }
        }}
        onClose={(lb) => {
          this.setState({ menuOpen: false })
        }}
      >
        <div className={styles.menu_heading}>
          <h2 id="tool-navigation-title">Your music workspace</h2>
          <button type="button" onClick={() => this.setState({menuOpen: false})}>Close</button>
        </div>
        {accountArea}
        <div className={styles.midi_button_wrapper}>{this.renderMidiButton()}</div>
        <nav aria-labelledby="tool-navigation-title" className={styles.tool_groups}>
          {[
            ["Train your ear & reading", ["root", "ear-training", "flash-cards"]],
            ["Play & create", ["play-along", "drum-machine", "guitar-scales", "chord-lab", "chord-sheet"]],
            ["Reference & progress", ["chord-reference", "about", "stats"]]
          ].map(([title, keys]) => <section key={title}>
            <h3>{title}</h3>
            <ul>{userLinks.filter(link => keys.includes(link.key)).map(link => <li key={link.key}>{link}</li>)}</ul>
          </section>)}
        </nav>
      </Lightbox>
    }

    return <div className={styles.menu_toggle}>
      <button type="button" aria-haspopup="dialog" aria-expanded={this.state.menuOpen} onClick={e => {
        this.setState({ menuOpen: !this.state.menuOpen })
      }}>Explore tools {<IconDownArrow width={12}/>}</button>
      {menu}
    </div>
  }

  getPageLinks() {
    let links = [
      <NavLink end key="root" to="/" {...toggleActive}>Staff</NavLink>,
      <NavLink end key="ear-training" to="/ear-training/interval-melodies" {...toggleActive}>Ear Training</NavLink>,
      <NavLink end key="flash-cards" to="/flash-cards/note-math" {...toggleActive}>Flash Cards</NavLink>,
      <NavLink key="play-along" to="/play-along" {...toggleActive}>Play Along</NavLink>,
      <NavLink key="drum-machine" to="/drum-machine" {...toggleActive}>Drum Machine</NavLink>,
      <NavLink key="guitar-scales" to="/guitar-scales" {...toggleActive}>Guitar Scales</NavLink>,
      <NavLink key="chord-lab" to="/chord-lab" {...toggleActive}>Chord Lab</NavLink>,
      <NavLink key="chord-sheet" to="/chord-sheet" {...toggleActive}>Chord Sheet</NavLink>,
      <NavLink key="chord-reference" to="/chord-reference" {...toggleActive}>Chord Reference</NavLink>,
      <NavLink end key="about" to="/about" {...toggleActive}>Guide</NavLink>,
    ]

    const session = getSession()

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
    return <div className={styles.header}>
      <Link to="/" className={styles.logo_link}>
        <span className={styles.wordmark}>Napland <span>Music Tools</span></span>
      </Link>

      <div className={styles.user_links}>
        {this.renderNavigationMenu()}
      </div>

      <div className={styles.desktop_midi}>{this.renderMidiButton()}</div>
      <ThemePicker />
    </div>

  }
}

