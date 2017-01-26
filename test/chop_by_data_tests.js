var expect = require('chai').expect;

var tree = require("../tree-surgeon.js");

describe("Chopping data out of a tree", function() {
    describe("When chopping child nodes by kind and a data predicate", function(){
        it("should remove the nodes and their subtrees where they match", function(){
            var input = {
                "a":{
                    "par":{
                        "targ":{
                            "victim":[{"a":1},{"a":2}], // these should be removed
                            "other":{"a":1} // this should be retained
                        },
                        "data":{
                            "max":0 // this one should have all its 'victim' children removed
                        }
                    }
                },
                "b":{
                    "par":{
                        "targ":{
                            "victim":[{"a":1},{"a":2}], // these should be retained
                        },
                        "data":{
                            "max":1 // this one should keep all its 'victim' children
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "targ":{ "other":{"a":1} },
                        "data":{ "max":0 }
                    }
                },
                "b":{ "par":{
                        "targ":{ "victim":[{"a":1},{"a":2}], },
                        "data":{ "max":1 }
                    }
                }
            };

            var comparator = function(parent, victim){ return true };
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input).chopNodesByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
        it("should only remove nodes if the victim function returns a true value", function(){
         var input = {
                "a":{
                    "par":{
                        "match":1,
                        "targ":{
                            "victim":[
                                {"a":1, "match":2},
                                {"a":2, "match":1}
                            ],
                            "other":{"a":1}
                        },
                        "data":{
                            "max":0
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "match":1,
                        "targ":{
                            "victim":[
                                {"a":1, "match":2}
                            ],
                            "other":{"a":1}
                        },
                        "data":{ "max":0 }
                    }
                }
            };

            var comparator = function(parent, victim){ return parent.match == victim.match };
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input).chopNodesByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
    });
    describe("When chopping paths to a child by a kind and a data predicate", function(){
        it("should remove the paths and their subtrees where they match", function(){
            var input = {
                "a":{
                    "par":{
                        "targ":{
                            "victim":{"a":1}, // these should be removed
                            "other":{"a":1} // this should also be removed
                        },
                        "data":{
                            "max":0 // this one should have all its 'victim' children removed
                        }
                    }
                },
                "b":{
                    "par":{
                        "targ":{
                            "victim":[{"a":1},{"a":2}], // these should be retained
                        },
                        "data":{
                            "max":1 // this one should keep all its 'victim' children
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "data":{ "max":0 }
                    }
                },
                "b":{ "par":{
                        "targ":{ "victim":[{"a":1},{"a":2}], },
                        "data":{ "max":1 }
                    }
                }
            };

            var comparator = function(parent, victim){ return true };
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input).chopPathsByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
        it("should remove paths if any victim function returns a true value", function(){
         var input = {
                "a":{
                    "par":{
                        "match":1,
                        "targ":{
                            "victim":[
                                {"a":1, "match":2},
                                {"a":2, "match":1}
                            ],
                            "other":{"a":1}
                        },
                        "data":{
                            "max":0
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "match":1,
                        "data":{ "max":0 }
                    }
                }
            };

            var comparator = function(parent, victim){ return parent.match == victim.match };
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input).chopPathsByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
        it("should remove work where the victim is a leaf node", function(){
         var input = {
                "a":{
                    "par":{
                        "match":1,
                        "targ":{
                            "victim":{},
                            "other":{"a":1}
                        },
                        "data":{
                            "max":0
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "match":1,
                        "data":{ "max":0 }
                    }
                }
            };

            var comparator = function(parent, victim){ return true; };
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input).chopPathsByData("data", "targ", "victim", selector, comparator).compose();

            expect(actual).to.deep.equal(expected);

        });
    });
    describe("When using predicate objects for kinds",function(){
        it("should match and chop correctly", function(){
            var input = {
                "a":{
                    "par":{
                        "match":1,
                        "targ":{
                            "this-one":true,
                            "victim":{},
                            "other":{"a":1}
                        },
                        "data":{
                            "max":0
                        }
                    }
                }
            };

            var expected = {
                "a":{ "par":{
                        "match":1,
                        "data":{ "max":0 }
                    }
                }
            };

            var decorator = function(node){ return (node["this-one"]) ? ({Pick:"me"}) : ({});};
            var comparator = function(parent, victim){return true;};
            var selector = function(dataNode){return dataNode.max == 0;};

            var actual = tree.decompose(input, decorator).chopPathsByData({Kind:"data"}, {Pick:"me"}, {Kind:"victim"}, selector, comparator).compose();

            expect(actual).to.deep.equal(expected);
        });
    });
    describe("When handling non-normalised relational structures",function(){
        // Users might not keep the root node, and might want to `harvest` after chopping
        it("should complete without error",function(){
            var relational = {
                "Nodes":[
                    { "meta":1 },
                    { "meta":2 },
                    { "meta":3 }
                ],
                "Relations":[
                    {"Parent":2, "Child":2, "Kind":"meta", "IsArray": false} // <-- this refers to a relation that is not present
                ],
                "Root":0,
                "RootArray":false
            };

            var always = function(){return true;};
            var _ = tree.chopPathsByData("meta", "meta", "meta", always, always, relational);
        });
    });
});
