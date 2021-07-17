const should = require("should");

describe("Module", () => {
  it("1. Should expose HappyRouter", (done) => {
    const HappyRouter = require("../dist/lib").default;
    should.exist(HappyRouter);
    HappyRouter.should.be.type("function");
    done();
  });
});
