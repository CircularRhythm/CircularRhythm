import assert from "power-assert"
import Util from "circular-rhythm/util"

describe("Util", () => {
  it("formatTime", () => {
    assert(Util.formatTime(10000) === "0:10")
  })
})
