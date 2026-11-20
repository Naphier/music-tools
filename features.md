# Music Tools features

See the [site guide](https://music-tools.naplandgames.com/about) for help using the tools.

## Trainer preferences and hit statistics

Signed-in accounts store trainer preferences in PostgreSQL; guests store them in
localStorage. Configure panel choices, Wait/Scroll mode, speed, keyboard visibility,
and the panel's open state are restored. Account preferences load with the session
and save automatically, with a separate per-account device cache. The page reports
failed account saves and retries when another setting changes or connectivity returns.
Account settings use last-write-wins behavior across devices.

Reset clears the current practice session's hits, misses, streak, last streak, and
per-note timing data. It preserves pending uploads and account history. Last streak
shows the most recently ended nonzero streak, including after consecutive misses.
The Stats page reports the best daily hits and average hits per active day across
all account history, grouped using the viewer's timezone offset. An active day has
at least one recorded hit or miss; inactive days are excluded from the average.

For a frontend preview check, change the guest settings and reload. Build a streak,
then miss several notes and confirm Last Streak stays visible. Reset should clear
the session counters. Account sync and Stats require a backend-enabled deployment.

## Note Math

To generate a CSV table of every Note Math interval calculation for review and
include it in a pull request as verification:

```bash
mkdir -p dev/out && npm run --silent note_math_csv > dev/out/note-math.csv
```

## Authentication sessions

Login, registration and logout refresh the session CSRF token before submitting. Successful authentication loads a fresh page so trainer preferences and statistics start with the current account. Failed logout keeps the current account visible and reports the error. Session-bound HTML and JSON responses use `Cache-Control: no-store`.

## Drum Machine

Open **Drum Machine** in the navigation or visit `/drum-machine`. Toggle hits across
eight synthesized percussion tracks, choose from ten drum sets, mute instruments, set 30–240 BPM, and add
eighth-note swing. Choose 4/4, 3/4, 5/4, or 6/8 with one or two bars; extending
repeats the first bar. In 6/8, BPM counts dotted quarters; six numbered eighth-note beats each have four
subdivisions (24 cells per bar), with adjustable swing. Eighteen editable presets cover rock, funk, blues, hip-hop, dance, and more.
Use the top-right Your patterns selector and save/new/delete icons to manage up to
100 named patterns on the current browser. New and Save open a naming dialog and preserve the current beat;
confirming selects the named pattern in the dropdown. Saving the same name replaces
it. These patterns are local and do not sync to accounts. Playback uses Web Audio
and stops when leaving the page. No external drum samples or MIDI setup are needed.

Available sets: Classic, Heavy Rock, Woodblocks, Jazz, 808 / Hip-hop, 909 / House,
Industrial, Latin Percussion, Lo-fi, and Taiko / Cinematic. These are synthesized
interpretations; Latin and Taiko display instrument names suited to their sounds.
Press Space to start/stop playback when focus is outside interactive controls.

Drum-set choices are saved with named patterns. Switching sets during playback
keeps the beat running; loading a groove preset retains your selected set.

## Scales and chord exploration

**Scales** (`/scales`, with `/guitar-scales` retained as a redirect) displays a
0–12 guitar fretboard or a two-octave piano from C3 to C5. Choose notes, intervals,
or both; all occurrences of each scale tone are highlighted.

Chord Lab's upper-right gear opens the instrument and display options. Its
fretboard has a reset icon, and chord labels can show notes or degrees. Exact
matches offer common, moveable, and less-common voicings; near matches list notes
to add or remove and offer suggested shapes. Applying a voicing switches to guitar
without clearing the separate piano selection. Chord Reference also groups and
links multiple shapes to the Lab.

Scales, Chord Lab, and Chord Reference automatically save their settings and
selections locally on this browser. They do not sync with accounts or other
devices. Live MIDI notes, open options drawers, and expanded diagram groups are
not restored. Corrupt settings fall back to defaults; denied writes show a
transient warning and retry on the next change.

See the [review checklist](docs/review/scales-chord-usability.md) for manual acceptance.


### Compact chord browsing and diagram export

Chord Lab presents match/suggestion tabs with note letters and shows the selected
chord's returned voicings without foldouts. Piano mode keeps the guitar diagrams
hidden. Reference and Lab share Notes, Fingers, Intervals, and Notes and intervals
diagram options. Each diagram has a Copy as menu for five-fret ASCII blocks or
single-line tabs such as `C = x-3-2-0-1-0`; wide user-entered shapes export as
consecutive five-fret blocks. Clipboard failures can be retried.

Jazz sixth, seventh, and extended chords may omit their natural fifth while
retaining the root, defining third, and other extensions. Such matches and shapes
are marked `no 5`. Ordinary triads and altered fifths still require all tones.
Common grips now include C7 `x-3-2-3-1-x` and major/minor seventh/ninth shells.

See the [completed task list and remaining manual checks](docs/review/chord-ui-task-list.md).

## Website feedback

The Feedback menu opens `/feedback`: search open GitHub issues, upvote a match,
or create an issue after reviewing similar titles. Signed-in accounts get one
website vote per issue. Each vote posts “<username> voted for this from the site”
on GitHub. Website vote comments plus the issue’s native thumbs-up reactions
trigger a single maintainer mention at five total votes. See
[the integration contract](docs/feedback.md) for settings and delivery behavior.
The full backend, migrations and a repository-scoped GitHub credential are required;
the frontend-only preview shows an availability message.


## Returning after login

Login and registration return to the page where authentication started, including
its query and fragment. Shared authentication links carry a local `return_to`
URL through page refreshes, new tabs, and switching between login and registration.
Protected Account and Stats routes use the same flow. External destinations and
auth-page loops fall back to Staff. Authentication still loads a fresh document
to refresh account state and CSRF tokens; logout continues to return to Staff.

## Support Music Tools

Select the coffee cup beside the site name to open the project’s Buy Me a Coffee page in a new tab.
