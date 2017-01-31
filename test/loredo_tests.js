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
    it("should filter by partial property match",function(){
        var input = [
            {pick:"me",  yes:true, thing:1},
            {pick:"not", yes:true, thing:2},
            {pick:"me",  yes:false, thing:3}
        ];
        var expected = [{pick:"me",  yes:true, thing:1}];

        var result = _.filter(input, {pick:"me",  yes:true});
        expect(result).to.deep.equal(expected);
    });
    it("should filter by predicate function",function(){
        var input = [
            {pick:"me",  yes:true, thing:1},
            {pick:"not", yes:true, thing:2},
            {pick:"me",  yes:false, thing:3}
        ];
        var expected = [{pick:"me",  yes:false, thing:3}];

        var predicate = function(obj){ return obj.thing == 3; };

        var result = _.filter(input, predicate);
        expect(result).to.deep.equal(expected);
    });
});

describe("Plucking values from objects", function(){
    it("should return an array of the values found in the supplied objects",function(){
        var input = [
            {a:1, b:2, c:3},
            {a:4, b:5, c:6},
            {a:7, b:8, c:9}
        ];

        var expected = [2,5,8];

        var result = _.pluck(input, "b");
        expect(result).to.deep.equal(expected);
    });
    it("should ignore any undefined values, but include any nulls",function(){
        var input = [
            {a:1, b:2},
            {a:4, b:null},
            {a:7, b:undefined}
        ];

        var expected = [2,null];

        var result = _.pluck(input, "b");
        expect(result).to.deep.equal(expected);
    });
});

describe("Shallow clone", function(){
    it("should provide a new object containing the same values as the original", function(){
        var input = {
            one: 1,
            two: {three:3},
            four: [1,2,3,4],
            hello: "world"
        };

        var result = _.clone(input);

        expect(result).to.deep.equal(input);
        expect(result == input).to.be.false;
    });
    it("should return functions unchanged", function(){
        var input = function(){return 1;};

        var result = _.clone(input);
        expect(result == input).to.be.true;
    });
});

describe("Detecting plain objects", function(){
    it("should map 'null' -> false", function(){ expect(_.isPlainObject(null)).to.be.false; });
    it("should map '{...}' -> true", function(){ expect(_.isPlainObject({prop:"value"})).to.be.true; });
    it("should map functions -> false", function(){ expect(_.isPlainObject(function(){})).to.be.false; });
    it("should map '[...]' -> false", function(){ expect(_.isPlainObject([1,2,3])).to.be.false; });
    it("should map strings -> false", function(){ expect(_.isPlainObject("hello")).to.be.false; });
    it("should return 'true' for extensions of plain objects",function(){
        var root = function() {return {}; };
        var input = new root();

        expect(_.isPlainObject(input)).to.be.true;
    });
    it("should return 'false' for complex objects",function(){
        var input = new Error("sample");
        expect(_.isPlainObject(input)).to.be.false;
    });
    it("should return 'true' for `new Object()`", function(){
        var input = new Object();
        expect(_.isPlainObject(input)).to.be.true;
    });
    it("should return 'false' for compound objects", function(){
        var proto = {};
        var input = Object.create(proto);
        expect(_.isPlainObject(input)).to.be.false;

    });
});

