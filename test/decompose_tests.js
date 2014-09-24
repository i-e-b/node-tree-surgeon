var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Tree decomposition", function() {
    
    it("should decompose an object tree into nodes and relations", function() {
        var sample = {
            "ID":"1",
            "simple":"value",       // not changed
            "subtree" : {           // becomes a relation of "Kind":"subtree"
                "ID":"2",
                "node":"2",         // not changed, but a different node from "simple":"value"
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

        var expected = {
            "Nodes":{
                "1":{
                    "ID":"1", "simple":"value"
                },
                "4":{ // note: breadth first search
                    "ID":"4", "what":"child of the root"
                },
                "2":{
                    "ID":"2", "node":"2"
                },
                "3":{
                    "ID":"3", "value":"hi there"
                }
            },
            "Relations":[
                {"Parent":"1", "Child":"2", "Kind":"subtree"},
                {"Parent":"1", "Child":"4", "Kind":"another"},
                {"Parent":"2", "Child":"3", "Kind":"subsub"}
            ],
            "Root":"1"
        };

        var result = tree.decompose(sample);

        expect(result).to.deep.equal(expected);
    });

    it("should decompose arrays of objects as multiple child nodes, while leaving arrays of other values in parent node", function() {
        var sample = {
            "ID":"1",
            "ArrayOfObjects":[
                {v:"one", "ID":"x"}, {v:"two", "ID":"y"}
            ],
            "ArrayOfValues" : [
                "one", "two", "three"
            ]
        };

        var expected = {
            "Nodes":{
                "1":{ // non-object array still on parent
                    "ID":"1", "ArrayOfValues" : [ "one", "two", "three" ]
                },
                "x":{
                    "v":"one",
                    "ID":"x"
                },
                "y":{
                    "v":"two",
                    "ID":"y"
                }
            },
            "Relations":[
                {"Parent":"1", "Child":"x", "Kind":"ArrayOfObjects"},
                {"Parent":"1", "Child":"y", "Kind":"ArrayOfObjects"},
            ],
            "Root":"1"
        };

        var result = tree.decompose(sample);

        expect(result).to.deep.equal(expected);
    });

    it("should treat empty array as plain values", function() {
        var sample = {
            "ID":"1",
            "EmptyArray":[]
        };
        var expected = {
            "Nodes":{
                "1":{
                    "ID":"1",
                    "EmptyArray":[]
                }
            },
            "Relations":[],
            "Root":"1"
        };
        var result = tree.decompose(sample);
        expect(result).to.deep.equal(expected);
    });

    it("should add ID fields if none are given", function() {
         var sample = {
            "child":{
                "child":{
                    "key":"value"
                }
            }
         };
        var expected = {
            "Nodes":{
                "id_0":{
                    "ID":"id_0"
                },
                "id_1":{
                    "ID":"id_1"
                },
                "id_2":{
                    "ID":"id_2",
                    "key":"value"
                }
            },
            "Relations":[
                {"Parent":"id_0", "Child":"id_1", "Kind":"child"},
                {"Parent":"id_1", "Child":"id_2", "Kind":"child"},
            ],
            "Root":"id_0"
        };
        var result = tree.decompose(sample);
        expect(result).to.deep.equal(expected);

    });

    it("should not change input object", function() {
        var input = {
            "simple":"value",
            "subtree" : {
                "node":"2",
                "subsub" : {
                    "value":"hi there"
                }
            },
            "another" : {
                "what":"child of the root"
            }
        };
        var expected = _.cloneDeep(input);

        var result = tree.decompose(input);

        expect(input).to.deep.equal(expected);
    });


    it("should decompose empty object with no errors", function() {
        var sample = {};
        var expected = {
            "Nodes":{
                "id_0":{
                    "ID":"id_0"
                }
            },
            "Relations":[],
            "Root":"id_0"
        };
        var result = tree.decompose(sample);
        expect(result).to.deep.equal(expected);
    });


    it("should decompose flat object with no errors", function() {
        var sample = {"key":"value"};
        var expected = {
            "Nodes":{
                "id_0":{
                    "ID":"id_0",
                    "key":"value"
                }
            },
            "Relations":[],
            "Root":"id_0"
        };
        var result = tree.decompose(sample);
        expect(result).to.deep.equal(expected);
    });
});
