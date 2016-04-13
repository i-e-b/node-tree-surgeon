var expect = require('chai').expect;
var _ = require('lodash');

var tree = require("../tree-surgeon.js");

describe("Rendering a relational structure into a new object structure", function() {
    Array.prototype.like = function(x) { // compare arrays for value equality
        return (this <= x) && (this >= x);
    }
    it("should apply the node transform to all nodes", function(){
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
            "one" : {
                "x":1,
                "two":{
                    "x":1
                }
            },
            "three" :{
                "z":2
            },
            "z":2
        };

        var renderNode = function(n) {
            if (n.x) n.x = 1;
            else n.z = 2;
            return n;
        }

        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("should be able to render based on path through the hierarchy", function(){
        var input = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"y",
                    "three":{
                        "x":"y"
                    }
                }
            }
        };

        var expected = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"hello, world!",
                    "three":{
                        "x":"y"
                    }
                }
            }
        };

        var renderNode = function(node, path) {
            if (path.like(["one","two"])) node.x = "hello, world!";
            return node;
        }

        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("should apply the relation transform to all relationships", function(){
        var input = {
            "espaniol":{
                "one" : {
                    "two" :{
                        "three":{}
                    }
                }
            },
            "cymru":{
                "one" : {
                    "two" :{
                        "three":{}
                    }
                }
            }
        };

        var expected = {
            "espaniol":{
                "uno" : {
                    "dos" :{
                        "tres":{}
                    }
                }
            },
            "cymru":{
                "un" : {
                    "dau" :{
                        "tri":{}
                    }
                }
            }
        };

        var renderKind = function(kind, path) {
            if (path[0] == "espaniol") {
                switch(kind) {
                    case "one": return "uno";
                    case "two": return "dos";
                    case "three": return "tres";
                }
            } else if (path[0] == "cymru") {
                switch(kind) {
                    case "one": return "un";
                    case "two": return "dau";
                    case "three": return "tri";
                }
            } else {
                return kind;
            }
        }

        var result = tree.render(null, renderKind, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("should not render properties on source that are not output by the node transform", function(){
        var input = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"y"
                }
            },
            "three" : {
                "x":"z"
            }
        };

        var expected = {
            "one" : {
                "two":{}
            },
            "three" : {
                "x":"z"
            }
        };

        var renderNode = function(n) {
            if (n.x == "y") {
                delete n.x;
            }
            return n;
        }

        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("should not render relationships from the source that are not output by the relation transform", function(){
        var input = {
            "one" : {
                "two" :{},
                "three" : {}
            },
            "four" : {}
        };

        var expected = {
            "one" : {
                "two":{}
            }
        };

        var renderKind = function(kind, path) {
            if (kind == "three") return null;
            if (kind == "four") return undefined;
            return kind;
        }

        var result = tree.render(null, renderKind, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("will change the original input, causing a subsequent compose to both alter the rendered output and result in a damaged rendered output", function(){
        var input = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"y"
                }
            }
        };

        var expectedRendered = {
            "one" : {
                "two":[
                    "glop", {}
                ]
            },
        };

        var renderNode = function(n, path) {
            if (path.like(["one"])) {
                n.two = "glop";
            }
            if (n.x) delete n.x;
            return n;
        }

        var decomposed = tree.decompose(input);
        var renderResult = tree.render(renderNode, null, decomposed);
        // The render should work
        expect(renderResult).to.deep.equal(expectedRendered);

        // For performance reasons, there are shared references between the relational and the rendered output.
        // The relational is also mutated. A decompose will have some weird effects.
        var composedResult = tree.compose(decomposed);

        // And those effects will cause the shared references to go very wrong.
        // Both the rendered and composed structures will be wrong.
        expect(renderResult).to.not.deep.equal(expectedRendered);
        expect(composedResult).to.not.deep.equal(input);
    });
    it("can render the same relational structure multiple times through different transforms ONLY if the relational struture is deep-cloned before the transform", function(){
        var input = {
            "one" : {
                "two" :{}
            }
        };

        var expected_A = {
            "eno" : {
                "owt":{}
            }
        };

        var expected_B = {
            "x":"x",
            "one" : {
                "x":"x",
                "two" :{"x":"x"}
            }
        };

        var reverseKind = function(kind, path) { return kind.split('').reverse().join(''); };
        var addElementToNode = function(node) {node.x = "x"; return node;};

        var relational = tree.decompose(input);
        var result_A = tree.render(null, reverseKind, _.cloneDeep(relational));
        var result_B = tree.render(addElementToNode, null, _.cloneDeep(relational));

        expect(result_A).to.deep.equal(expected_A);
        expect(result_B).to.deep.equal(expected_B);
    });
    it("should handle conflicts between rendered properties and kind properies by concatenating into arrays", function(){
        var input = {
            "one" : {
                "x":"y",
                "two" :{
                    "x":"y"
                }
            }
        };

        var expected = {
            "one" : {
                "x":"y",
                "two":[
                    "glop",
                    {"x":"y"}
                ]
            },
        };

        var renderNode = function(n, path) {
            if (path.like(["one"])) {
                n.two = "glop";
            }
            return n;
        }

        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("should exclude nodes if the transform function returns null or undefined",function(){
        var input = {
            "one" : {
                "x":"x",
                "two" :{
                    "x":"y"
                }
            },
            "three" : {
                "x":"z"
            }
        };

        var expected = {
            "three" : {
                "x":"z"
            }
        };

        var renderNode = function(n) {
            if (n.x == "y") return null;
            if (n.x == "x") return undefined;
            return n;
        }

        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);

    });
    it("should render empty trees as an empty object", function(){
        var input = {};
        var expected = {};
        var renderNode = function(n){return n;};
        var result = tree.render(renderNode, null, tree.decompose(input));

        expect(result).to.deep.equal(expected);
    });
    it("handles damaged trees", function(){
        var relational = {
            "Root":"x",
            "Nodes":{},
            "Relations":[]
        };
        var expected = {};
        var renderNode = function(n){return n;};
        var result = tree.render(renderNode, null, relational);

        expect(result).to.deep.equal(expected);
    });
});
