export class SliceData {
  constructor(audioBuffer, start, duration) {
    this.audioBuffer = audioBuffer
    this.start = start
    this.duration = duration
    this.sourceNode = null
  }

  play(audioContext) {
    if(this.sourceNode != null) this.stop()
    this.source = audioContext.createBufferSource()
    this.source.buffer = this.audioBuffer
    this.source.connect(audioContext.destination)
    this.source.start(0, this.start / 1000, this.duration / 1000)
  }

  stop() {
    if(this.source != null) this.source.stop()
    this.source = null
  }
}
