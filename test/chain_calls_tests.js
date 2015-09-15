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
    it("should be able to call remove-empty-nodes from decomposed object", function(){
        var input = {
            "empty":{
                "value":null,
                "another":null,
                "third":undefined
            },
            "notEmpty":{
                "empty":null,
                "notEmpty": 1
            }
        };
        var expected = {
            "notEmpty":{
                "empty":null,
                "notEmpty": 1
            }
        };

        var result = tree.decompose(input).removeEmptyNodes().compose();

        expect(result).to.deep.equal(expected);
    });
    it("should be able to call prune with decorators from decomposed object", function(){
        var input = {
            "X": {
                "B":{
                    "C":{
                        "hello":"world"
                    }
                }
            },
            "Y": {
                "B":{
                    "Skip":true,
                    "C":{
                        "hello":"world"
                    }
                }
            }               
        };
        var expected = {
            "X": {},
            "Y": {
                "B":{
                    "Skip":true,
                    "C":{
                        "hello":"world"
                    }
                }
            }               
        };

        var dec = function(n){return {"Skip": (n.Skip === true)};};

        var result = tree.decompose(input,dec).prune({Kind:"B", Skip:false}).compose();

        expect(result).to.deep.equal(expected);
    });

    it("should be able flip-by-kind from decomposed object", function(){
        var input = {
            a : {
                b : [
                    {
                        key : 1,
                        c : { "parent": "a" }
                    },
                    {
                        key : 2,
                        c : { "parent": "a" }
                    },
                    {
                        key : 3,
                        c : { "parent": "b" }
                    },
                    {
                        key : 4,
                        c : { "parent": "b" }
                    }
                ]
            }
        };

        var expected = {
            a : {
                c : 
                [
                    {
                        "parent":"a",
                        b :
                        [
                            {
                                key : 1,
                            },
                            {
                                key : 2,
                            }
                        ]
                    },
                    {
                        "parent":"b",
                        b :
                        [
                            {
                                key : 3,
                            },
                            {
                                key : 4,
                            }
                        ]
                    },
                ]
            }
        };

        var selector = function(n) {return n.parent;};
        var result = tree.decompose(input).flipRelationship("b","c",selector).compose();

        expect(result).to.deep.equal(expected);
    });
});
