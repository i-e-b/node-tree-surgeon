var expect = require('chai').expect;

var _ = require("../loredo.js");

describe("Coalesing values", function(){
    it("should join two arrays by concatenation", function(){
        expect(
            _.coalesce([1,2], [3,4])
        ).to.deep.equal([1,2,3,4]);
    });
    it("should return only the second element if the first is null", function(){
        expect(_.coalesce(null, [1,2])).to.deep.equal([1,2]);
    });
    it("should return only the first element if the second is null", function(){
        expect(_.coalesce([1,2], null)).to.deep.equal([1,2]);
    });
    it("should return an array even if both the two supplied values are not arrays",function(){
        expect(_.coalesce(1,2)).to.deep.equal([1,2]);
    });
});

describe("Filtering values", function(){
    it("should filter by a property's truthyness",function(){
        var input = [{pick:true}, {pick:[]}, {pick:null}, {pick:false}];
        var expected = [{pick:true}, {pick:[]}];

        var result = _.filter(input, "pick");
        expect(result).to.deep.equal(expected);
    });
    it("should filter by partial property match",function(){});
    it("should filter by predicate function",function(){});
});
