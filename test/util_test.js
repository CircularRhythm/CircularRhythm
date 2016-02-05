import assert from "power-assert"

import Util from "circular-rhythm/util"

describe("Util", () => {
  it("can format time", () => {
    assert(Util.formatTime(10000) === "0:10")
    assert(Util.formatTime(60000) === "1:00")
    assert(Util.formatTime(999) === "0:00")
  })
})
