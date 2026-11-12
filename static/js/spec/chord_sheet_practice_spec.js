import ChordSheetPage from "st/components/pages/chord_sheet_page"

describe("Chord sheet practice scrolling", () => {
  let page, previousRequest, previousCancel, nextFrame
  beforeEach(() => {
    previousRequest = globalThis.requestAnimationFrame
    previousCancel = globalThis.cancelAnimationFrame
    globalThis.requestAnimationFrame = callback => { nextFrame = callback; return 1 }
    globalThis.cancelAnimationFrame = jasmine.createSpy("cancelAnimationFrame")
    page = new ChordSheetPage({})
    page.setState = (update, callback) => {
      Object.assign(page.state, typeof update === "function" ? update(page.state) : update)
      callback?.()
    }
    page.state.source = "[Am]Practice"
    page.state.practicing = true
    page.preview.current = {scrollTop: 0, scrollHeight: 1000, clientHeight: 200, focus() {}}
  })
  afterEach(() => {
    globalThis.requestAnimationFrame = previousRequest
    globalThis.cancelAnimationFrame = previousCancel
  })
  it("scrolls at the chosen speed and retains fractional progress", () => {
    page.startScroll()
    nextFrame(0)
    nextFrame(50)
    expect(page.preview.current.scrollTop).toBe(1.5)
    page.setState({scrollSpeed: 60})
    nextFrame(100)
    expect(page.preview.current.scrollTop).toBe(4.5)
  })
  it("caps background elapsed time and stops at the bottom", () => {
    page.startScroll()
    nextFrame(0)
    nextFrame(5000)
    expect(page.preview.current.scrollTop).toBe(3)
    page.scrollPosition = 799
    nextFrame(5050)
    expect(page.state.scrolling).toBe(false)
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })
  it("resumes from a manually chosen position", () => {
    page.startScroll()
    nextFrame(0)
    page.pauseScroll()
    page.preview.current.scrollTop = 400
    page.startScroll()
    nextFrame(1000)
    nextFrame(1100)
    expect(page.preview.current.scrollTop).toBe(403)
  })
  it("pauses on exit, resets changed sheets, and cancels on unmount", () => {
    page.startScroll()
    page.togglePractice()
    expect(page.state.practicing).toBe(false)
    expect(page.state.scrolling).toBe(false)
    page.preview.current.scrollTop = 50
    page.componentDidUpdate({}, {...page.state, source: "previous sheet"})
    expect(page.preview.current.scrollTop).toBe(0)
    page.componentWillUnmount()
    expect(globalThis.cancelAnimationFrame).toHaveBeenCalled()
  })
  it("does not start outside practice view or for an empty sheet", () => {
    page.state.practicing = false
    page.startScroll()
    expect(page.state.scrolling).toBe(false)
    page.state.practicing = true
    page.state.source = " "
    page.startScroll()
    expect(page.state.scrolling).toBe(false)
  })
})
