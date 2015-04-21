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
    provides.decompose = function(obj, excludedKinds) {
        var idx = 0; // used to make unique IDs
        var newId = function(){return "id_" + (idx++);};

        return provides.decomposeWithIds(obj, newId, excludedKinds);    
    };

    /** decompose using a selector for ids.
     * @param idSelector -- function(node){return id;}
     * @param excludedKinds -- array of 'kind' names that should *NOT* be decomposed
     */
    provides.decomposeWithIds = function(obj, idSelector, excludedKinds) {
        var nodesToDecompose = [];
        var nodes = {};
        var relations = [];
        var exclude = excludedKinds || [];
        //var idx = 0; // used to make unique IDs
        //var newId = function(){return "id_" + (idx++);};

        var rootId = idSelector(obj);
        nodesToDecompose.push([rootId, obj]);

        var add = function(id, value, kind, isArr) {
            var aId = idSelector(value);                        
            relations.push({"Parent":id, "Child":aId, "Kind":kind, "IsArray":isArr});
            nodesToDecompose.push([aId, value]);
        };

        queueWorkerSync(nodesToDecompose, function(pair) {
            var id = pair[0], node = pair[1];
            nodes[id] = {};
            _.forOwn(node, function(value, key) {
                var isArr = _.isArray(value);
                var isObj = _.isObject(value);
                var isExcluded = exclude.indexOf(key) >= 0;
                if (isArr && value.length > 0 && _.isObject(value[0])) {
                    // is an array of objects, treat as multiple child nodes
                    for (var i = 0; i < value.length; i++) { add(id, value[i], key, true); }
                } else if (isObj && (!isArr) && (!isExcluded)) {
                    // new node to be decomposed. Add to queue, don't add to parent.
                    add(id, value, key, false);
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
    provides.compose = function(relational) {
        return renderFromRoot(null, null, relational.Root, relational);
    };

    /** 
     * render -- compose a relational structure into a plain object, changing node contents using a supplied function.
     * If any of the render functions are null or undefined, rendered output will match `compose`
     * @renderNodeFunc -- function that takes a node and returns the rendered node
     * @renderKindFunc -- function that takes (kind, path) and returns kind
     **/
    provides.render = function(renderNodeFunc, renderKindFunc, relational) {
        return renderFromRoot(renderNodeFunc, renderKindFunc, relational.Root, relational);
    };


    /** flipRelationship -- make children into parents and parents into children 
     * new parents are merged based on equality of the value returned by `newParentHashFunc`
     * if no hash function is provided, all are considered equal
     **/
    provides.flipRelationship = function(newChildKind, newParentKind, newParentHashFunc, relational) {
        var hashFunc = newParentHashFunc || function(){return 1;}; // if no hash, all are considered equal
        var grandparents = {};
        var IDs = {};
        
        var groupNewParentsByHashEquality = function(oldChildren) {
            return oldChildren.map(function(rel){
                var hash = hashFunc(relational.Nodes[rel.Child]);
                IDs[hash] = IDs[hash] || rel.Child;
                return IDs[hash];
            });
        };

        var toRemove = [];
        // build the id tree for the new relationships, and keep track of the old relationships to delete
        _.where(relational.Relations, {Kind:newChildKind}).forEach(function(rel) {
            var gParent = rel.Parent; var oldParent = rel.Child;
            if (!grandparents[gParent]) grandparents[gParent] = {};

            var oldChildren = _.where(relational.Relations, {Kind:newParentKind, Parent:oldParent});
            var map = groupNewParentsByHashEquality(oldChildren);

            if (map.length !== 1) return; // doesn't match the pattern -- must have exactly one new parent to flip out

            oldChildren.forEach(function(rel) {toRemove.push(rel.Parent); toRemove.push(rel.Child);});

            var newParent = map[0];
            var newChild = oldParent;

            if (grandparents[gParent][newParent]) grandparents[gParent][newParent].push(newChild);
            else grandparents[gParent][newParent] = [newChild];
        });

        // delete the old structure
        removeRelationByIds(relational, toRemove);

        // build the new structure
        Object.keys(grandparents).forEach(function(gPid){
            var gpar = grandparents[gPid];
            Object.keys(gpar).forEach(function(newPid){
                var npar = gpar[newPid];
                relational.Relations.push({Parent:gPid, Child:newPid, Kind:newParentKind});
                for(var i = 0; i < npar.length; i++) {
                    relational.Relations.push({Parent:newPid, Child:npar[i], Kind:newChildKind});
                }
            });
        });

        return relational;
    };

    /** removeEmptyNodes -- remove node relations if node contains only null properties */
    provides.removeEmptyNodes = function(relational) {
        // Not yet implemented
        // Plan: 
        //  - Assume all to be removed.
        //  - Add any non-empty nodes to keep list.
        //  - Scan relations, add to keep list if child is on keep list
        //  - repeat until no changes
        //  - delete relations not on the keep list

        var isEmpty = function (x) {
            var n = Object.keys(x);
            for (var i=0; i < n.length; i++) {
                var k = n[i];
                if (x[k] !== null && x[k] !== undefined) return false;
            }
            return true;
        }

        var noChildren = function(k, rel) {
            return ! (_.some(rel.Relations, {Parent:k}));
        }

        var cycleAgain = true;
        while (cycleAgain) {
            cycleAgain = false;

            var allNodeKeys  = Object.keys(relational.Nodes);
            var emptyNodes = [];
            for (var i=0; i < allNodeKeys.length; i++) {
                var key = allNodeKeys[i];
                if (isEmpty(relational.Nodes[key]) && noChildren(key, relational)) { emptyNodes.push(key); }
            }

            _.remove(relational.Relations, function(rel) {
                var dead = emptyNodes.indexOf(rel.Child) !== -1;
                if (dead) cycleAgain = true;
                return dead;
            });
        }

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
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
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
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopAfter = function(filterFunc, relational) {
        var toRemove = [];
        _.forEach(relational.Nodes, function(node, id) {
            if (filterFunc(node)) toRemove.push(id);
        });
        removeChildrenByParentsIds(relational, toRemove);
        return relational;
    };

    /** chopByKind -- remove nodes, of a specified kind, and their children if they match a filter
     * @param kind -- the type of node to consider
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopByKind = function(kind, filterFunc, relational) {
        var toRemove = [];
        var targetIds = pickIdsByKind(kind, relational);
        _.forEach(targetIds, function(targetId) {
            if (filterFunc(relational.Nodes[targetId])) { toRemove.push(targetId); }
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** chopChildless -- remove nodes, where the nodes have no children (leaves), if they match a data predicate
     * @param filterFunc -- if this returns a truthy value, node will be removed, else node will be kept
     * @param relational -- the source relational model to "chop" (as created by decompose)
     * @return a reference to the updated relational model
     */
    provides.chopChildless = function(filterFunc, relational) {
        var toRemove = [];
        var targetIds = pickIdsWithNoChildren(relational);
        _.forEach(targetIds, function(targetId) {
            if (filterFunc(relational.Nodes[targetId])) { toRemove.push(targetId); }
        });
        removeNodesByIds(relational, toRemove);
        return relational;
    };

    /** merge up by kind -- remove child nodes by relationship putting data into parent */
    provides.mergeUpByKind = function(kind, relational) {
        var parentGetsAll = function (n){return n;};
        var childGetsNone = function (n){return null;};

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** merge up by predicate on nodes -- remove nodes that match a predicate */
    provides.mergeUpByNode = function(predFunc, relational) {
        var parentGetsAll = function (n){return n;};
        var childGetsNone = function (n){return null;};

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsAll, childGetsNone, relational);
    };

    /** mergeDownByKind -- remove parent nodes by relationship, putting data into children */
    provides.mergeDownByKind = function(kind, relational) {
        var parentGetsNone = function (n){return null;};
        var childGetsAll = function (n){return n;};

        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    };

    /** mergeDownByNode -- remove nodes by predicate function, merging data into children */
    provides.mergeDownByNode = function (predFunc, relational) {
        var parentGetsNone = function (n){return null;};
        var childGetsAll = function (n){return n;};

        var ids = pickIdsByNodePredicate(predFunc, relational);
        return fuseByNodeIds(ids, parentGetsNone, childGetsAll, relational);
    };

    /** fuseByNode -- remove a node by merging into it's parent and child (by supplied functions) */
    provides.fuseByNode = function(nodePredFunc, pickForParentFunc, pickForChildFunc, relational){
        var ids = pickIdsByNodePredicate(nodePredFunc, relational);
        return fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational);
    };

    /** fuseByKind -- remove a child node by it's kind, merging data into parent and grandchildren by supplied functions run on removed node */
    provides.fuseByKind = function(kind, pickForParentFunc, pickForChildFunc, relational) {
        var ids = pickIdsByKind(kind, relational);
        return fuseByNodeIds(ids, pickForParentFunc, pickForChildFunc, relational);
    };

    /** harvest -- return subtrees by kinds, keyed by parent value picked by a selector */
    provides.harvest = function(kind, idSelector, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        var childToParent;
        if (idSelector) {
            childToParent = _.indexBy(relational.Relations, "Child");
        }

        var outp = {};
        _.forEach(targetIds, function(nodeId) { // for each targeted node

            var key = nodeId;
            if (idSelector) {
                // get parent node and pass to selector
                var parentId = childToParent[nodeId].Parent;
                key = idSelector(relational.Nodes[parentId]);
            }

            outp[key] = join(outp[key], renderFromRoot(null, null, nodeId, relational)); // render the sub-tree
        });

        return outp;
    };

    /** gather -- return arrays of subtrees by kinds */
    provides.gatherByKind = function(kind, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        return targetIds.map(function(id){return renderFromRoot(null, null, id, relational);});
    };

    /** gather -- return arrays of subtrees by a selector predicate function */
    provides.gatherByNode = function(predicate, relational) {
        var targetIds = pickIdsByNodePredicateIncludeRoot(predicate, relational);
        return targetIds.map(function(id){return renderFromRoot(null, null, id, relational);});
    };

    /** pick values of a given property from the given kind */
    provides.reduce = function(kind, prop, relational) {
        var rels  =_.where(relational.Relations, {Kind:kind});
        // for each in ids, get parent, populate with child values and chop.

        _.forEach(rels, function(r){
            relational.Nodes[r.Parent][kind] = join(relational.Nodes[r.Parent][kind], relational.Nodes[r.Child][prop]);
        });

        provides.prune(kind, relational);
        return relational;
    };

    /** change nodes of a given kind to the return value of the `filterFunc` */
    provides.editByKind = function(kind, filterFunc, relational) {
        var targetIds = pickIdsByKind(kind, relational);
        var i = targetIds.length;
        for(;i--;){
            relational.Nodes[targetIds[i]] = filterFunc(relational.Nodes[targetIds[i]]);
        }
        return relational;
    };

    // Return Child ids for a relation kind
    function pickIdsByKind(kind, relational) {
        return _.pluck(_.where(relational.Relations, {Kind:kind}), 'Child');
    }

    function pickIdsByNodePredicate(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (idx == relational.Root) return;
            if (predFunc(node)) ids.push(idx);
        });
        return ids;
    }
    function pickIdsByNodePredicateIncludeRoot(predFunc, relational) {
        var ids = [];
        _.forEach(relational.Nodes, function(node, idx) {
            if (predFunc(node)) ids.push(idx);
        });
        return ids;
    }

    function pickIdsWithNoChildren(relational) {
        var children = _.pluck(relational.Relations, 'Child');
        var parents = _.pluck(relational.Relations, 'Parent');
        return _.difference(children, parents);
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
    }

    function removeNodesByIds(relational, Ids) {
        _.forEach(Ids, function(id){
            delete relational.Nodes[id];
            _.remove(relational.Relations, function(v) {
                return v.Child == id;
            });
        });
    }

    function removeRelationByIds(relational, Ids) {
        _.forEach(Ids, function(id){
            _.remove(relational.Relations, function(v) {
                return v.Child == id;
            });
        });
    }

    function renderFromRoot(renderNodeFunc, renderKindFunc, rootId, relational) {
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

                    if (subtree) output[renderedKind] = (childNode.IsArray) ? asArray(subtree) : subtree;
                }
            }
            return output;
        };

        return build(rootId, []) || {};
    }

    function asArray(element) {return [].concat.apply([], [element]); }

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
        while(queue.length > 0) {
            var work = queue.shift();
            doWork(work);
        }
    }

/* istanbul ignore next */ // `this` branch doesn't get followed
})(global || exports || this);
