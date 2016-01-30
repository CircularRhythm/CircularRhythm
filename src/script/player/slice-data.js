export class SliceData {
  constructor(start, duration) {
    this.start = start
    this.duration = duration
    this.sourceNode = null
  }

  play(audioContext, audioBuffer) {
    if(this.sourceNode != null) this.stop()
    this.source = audioContext.createBufferSource()
    this.source.buffer = audioBuffer
    this.source.connect(audioContext.destination)
    if(this.duration) this.source.start(0, this.start / 1000, this.duration / 1000)
    else this.source.start(0, this.start / 1000)
  }

  stop() {
    if(this.source != null) this.source.stop()
    this.source = null
  }
}
