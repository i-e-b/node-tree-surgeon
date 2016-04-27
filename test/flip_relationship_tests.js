var expect = require('chai').expect;

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
    it("should not change structure if there is not a single matching child under a parent to be flipped", function(){
        var input = {
            a:{
                b:{
                    c:[
                        {"I":"could be a parent"},
                        {"Me":"too!"}
                    ]
                }
            }
        };

        var result = tree.compose(tree.flipRelationship("b", "c", null, tree.decompose(input)));

        expect(result).to.deep.equal(input);
    });
    it("should not change structure unless both side of the flip are present", function(){
        var input = {
            a : {
                b : [
                    {
                        key : 1,
                        "I":"should stay put"
                    },
                    {
                        key : 2,
                        c : { "parent": "a" }
                    }
                ]
            },
            z : {
                c: {"I":"should stay put"}
            }
        };

        var expected = {
            a : {
                b : [{
                    key : 1,
                    "I":"should stay put"
                }],
                c : {
                    "parent":"a",
                    b : {
                        key : 2,
                    }
                }
            },
            z : {
                c : {"I":"should stay put"}
            }
        };

        var result = tree.compose(tree.flipRelationship("b", "c", null, tree.decompose(input)));

        expect(result).to.deep.equal(expected);
    });
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

    it("should select flip targets by where predicate kinds", function(){
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
                        c : { "parent": "a" }
                    },
                    {
                        key : 4,
                        c : { "parent": "a" }
                    }
                ]
            }
        };

        var expected = {
            "a": {
                "b": [
                    {
                        "c": {
                            "parent": "a"
                        },
                        "key": 3
                    },
                    {
                        "c": {
                            "parent": "a"
                        },
                        "key": 4
                    }
                ],
                "c": {
                    "b": [
                        {
                            "key": 1
                        },
                        {
                            "key": 2
                        }
                    ],
                    "parent": "a"
                }
            }
        };


        var decorator = function(n) {return {skip:(n.key > 2)};};
        var equality = function(n) {return n.key;};

        var result = tree.compose(tree.flipRelationship({Kind:"b", skip:false}, "c", equality, tree.decompose(input, decorator)));

        expect(result).to.deep.equal(expected);
    });

    it("should ignore where predicate kinds on new parent kind", function(){
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
                        c : { "parent": "a" }
                    },
                    {
                        key : 4,
                        c : { "parent": "a" }
                    }
                ]
            }
        };

        var expected = {
            "a": {
                "c": {
                    "b": [
                        { "key": 1 }, { "key": 2 }, { "key": 3 }, { "key": 4 }
                    ],
                    "parent": "a"
                }
            }
        };

        var decorator = function(n) {return {skip:true};};
        var equality = function(n) {return n.key;};

        var result = tree.compose(tree.flipRelationship("b",{Kind:"c", skip:false}, equality, tree.decompose(input, decorator)));

        expect(result).to.deep.equal(expected);
    });
});