describe("Merging objects", function(){
    it("should recursively combine objects",function(){
        var dst = {
            "UseID": "4b6bc79e-9796-4e75-89df-b4171d98bc1a",
            "ID": "ID_c056c456fc6",
            "Value": [
                {
                    "ValueDetail": "scott.lain956",
                    "Value": "scott.lain956"
                }
            ],
            "CharacteristicID": "439708de-e4f0-4de1-9cda-91e5e522944d",
            "UseArea": "User_Specification_Characteristics"
        };
        var src = {
            "ID": "ID_k3v63xn6n8",
            "EntityID": "abb58a8b-49b6-472f-b543-ed8ce49c7d49",
            "Value": [
                {
                    "ID": "ID_xohfbob4h6",
                    "EntityID": "5bf00018-52cd-4dcd-ab7a-15938a216bee",
                }
            ]
        };

        var expected = {
            "CharacteristicID": "439708de-e4f0-4de1-9cda-91e5e522944d",
            "EntityID": [
                "abb58a8b-49b6-472f-b543-ed8ce49c7d49",
            ],
            "ID": [
                "ID_c056c456fc6",
                "ID_k3v63xn6n8",
            ],
            "UseArea": "User_Specification_Characteristics",
            "UseID": "4b6bc79e-9796-4e75-89df-b4171d98bc1a",
            "Value": [
                {
                    "Value": "scott.lain956",
                    "ValueDetail": "scott.lain956",
                },
                {
                    "EntityID": "5bf00018-52cd-4dcd-ab7a-15938a216bee",
                    "ID": "ID_xohfbob4h6",
                }
            ]
        };

        _.merge(dst, src);
        expect(dst).to.deep.equal(expected);
    });
    it("should use a combination function if one is supplied",function(){
        var dst = {
            a:1,
            b:2
        };
        var src = {
            b:3,
            c:4
        };

        var cmb = function(a,b) {
            return (a) ? (a+"+"+b) : (b);
        };

        var expected = {
            "a": 1,
            "b": "2+3",
            "c": 4
        };

        _.merge(dst, src, cmb);

        expect(dst).to.deep.equal(expected);
    });
    it("should handle circular references",function(){
        var v = [ [0,1], [2,3]];
        var src = {
            a: {},
            b: {
                v: v,
                b: {
                    v: v
                }
            }
        };
        src.a.s = src;
        src.b.a = src.a;
        src.b.b = src.b;


        var dst = {
            a: {},
            b: {
                v:v
            }
        };

        _.merge(dst, src);
        expect(dst.a[1].s.b.v[0][0]).to.equal(0);
    });
    it("should handle when the join function returns undefined by making a shallow copy", function(){
        var dst = {
            a:1,
            b:2,
            c:3
        };

        var src = {
            a:2,
            b:3,
            c:4,

            w:{x:"x", y:"y", z:"z"},
            u:[[1],{a:2},3,null]
        };

        var expected = {
            a:2,
            b:3,
            c:4,
            w:{x:"x", y:"y", z:"z"},
            u:[[1],{a:2},3,null]
        }

        var excludeJoin = function(x,y){
            return undefined;
        };

        _.merge(dst, src, excludeJoin);
        expect(dst).to.deep.equal(expected);
    });
    it("should survive crazy circular cross-references",function(){
        var a = {a:1};
        var b = [a];
        var c = [null, undefined, {a:null}];

        var dst = {
            x:[a,b],
            y:{c:c}
        };
        var src = {
            x:[a,b],
            y:{c:c}
        };

        a.s = src;
        a.d = dst;
        dst.d = dst;
        src.d = dst;
        dst.s = src;
        src.s = src;

        _.merge(dst, src);
        // simply not erroring should be good enough here
    });
});

describe("Removing array elements by predicates", function(){
    it("should remove elements where the named property is truthy",function(){
        var input = [
            {i:1, gone:true},
            {i:2, gone:false},
            {i:3, gone:true}
        ];
        var expected = [{i:2, gone:false}];

        var result = _.remove(input, "gone");
        expect(result).to.be.deep.equal(expected);
    });
    it("should remove elements where a predicate function returns true", function(){
        var input = [
            {i:1, gone:true},
            {i:2, gone:false},
            {i:3, gone:true}
        ];
        var expected = [{i:1, gone:true}];

        var result = _.remove(input, function(e){return e.i != 1;});
        expect(result).to.be.deep.equal(expected);
    });
    it("should remove elements by property match", function(){
        var input = [
            {i:1, a:true, b:false},
            {i:2, a:false, b:true},
            {i:3, a:true, b:true}
        ];
        var expected = [
            {i:1, a:true, b:false},
            {i:2, a:false, b:true},
        ];

        var result = _.remove(input, {a:true, b:true});
        expect(result).to.deep.equal(expected);
    });
    it("should remove all elements if the predicate always matches", function(){
        var input = [
            {i:1, a:true, b:false},
            {i:2, a:false, b:true},
            {i:3, a:true, b:true}
        ];
        var expected = [];

        var result = _.remove(input, function(){return true;});
        expect(result).to.deep.equal(expected);
    });

});

