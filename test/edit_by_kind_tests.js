var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Iterating over defined sets", function() {

    describe("Editing children by kind and filter function", function() {
        it("should modify selected children but no other nodes", function(){
            var input = {
                "no":{"A":"B"},
                "yes":{"A":"C"},
                "neither":{"A":"D"}
            };
            var expected = {
                "no":{"A":"B"},
                "yes":{"A":"C", "Found":"C"},
                "neither":{"A":"D"}
            };

            var result = tree.compose(
                tree.editByKind("yes", function(n){n["Found"] = n["A"]; return n;},
                    tree.decompose(input)));

            expect(result).to.deep.equal(expected);
        });


        it("should allow filtering based on relationship decoration", function(){
            var input = {
                "yes":[
                    {"A":"B"},
                    {"A":"C"},
                    {"A":"D"}
                ]
            };
            var expected = {
                "yes":[
                    {"A":"B"},
                    {"A":"C", "Found":"C"},
                    {"A":"D", "Found":"D"}
                ]
            };

            var decorate = function(n){return {skip:(n.A == "B")};};
            var result = tree.compose(
                tree.editByKind({Kind:"yes", skip:false}, function(n){n["Found"] = n["A"]; return n;},
                    tree.decompose(input, decorate)));

            expect(result).to.deep.equal(expected);
        });

    });

    describe("ForEach iteration by kind and predicate", function() {
        it("should pass only selected children to the predicate but no other nodes", function() {
            var input = {
                'yes': {'name': 'First', 'keep': 'yes'},
                'no': {'name': 'Second', 'keep': 'yes'},
                'firstChildren': {
                    'yes': {'name': 'Third', 'keep': 'yes'},
                    'no': {'name': 'Forth', 'keep': 'yes'}
                },
                'secondChildren': {
                    'yes': {'name': 'Fifth', 'keep': 'no'},
                    'no': {'name': 'Sixth', 'keep': 'no'}
                },
                'cousins': {
                    // Test array children
                    'yes': [
                        {'name': 'Seventh', 'keep': 'yes'},
                        {'name': 'Eighth', 'keep': 'no'},
                        {'name': 'Ninth', 'keep': 'yes'}
                    ]
                }
            };
            var expectedResult = ['First', 'Third', 'Seventh', 'Ninth'].sort();

            var result = [];
            var predicate = function (n, id) {
                if (n.keep === 'yes') {
                    result.push(n.name);
                }
            };

            var relational = tree.decompose(input);
            tree.forEachByKind('yes', predicate, relational);
            result.sort();

            expect(result).to.deep.equal(expectedResult);
        });

        it("should allow where predicate on kind if provided", function() {
            var input = {
                'yes': {'name': 'First', 'keep': 'yes'},
                'no': {'name': 'Second', 'keep': 'yes'},
                'firstChildren': {
                    'yes': {'name': 'Third', 'keep': 'yes'},
                    'no': {'name': 'Forth', 'keep': 'yes'}
                },
                'secondChildren': {
                    'yes': {'name': 'Fifth', 'keep': 'no'},
                    'no': {'name': 'Sixth', 'keep': 'no'}
                },
                'cousins': {
                    // Test array children
                    'yes': [
                        {'name': 'Seventh', 'keep': 'yes'},
                        {'name': 'Eighth', 'keep': 'no'},
                        {'name': 'Ninth', 'keep': 'yes'}
                    ]
                }
            };
            var expectedResult = ['Third', 'Ninth'].sort();

            var result = [];
            var predicate = function (n, id) {
                if (n.keep === 'yes') {
                    result.push(n.name);
                }
            };

            var decorator = function(n){return {skip:(n.name == "First" || n.name == "Seventh")};};
            var relational = tree.decompose(input, decorator);
            tree.forEachByKind({Kind:'yes', skip:false}, predicate, relational);
            result.sort();

            expect(result).to.deep.equal(expectedResult);
        });

    });
});
