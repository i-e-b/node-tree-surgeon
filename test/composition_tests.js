var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Tree composition from relational model", function() {
    it("should build a plain object tree from a relational model, including all IDs", function() {
        var relational = {
            "Root":"1",
            "Nodes":{
                "1":{
                    "ID":"1",
                    "simple":"value"
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
            ]
        };
        var expected = {
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
 
        var result = tree.compose(relational);

        expect(result).to.deep.equal(expected);
    });

    it("should be able to round-trip an object and get all the data back",function() {
        var original = {
            "ID":"a",
            "fruits":["apple","banana","orange"],
            "children":{
                "ID":"b",
                "child":[
                    {"ID":"c", "name":"Sam", "age":20},
                    {"ID":"d", "name":"chris", "age":30},
                ],
                "grandchildren":[
                    {"ID":"e", "name":"tommy","age":5},
                    {"ID":"f", "name":"chloe","age":8,
                        "favorites":{
                            "ID":"g",
                            "toy":"spanner",
                            "color":"green",
                            "fish":["anchovy","carp"]
                        }
                    }
                ]
            },
        };
        var result = tree.compose(tree.decompose(original));
        expect(result).to.deep.equal(original);
    });
    it("should keep arrays if source provided an array with a single value", function() {
        var input = { "kind" : [{"hello":"world"}] };

        var result = tree.compose(tree.decompose(input));

        expect(result).to.deep.equal(input);
    });
    it("should return an array if the original root object was an array", function(){
        var input = [ {"a":"b"},{"c":"d"} ];
        var result = tree.compose(tree.decompose(input));

        expect(result).to.deep.equal(input);
    });
    it("should handle chains of arrays", function(){
        var input = [ {a:[{"a":"b"}], b:[{"c":["d"]}]} ];
        var result = tree.decompose(input).compose();

        expect(result).to.deep.equal(input);
    });
    it("should handle deep arrays", function(){
        var input = [[[[{"a":"b"}]]]];
        var result = tree.decompose(input).compose();

        expect(result).to.deep.equal(input);
    });
    it("should handle merged objects", function(){
        var relational = {
            "Nodes":[
                {},
                { a:1 },
                { a:2 },
                { a:3 },
                { a:4 }
            ],
            "Relations":[
                {"Parent":0, "Child":1, "Kind":"p", "IsArray": false},
                {"Parent":0, "Child":2, "Kind":"p", "IsArray": false},
                {"Parent":0, "Child":3, "Kind":"p", "IsArray": false},
                {"Parent":0, "Child":4, "Kind":"p", "IsArray": false},
            ],
            "Root":0,
            "RootArray":false
        };
        var expected = {
            "p": [
                { "a": 1 },
                { "a": 2 },
                { "a": 3 },
                { "a": 4 }
            ]
        };
        var result = tree.compose(relational);

        expect(result).to.deep.equal(expected);
    });
    it("should handle merged arrays", function(){
        var relational = {
            "Nodes":[
                {},
                [1],
                [2],
                [3],
                [4]
            ],
            "Relations":[
                {"Parent":0, "Child":1, "Kind":"a", "IsArray": false},
                {"Parent":0, "Child":2, "Kind":"a", "IsArray": true},
                {"Parent":0, "Child":3, "Kind":"a", "IsArray": true},
                {"Parent":0, "Child":4, "Kind":"a", "IsArray": true},
                {"Parent":0, "Child":5, "Kind":"a", "IsArray": true},
            ],
            "Root":0,
            "RootArray":false
        };
        var expected = {
            a:[1,2,3,4]
        };
        var result = tree.compose(relational);

        expect(result).to.deep.equal(expected);
    });


});