describe("Finding elements in an array",function(){
    it("should return the first element that has a truthy value for the named property", function(){
        var input = [
            {i:1, a:false},
            {i:2, a:true},
            {i:3, a:true}
        ];
        var expected = {i:2, a:true};

        var result = _.find(input, "a");
        expect(result).to.deep.equal(expected);
    });
    it("should return the first element that where a predicate function returns true", function(){
        var input = [
            {i:1, a:false},
            {i:2, a:true},
            {i:3, a:true}
        ];
        var expected = {i:1, a:false};

        var result = _.find(input, function(){return true;});
        expect(result).to.deep.equal(expected);
    });
    it("should return undefined where a predicate function never returns true", function(){
        var input = [
            {i:1, a:false},
            {i:2, a:true},
            {i:3, a:true}
        ];
        var expected = undefined;

        var result = _.find(input, function(){return false;});
        expect(result).to.deep.equal(expected);
    });
    it("should return the first element by property match",function(){
        var input = [
            {i:1, a:false},
            {i:2, a:true},
            {i:3, a:true, b:true}
        ];
        var expected = {i:3, a:true, b:true};

        var result = _.find(input, {a:true, b:true});
        expect(result).to.deep.equal(expected);
    });
});

describe("Checking for any matches with 'some'",function(){
    var input = [
        {maybe:false, always:true, never:false},
        {maybe:true,  always:true, never:false},
    ];
    it("should return true for a named propery match", function(){
        expect(_.some(input, "maybe")).to.be.true;
        expect(_.some(input, "always")).to.be.true;
    });
    it("should return false where there are no named property matches",function(){
        expect(_.some(input, "never")).to.be.false;
    });
    it("should be able to match by predicate function",function(){
        expect(_.some(input, function(n){return n.never})).to.be.false;
        expect(_.some(input, function(n){return n.maybe})).to.be.true;
        expect(_.some(input, function(n){return n.always})).to.be.true;
    });
    it("should be able to match by property matches",function(){
        expect(_.some(input, {maybe:true, never:false})).to.be.true;
        expect(_.some(input, {maybe:false, always:true})).to.be.true;
        expect(_.some(input, {maybe:false, always:false})).to.be.false;
    });
});

describe("Indexing collections", function(){
    var input = [
        {a:1, s:"one"},
        {a:2, s:"one"},
        {a:3, s:"two"},
        {a:4, s:"two"},
    ];
    it("should create an indexed object by a given property name",function(){
        var expected = {
            "1": {
                "a": 1,
                "s": "one",
            },
            "2": {
                "a": 2,
                "s": "one",
            },
            "3": {
                "a": 3,
                "s": "two",
            },
            "4": {
                "a": 4,
                "s": "two",
            }
        };
        var result = _.indexBy(input, "a");

        expect(result).to.deep.equal(expected);
    });
    it("should create an indexed object by a selector function",function(){
        var expected = {
            "x1": {
                "a": 1,
                "s": "one",
            },
            "x2": {
                "a": 2,
                "s": "one",
            },
            "x3": {
                "a": 3,
                "s": "two",
            },
            "x4": {
                "a": 4,
                "s": "two",
            }
        };
        var result = _.indexBy(input, function(n){return "x"+n.a});

        expect(result).to.deep.equal(expected);
    });
    it("should not merge when the index is not unique",function(){
        var expected = {
            "one": {
                "a": 2,
                "s": "one",
            },
            "two": {
                "a": 4,
                "s": "two",
            }
        };
        var result = _.indexBy(input, "s");

        expect(result).to.deep.equal(expected);
    });
});
