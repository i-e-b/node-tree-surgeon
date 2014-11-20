var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Reversing parents and children in the tree", function() {
    it("should have the selected children as the new parent and each of the selected parents as new children", function(){
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
                    }
                ]
            }
        };
        
        var expected = {
            a : {
                c : {
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
                }
            }
        };

        var result = tree.compose(tree.flipRelationship("b", "c", null, tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
    it("should handle multiple potential parents somehow"); /*
What happens with this?
a:{
    b:{
        c:[
            {...},
            {...}
        ]
    }
}

                                                               */
    it("should group new children by parent equality match", function(){
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
        var result = tree.compose(tree.flipRelationship("b", "c", selector, tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
});
