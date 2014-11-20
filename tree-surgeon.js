"use strict"
var global, exports;
var _ = require('lodash');

(function (provides) {
    
    /** decompose -- Takes a plain object and decomposed sub-objects into separate nodes
     *
     * Output structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.decompose = function(obj) {
        var idx = 0; // used to make unique IDs
        var newId = function(){return "id_" + (idx++);};

        return provides.decomposeWithIds(obj, newId);    
    };

    /** decompose using a selector for ids.
     * @param idSelector -- function(node){return id;}
     */
    provides.decomposeWithIds = function(obj, idSelector) {
        var nodesToDecompose = [];
        var nodes = {};
        var relations = [];
        //var idx = 0; // used to make unique IDs
        //var newId = function(){return "id_" + (idx++);};

        var rootId = idSelector(obj);
        nodesToDecompose.push([rootId, obj]);

        var add = function(id, value, kind) {
            var aId = idSelector(value);                        
            relations.push({"Parent":id, "Child":aId, "Kind":kind});
            nodesToDecompose.push([aId, value]);
        }

        queueWorkerSync(nodesToDecompose, function(pair) {
            var id = pair[0], node = pair[1];
            nodes[id] = {};
            _.forOwn(node, function(value, key) {
                if (_.isArray(value) && value.length > 0 && _.isPlainObject(value[0])) {
                    // is an array of objects, treat as multiple child nodes
                    for (var i = 0; i < value.length; i++) { add(id, value[i], key); }
                } else if (_.isPlainObject(value)) {
                    // new node to be decomposed. Add to queue, don't add to parent.
                    add(id, value, key);
                } else {
                    // just some value. Add to general output
                    nodes[id][key] = value;
                }
            });
        });

        return {"Root":rootId, "Nodes":nodes, "Relations":relations};
    };

    /** compose -- Takes a decomposed structure and returns a plain object
     *
     * Input structure looks like
     *      {"Root": id,
     *       "Nodes" : { "Key" :{ ... }, ... },
     *       "Relations": [ {"Parent":.., "Child":.., "Kind":...}, ... ]
     *      }
     * */
    provides.compose = function(obj) {
        return provides.render(null, null, obj);
    };

    /** 
     * render -- compose a relational structure into a plain object, changing node contents using a supplied function.
     * If any of the render functions are null or undefined, rendered output will match `compose`
     * @renderNodeFunc -- function that takes a node and returns the rendered node
     * @renderKindFunc -- function that takes (kind, path) and returns kind
     **/
    provides.render = function(renderNodeFunc, renderKindFunc, relational) {
        renderNodeFunc = renderNodeFunc || function(node){return node;};
        renderKindFunc = renderKindFunc || function(kind, path){return kind;};

        var parentToChild = _.groupBy(relational.Relations, "Parent");

        var build = function buildRecursive(currentNode, path) {
            if (! relational.Nodes[currentNode]) return undefined;

            var output = renderNodeFunc(_.clone(relational.Nodes[currentNode]), path);
            var childNodes = parentToChild[currentNode];
            if (output && childNodes) {
                for (var i = 0; i < childNodes.length; i++) {
                    var childNode = childNodes[i];
                    var renderedKind = renderKindFunc(childNode.Kind, path);
                    var subpath = path.concat(childNode.Kind); // path is always input path, not rendered
                    
                    var subtree = join(output[renderedKind],
                            (renderedKind) ? buildRecursive(childNode.Child, subpath) : undefined); // if the kind is removed by renderer, don't build the subtree
                    if (subtree) output[renderedKind] = subtree;
                }
            }
            return output;
        };

        return build(relational.Root, []) || {};
    }

    /** flipRelationship -- make children into parents and parents into children */
    provides.flipRelationship = function(newChildKind, newParentKind, newParentHashFunc, relational) {
        var hashFunc = newParentHashFunc || function(){return 1;}; // if no hash, all are considered equal
        var grandparents = {};
        var IDs = {};
        
        // given a new child, find immediate new parents and return 1st NewParent ID
        var pred = function(pid) {
            return _.where(relational.Relations, {Kind:newParentKind, Parent:pid}).map(function(rel){
                var hash = hashFunc(relational.Nodes[rel.Child]);
                IDs[hash] = IDs[hash] || rel.Child;
                return IDs[hash];
            });
        }

        _.where(relational.Relations, {Kind:newChildKind}).forEach(function(rel) {
            if (grandparents[rel.Parent]) grandparents[rel.Parent].push({id:rel.Child, map:pred(rel.Child)});
            else grandparents[rel.Parent] = [{id:rel.Child, map:pred(rel.Child)}];
        });

        console.log(JSON.stringify(grandparents, undefined, 2));

        return relational;
    };

    /** prune -- remove relationships by kind */
    provides.prune = function(kind, relational) {
        _.remove(relational.Relations, function(rel) {
            return rel.Kind == kind;
        });
        return relational;
    };

    /** pruneAfter -- remove children by matching parent relationship kind */
    provides.pruneAfter = function(kind, relational) {
        // remove children of child IDs
        var parents = _.pluck(_.where(relational.Relations, {Kind:kind}), "Child");
        removeChildrenByParentsIds(relational, parents);
        return relational;
    };

    /** pruneAllBut -- remove nodes where kind is not in the given list */
    provides.pruneAllBut = function(kinds, relational) {
        _.remove(relational.Relations, function(rel) {
            return ! _.some(kinds, function(k) {return k == rel.Kind;});
        });
        return relational;
    };

    /** chop -- remove nodes and their children if they match a filter
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     */
    provides.chop = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node)) toRemove.push(id);
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** chopAfter -- remove child nodes where a parent matches a predicate
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     */
    provides.chopAfter = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node)) toRemove.push(id);
        });
        removeChildrenByParentsIds(relational, toRemove);
        return relational;
    };

    /** merge up by kind -- remove child nodes by relationship putting data into parent */
    provides.mergeUpByKind = function(kind, relational) {
        var parentGetsAll = function (n){return n;}
        var childGetsNone = function (n){return null;}

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** merge up by predicate on nodes -- remove nodes that match a predicate */
    provides.mergeUpByNode = function(predFunc, relational) {
        var parentGetsAll = function (n){return n;}
        var childGetsNone = function (n){return null;}

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** mergeDownByKind -- remove parent nodes by relationship, putting data into children */
    provides.mergeDownByKind = function(kind, relational) {
        var parentGetsNone = function (n){return null;}
        var childGetsAll = function (n){return n;}

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    };

    /** mergeDownByNode -- remove nodes by predicate function, merging data into children */
    provides.mergeDownByNode = function (predFunc, relational) {
        var parentGetsNone = function (n){return null;}
        var childGetsAll = function (n){return n;}

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    }

    /** fuseByNode -- remove a node by merging into it's parent and child (by supplied functions) */
    provides.fuseByNode = function(nodePredFunc, pickForParentFunc, pickForChildFunc, relational){
        var ids = pickIdsByNodePredicate(nodePredFunc, relational);
        return fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational);
    }

    // Return Child ids for a relation kind
    function pickIdsByKind(kind, relational) {
        return _.pluck(_.where(relational.Relations, {Kind:kind}), 'Child');
    }

    // return Parent ids for a relation kind
    function parentsByKind(kind, relational) {
        return _.pluck(_.where(relational.Relations, {Kind:kind}), 'Parent');
    }

    function pickIdsByNodePredicate(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (idx == relational.Root) return;
            if (predFunc(node)) ids.push(idx);
        });
        return ids;
    }

    function fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational){
        // TODO: this is now the general case for a lot of things -- tune it!
        var flip_join = flip(join);
        _.forEach(ids, function(nodeId) { // for each node to merge
            var parentId = null, childRels = [];
            _.forEach(relational.Relations, function(rel, idx) { // find rels where id is parent or child
                if ( ! rel) return;
                if (rel.Child == nodeId) {
                    parentId = rel.Parent;
                    delete relational.Relations[idx];
                } else if (rel.Parent == nodeId) {
                    var forChild = pickForChildFunc(relational.Nodes[nodeId]);
                    if (forChild) _.merge(relational.Nodes[rel.Child], forChild, flip_join); // merge node down
                    childRels.push(idx);
                }
            });
            var forParent = pickForParentFunc(relational.Nodes[nodeId]);
            if (forParent) _.merge(relational.Nodes[parentId], forParent, join); // merge node up
            _.forEach(childRels, function(idx) { // connect children to parent
                relational.Relations[idx].Parent = parentId;
            });
        });

        // filter undefined nodes
        _.remove(relational.Relations, function(r){return _.isUndefined(r);});

        return relational;
    }

    function flip(f2) { // flip the args on a 2-ary function
        return function(a,b){return f2(b,a);};
    }
    
    function join (old, additional) {
        if (_.isUndefined(additional)) return old;
        if (old) {
            return (_.isArray(old)) ? (old.concat(additional)) : ([old].concat(additional));
        } else {
            return additional;
        }
    };

    function removeNodesByIds(relational, Ids) {
        _.forEach(Ids, function(id){
            delete relational.Nodes[id];
            _.remove(relational.Relations, function(v) {
                return v.Child == id;
            });
        });
    }

    function removeChildrenByParentsIds(relational, parentIds) {
        _.forEach(parentIds, function(p){
            _.remove(relational.Relations, function(v) {
                if (v.Parent == p) {
                    delete relational.Nodes[v.Child];
                    return true;
                }
            });
        });
    }

    function queueWorkerSync (queue, doWork) {
        var output = [];

        while(queue.length > 0) {
            var work = queue.shift();
            doWork(work);
        };
    };

/* istanbul ignore next */ // `this` branch doesn't get followed
})(global || exports || this);
