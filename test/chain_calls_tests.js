var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Chaining of calls", function() {
    it("should have compose call available on decomposed object", function() {
        var original = {
            "ID":"1",
            "simple":"value",
            "subtree" : {
                "ID":"2",
                "node":"2",
                "subsub" : {
                    "ID":"3",
                    "value":"hi there"
                }
            },
            "another" : {
                "ID":"4",
                "what":"child of the root"
            }
        };
 
        var result = tree.decompose(original).compose();

        expect(result).to.deep.equal(original);
        expect(result == original).to.be.false;
    });
    it("should be able to render an output from decomposed object", function(){
       var input = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"y"
                }
            },
            "three" : {}
        };
        
        var expected = {
            "uno" : {
                "x":1,
                "dos":{
                    "x":1
                }
            },
            "three" :{
                "z":2
            },
            "z":2
        };

        var nodeFunc = function(n) {
            if (n.x) n.x = 1;
            else n.z = 2;
            return n;
        }

        var kindFunc = function(kind, path) {
            if (kind == "one") return "uno";
            if (kind == "two") return "dos";
            return kind;
        }


        var result = tree.decompose(input).render(nodeFunc, kindFunc);

        expect(result).to.deep.equal(expected);
 
    });

    it("should be able to chain edit-by-kind calls correctly", function() {
        var input = {
            "no":{"A":"B"},
            "yes":{"A":"x"}
        };
        var expected = {
            "no":{"A":"B"},
            "yes":{"A":"x", "B":"x", "C":"x"},
        };

        var edit1 = function(n){n.B=n.A; return n};
        var edit2 = function(n){n.C=n.B; return n};

        var result = tree.decompose(input).editByKind("yes",edit1).editByKind("yes",edit2).compose();

        expect(result).to.deep.equal(expected);

    });
});
