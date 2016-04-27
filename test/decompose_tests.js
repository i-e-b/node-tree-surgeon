var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

// clean up objects to make testing easier
function noFunctions(obj){
    for (var m in obj) if (typeof obj[m] == "function") { delete obj[m]; }
    return obj;
}

describe("Tree decomposition", function() {
    describe("Decomposing with automatic IDs", function(){
        it("should handle objects which have repeated IDs", function(){
            var messedUp = {
                "ID":"1",
                "child": {
                    "ID":"1",
                    "subchild":{
                        "ID":"1",
                        "hello":"world"
                    }
                }
            };

            var result = tree.compose(tree.decompose(messedUp));

            expect(result).to.deep.equal(messedUp);
        });

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
                "Nodes":[
                    {
                        "ID":"1", "simple":"value"
                    },
                    {
                        "ID":"2", "node":"2"
                    },
                    { // note: breadth first search
                        "ID":"4", "what":"child of the root"
                    },
                    {
                        "ID":"3", "value":"hi there"
                    }
                ],
                "Relations":[
                    {"Parent":0, "Child":1, "Kind":"subtree", "IsArray": false},
                    {"Parent":0, "Child":2, "Kind":"another", "IsArray": false},
                    {"Parent":1, "Child":3, "Kind":"subsub", "IsArray": false}
                ],
                "Root":0,
                "RootArray":false
            };

            var result = tree.decompose(sample);

            expect(noFunctions(result)).to.deep.equal(expected);
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
                "Nodes":[
                    { // non-object array still on parent
                        "ID":"1", "ArrayOfValues" : [ "one", "two", "three" ]
                    },
                    {
                        "v":"one",
                        "ID":"x"
                    },
                    {
                        "v":"two",
                        "ID":"y"
                    }
                ],
                "Relations":[
                    {"Parent":0, "Child":1, "Kind":"ArrayOfObjects", "IsArray": true},
                    {"Parent":0, "Child":2, "Kind":"ArrayOfObjects", "IsArray": true},
                ],
                "Root":0,
                "RootArray":false
            };

            var result = tree.decompose(sample);

            expect(noFunctions(result)).to.deep.equal(expected);
        });

        it("should treat empty array as plain values", function() {
            var sample = {
                "ID":"1",
                "EmptyArray":[]
            };
            var expected = {
                "Nodes":[
                    {
                        "ID":"1",
                        "EmptyArray":[]
                    }
                ],
                "Relations":[],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(noFunctions(result)).to.deep.equal(expected);
        });

        it("should treat dates as simple values", function() {
            var sample = {
                "ID":"1",
                "ActivationDate":new Date(12345678)
            };
            var expected = {
                "Nodes":[
                    {
                        "ID":"1",
                        "ActivationDate":new Date(12345678)
                    }
                ],
                "Relations":[],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(noFunctions(result)).to.deep.equal(expected);
        });

        it("should be able to use empty arrays as relations with no children", function(){
            var input = {
                "Empty":[]
            };
            var expected = {
                "Nodes":[
                    {},
                    []
                ],
                "Relations":[
                    {"Parent":0, "Child":1, "Kind":"Empty", "IsArray": true}
                ],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(input, [], null, true);
            var recomposed = tree.compose(result);

            //expect(result).to.deep.equal(expected);
            expect(noFunctions(recomposed)).to.deep.equal(input);
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
                "Nodes":[
                    {},
                    {},
                    {
                        "key":"value"
                    }
                ],
                "Relations":[
                    {"Parent":0, "Child":1, "Kind":"child", "IsArray": false},
                    {"Parent":1, "Child":2, "Kind":"child", "IsArray": false},
                ],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(noFunctions(result)).to.deep.equal(expected);

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
            var expected = JSON.parse(JSON.stringify(input));

            var result = tree.decompose(input);

            expect(input).to.deep.equal(expected);
        });

        it("should decompose empty object with no errors", function() {
            var sample = {};
            var expected = {
                "Nodes":[
                    {}
                ],
                "Relations":[],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(noFunctions(result)).to.deep.equal(expected);
        });

        it("should decompose flat object with no errors", function() {
            var sample = {"key":"value"};
            var expected = {
                "Nodes":[
                    {
                        "key":"value"
                    }
                ],
                "Relations":[],
                "Root":0,
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(noFunctions(result)).to.deep.equal(expected);
        });
    });

    describe("Decomposing with excluded kinds", function(){
        it("should treat excluded kinds as simple values in the node", function(){
            var sample = {
                "simple":"value",       // not changed
                "excluded":{"complex":"value"}, // will NOT become a relation
                "subtree" : {           // becomes a relation of "Kind":"subtree"
                    "node":"2",         // not changed, but a different node from "simple":"value"
                    "subsub" : {
                        "value":"hi there"
                    }
                },
                "another" : {
                    "what":"child of the root"
                }
            };

            var expected = {
                "Nodes":[
                    {
                        "simple":"value",
                        "excluded":{"complex":"value"}, // complex value left in place
                    },
                    {
                        "node":"2"
                    },
                    { // note: breadth first search
                        "what":"child of the root"
                    },
                    {
                        "value":"hi there"
                    }
                ],
                "Relations":[
                    {"Parent":0, "Child":1, "Kind":"subtree", "IsArray": false},
                    {"Parent":0, "Child":2, "Kind":"another", "IsArray": false},
                    {"Parent":1, "Child":3, "Kind":"subsub", "IsArray": false}
                ],
                "Root":0,
                "RootArray":false
            };

            var result = tree.decompose(sample, ["excluded"]);

            expect(noFunctions(result)).to.deep.equal(expected);
        });
    });

    describe("Decomposing with additional relationship metadata", function(){
        it("should decorate relations with the additional data", function(){
            var input = {
                "link" : {
                    "meta":1,
                    "link":{
                        "meta":2
                    }
                }
            };
            var relationDecorator = function(node){return {decV:(node.meta + 3)};};
            var expected = {
                    "Nodes":[
                        {},
                        {
                            "meta":1
                        },
                        {
                            "meta":2
                        }
                    ],
                    "Relations":[
                        {"Parent":0, "Child":1, "Kind":"link", "IsArray": false, "decV":4},
                        {"Parent":1, "Child":2, "Kind":"link", "IsArray": false, "decV":5},
                    ],
                    "Root":0,
                    "RootArray":false
            };

            var result = tree.decompose(input, relationDecorator);
            expect(noFunctions(result)).to.deep.equal(expected);
        });
    });
    describe("Decomposing complex structures", function(){
        it("should treat bare nested arrays as simple values and not decompose them", function(){
            var input = {
                "link" : {
                    "meta":1,
                    "data":[[1,2,3]]
                }
            };
            var expected = {
                    "Nodes":[
                        {},
                        {
                            "meta":1,
                            "data":[[1,2,3]]
                        }
                    ],
                    "Relations":[
                        {"Parent":0, "Child":1, "Kind":"link", "IsArray": false},
                    ],
                    "Root":0,
                    "RootArray":false
            };

            var result = tree.decompose(input);
            expect(noFunctions(result)).to.deep.equal(expected);
        });
        it("should correctly round-trip bare nested arrays", function(){
            var input = {
                "link" : {
                    "meta":1,
                    "data":[[1,2,3]]
                }
            };
            var result = tree.compose(tree.decompose(input));
            expect(noFunctions(result)).to.deep.equal(input);
        });

    });

});
