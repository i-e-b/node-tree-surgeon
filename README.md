node-tree-surgeon
=================
[![Build Status](https://travis-ci.org/i-e-b/node-tree-surgeon.svg?branch=master)](https://travis-ci.org/i-e-b/node-tree-surgeon) [![Coverage Status](https://img.shields.io/coveralls/i-e-b/node-tree-surgeon.svg)](https://coveralls.io/r/i-e-b/node-tree-surgeon?branch=master)

Tools for editing tree structures using a relational model.
Not yet complete, but usable

### General purpose:

Trees are represented internally with two sets: (relational structure)

* Relations: `[{"Parent":id, "Child":id, "Kind":any, ...}, ...]`
* Nodes: `{"id":{... your data ... }, ...]`

The `id` values are assigned internally and don't conflict with or get written to your objects.

Functions given to split a POJO into this structure, and merge the structure into a POJO.

### Operations on POJO structure:

- [x] Decompose -- turn a normal js object tree into the relational structure
- [ ] DecomposeWithIds -- same as `decompose` but use a function to pick ids. In case you want to use the relational model externally. It's up to you to ensure the ids are unique

### Operations on the relational structure:

#### Output
- [x] Compose -- put a decomposed tree back together how it was. The composed object will contain auto-generated keys if any were created
- [ ] Render -- pass each node through a function and compose tree from the results (also, could 'render' relations to get key names and filter?)
- [ ] Harvest -- return an array of composed sub-trees (by kind, by node?)
- [ ] Gather -- return an array of sub-trees 
    - [ ] GatherByKind
    - [ ] GatherByNode

#### Manipulation

- [x] Prune -- remove subtrees by relationship kind
    - [x] PruneAfter -- remove subtrees by relationship kind, but keep the immediate children
    - [x] PruneAllBut -- remove subtrees that **don't** match a set of kinds
- [x] Chop -- remove subtrees by data predicate
    - [x] ChopAfter -- remove subtrees by data predicate, but keep the matched children
- MergeUp -- remove a relationship and one node by merging data from child to parent. Subtree remains
    - [x] MergeUpByKind -- select merge targets by relationship kind
    - [x] MergeUpByNode -- select merge targets by applying a predicate to nodes
- MergeDown -- remove a relationship and one node by merging data from parent to child. Subtree remains
    - [x] MergeDownByKind -- select merge targets by relationship kind
    - [x] MergeDownByNode -- select merge targets by applying a predicate to nodes
- [ ] Fuse -- remove a node by merging into it's parent and child (by supplied function)
    - [ ] FuseAway -- remove a node by connecting it's parents to it's children, losing the data in the selected nodes
    - [x] FuseByNode -- remove a node picked by a predicate on that node
    - [ ] FuseByKind -- remove a node picked by kind
- [ ] Graft -- insert new subtrees
- [ ] Disconnect -- the opposite of Fuse, place a new node between a parent and child
- [ ] Fork -- move some of the values of a node into a new or existing sibling
- [ ] Move -- move some of the values of a node into an existing sibling, or do nothing


Note:
* To run istanbul on Windows, use `istanbul cover C:\Users\[username]\AppData\Roaming\npm\node_modules\mocha\bin\_mocha -- -R spec`

Todo:
* extend with `kind` *and* `predicate` functions
* some way of mutating kind when fusing/merging?
