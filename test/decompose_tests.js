var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

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
                "Nodes":{
                    "id_0":{
                        "ID":"1", "simple":"value"
                    },
                    "id_1":{
                        "ID":"2", "node":"2"
                    },
                    "id_2":{ // note: breadth first search
                        "ID":"4", "what":"child of the root"
                    },
                    "id_3":{
                        "ID":"3", "value":"hi there"
                    }
                },
                "Relations":[
                    {"Parent":"id_0", "Child":"id_1", "Kind":"subtree", "IsArray": false},
                    {"Parent":"id_0", "Child":"id_2", "Kind":"another", "IsArray": false},
                    {"Parent":"id_1", "Child":"id_3", "Kind":"subsub", "IsArray": false}
                ],
                "Root":"id_0",
                "RootArray":false
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
                    "id_0":{ // non-object array still on parent
                        "ID":"1", "ArrayOfValues" : [ "one", "two", "three" ]
                    },
                    "id_1":{
                        "v":"one",
                        "ID":"x"
                    },
                    "id_2":{
                        "v":"two",
                        "ID":"y"
                    }
                },
                "Relations":[
                    {"Parent":"id_0", "Child":"id_1", "Kind":"ArrayOfObjects", "IsArray": true},
                    {"Parent":"id_0", "Child":"id_2", "Kind":"ArrayOfObjects", "IsArray": true},
                ],
                "Root":"id_0",
                "RootArray":false
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
                    "id_0":{
                        "ID":"1",
                        "EmptyArray":[]
                    }
                },
                "Relations":[],
                "Root":"id_0",
                "RootArray":false
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
                    "id_0":{},
                    "id_1":{},
                    "id_2":{
                        "key":"value"
                    }
                },
                "Relations":[
                    {"Parent":"id_0", "Child":"id_1", "Kind":"child", "IsArray": false},
                    {"Parent":"id_1", "Child":"id_2", "Kind":"child", "IsArray": false},
                ],
                "Root":"id_0",
                "RootArray":false
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
                    "id_0":{}
                },
                "Relations":[],
                "Root":"id_0",
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(result).to.deep.equal(expected);
        });

        it("should decompose flat object with no errors", function() {
            var sample = {"key":"value"};
            var expected = {
                "Nodes":{
                    "id_0":{
                        "key":"value"
                    }
                },
                "Relations":[],
                "Root":"id_0",
                "RootArray":false
            };
            var result = tree.decompose(sample);
            expect(result).to.deep.equal(expected);
        });
    });

    describe("Decomposing with supplied IDs", function(){
        it("should decompose an object tree into nodes and relations with selected IDs", function() {
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
                    "2":{
                        "ID":"2", "node":"2"
                    },
                    "4":{ // note: breadth first search
                        "ID":"4", "what":"child of the root"
                    },
                    "3":{
                        "ID":"3", "value":"hi there"
                    }
                },
                "Relations":[
                    {"Parent":"1", "Child":"2", "Kind":"subtree", "IsArray": false},
                    {"Parent":"1", "Child":"4", "Kind":"another", "IsArray": false},
                    {"Parent":"2", "Child":"3", "Kind":"subsub", "IsArray": false}
                ],
                "Root":"1",
                "RootArray":false
            };

            var idSelector = function(n){return n.ID;};

            var result = tree.decomposeWithIds(sample, idSelector);

            expect(result).to.deep.equal(expected);
        });

        it("should recompose the object as it was originally input", function() {
            var input = {
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
                },
                "ArrayOfObjects":[
                    {v:"one", "ID":"x"}, {v:"two", "ID":"y"}
                ],
                "ArrayOfValues" : [
                    "one", "two", "three"
                ]
            };

            var idSelector = function(n){return n.ID;};

            var result = tree.compose(tree.decomposeWithIds(input, idSelector));

            expect(result).to.deep.equal(input);
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
                "Nodes":{
                    "id_0":{
                        "simple":"value",
                        "excluded":{"complex":"value"}, // complex value left in place
                    },
                    "id_1":{
                        "node":"2"
                    },
                    "id_2":{ // note: breadth first search
                        "what":"child of the root"
                    },
                    "id_3":{
                        "value":"hi there"
                    }
                },
                "Relations":[
                    {"Parent":"id_0", "Child":"id_1", "Kind":"subtree", "IsArray": false},
                    {"Parent":"id_0", "Child":"id_2", "Kind":"another", "IsArray": false},
                    {"Parent":"id_1", "Child":"id_3", "Kind":"subsub", "IsArray": false}
                ],
                "Root":"id_0",
                "RootArray":false
            };

            var result = tree.decompose(sample, ["excluded"]);

            expect(result).to.deep.equal(expected);
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
                    "Nodes":{
                        "id_0":{},
                        "id_1":{
                            "meta":1
                        },
                        "id_2":{
                            "meta":2
                        }
                    },
                    "Relations":[
                        {"Parent":"id_0", "Child":"id_1", "Kind":"link", "IsArray": false, "decV":4},
                        {"Parent":"id_1", "Child":"id_2", "Kind":"link", "IsArray": false, "decV":5},
                    ],
                    "Root":"id_0",
                    "RootArray":false
            };

            var result = tree.decompose(input, relationDecorator);
            expect(result).to.deep.equal(expected);
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
                    "Nodes":{
                        "id_0":{},
                        "id_1":{
                            "meta":1,
                            "data":[[1,2,3]]
                        }
                    },
                    "Relations":[
                        {"Parent":"id_0", "Child":"id_1", "Kind":"link", "IsArray": false},
                    ],
                    "Root":"id_0",
                    "RootArray":false
            };

            var result = tree.decompose(input);
            expect(result).to.deep.equal(expected);
        });
        it("should correctly round-trip bare nested arrays", function(){
            var input = {
                "link" : {
                    "meta":1,
                    "data":[[1,2,3]]
                }
            };
            var result = tree.compose(tree.decompose(input));
            expect(result).to.deep.equal(input);
        });

    });

});
