var should = require('should'),
    sinon = require('sinon'),
    _ = require('lodash'),

    sandbox = sinon.sandbox.create(),

    lodashStmt = require('../lib/lodash-stmt');

describe('Lodash Stmt Functions', function () {
    afterEach(function () {
        sandbox.restore();
    });

    describe('mixins', function () {
        beforeEach(function () {
            _.mixin(lodashStmt);
        });

        afterEach(function () {
            _.noConflict();
        });

        it('should provide matchStatement', function () {
            should.exist(_.matchStatement);
        });

        it('should provide eachStatement', function () {
            should.exist(_.eachStatement);
        });

        it('should provide findStatement', function () {
            should.exist(_.findStatement);
        });

        it('should provide mergeStatements', function () {
            should.exist(_.mergeStatements);
        });

        it('should provide rejectStatements', function () {
            should.exist(_.rejectStatements);
        });

        it('should provide printStatements', function () {
            should.exist(_.printStatements);
        });
    });

    describe('matchStatement', function () {
        var matchStatement = lodashStmt.matchStatement;

        it('should match on single item', function () {
            matchStatement({prop: 'page', op: '=', value: false}, {prop: 'page'}).should.eql(true);
            matchStatement({prop: 'page', op: '=', value: false}, {prop: 'status'}).should.eql(false);
            matchStatement({prop: 'page', op: '=', value: false}, {op: '='}).should.eql(true);
            matchStatement({prop: 'page', op: '=', value: false}, {op: 'IN'}).should.eql(false);
            matchStatement({prop: 'page', op: '=', value: false}, {value: false}).should.eql(true);
            matchStatement({prop: 'page', op: '=', value: false}, {value: true}).should.eql(false);
            matchStatement({prop: 'page', op: '=', value: false}, {test: false}).should.eql(false);
        });

        it('should match on multiple items', function () {
            matchStatement({prop: 'page', op: '=', value: false}, {prop: 'page', op: '='}).should.eql(true);
            matchStatement({prop: 'page', op: '=', value: false}, {prop: 'page', op: 'IN'}).should.eql(false);
            matchStatement({prop: 'page', op: '=', value: false}, {op: '=', value: false}).should.eql(true);
            matchStatement({prop: 'page', op: '=', value: false}, {value: false, test: false}).should.eql(false);
        });
    });

    describe('eachStatement', function () {
        var eachStatement = lodashStmt.eachStatement;
        it('should do nothing for empty statements', function () {
            var single = sandbox.spy(),
                group = sandbox.spy();

            eachStatement([], single, group);

            single.called.should.eql(false);
            group.called.should.eql(false);
        });

        it('should iterate through flat statements', function () {
            var single = sandbox.spy(),
                group = sandbox.spy();

            eachStatement([
                {op: '!=', value: 'joe', prop: 'author'},
                {op: '=', value: 'photo', prop: 'tag', func: 'and'},
                {op: '=', value: 'video', prop: 'tag', func: 'or'}
            ], single, group);

            single.callCount.should.eql(3);
            group.called.should.eql(false);
        });

        it('should iterate through group statements without a group function', function () {
            var single = sandbox.spy();

            eachStatement([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ], single);

            single.callCount.should.eql(3);
            single.getCall(0).calledWith({op: '!=', value: 'joe', prop: 'author'}).should.eql(true);
            single.getCall(1).calledWith({op: '=', value: 'photo', prop: 'tag'}).should.eql(true);
            single.getCall(2).calledWith({op: '=', value: 'video', prop: 'tag', func: 'or'}).should.eql(true);
        });

        it('should iterate through nested group statements without a group function', function () {
            var single = sandbox.spy();

            eachStatement([
                {op: '=', value: false, prop: 'page'},
                {op: '=', value: 'published', prop: 'status', func: 'and'},
                {
                    group: [
                        {op: '!=', value: 'joe', prop: 'author'},
                        {
                            group: [
                                {op: '=', value: 'photo', prop: 'tag'},
                                {op: '=', value: 'video', prop: 'tag', func: 'or'}
                            ], func: 'and'
                        }
                    ], func: 'and'
                }
            ], single);

            single.callCount.should.eql(5);
            single.getCall(0).calledWith({op: '=', value: false, prop: 'page'}).should.eql(true);
            single.getCall(1).calledWith({op: '=', value: 'published', prop: 'status', func: 'and'}).should.eql(true);
            single.getCall(2).calledWith({op: '!=', value: 'joe', prop: 'author'}).should.eql(true);
            single.getCall(3).calledWith({op: '=', value: 'photo', prop: 'tag'}).should.eql(true);
            single.getCall(4).calledWith({op: '=', value: 'video', prop: 'tag', func: 'or'}).should.eql(true);
        });

        it('should iterate through group statements with a group function', function () {
            var single = sandbox.spy(),
                group = sandbox.spy(function (statement) {
                    testFunc(statement.group);  // eslint-disable-line no-use-before-define
                }),
                testFunc = function (stuff) {
                    eachStatement(stuff, single, group);
                };

            testFunc([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ]);

            single.callCount.should.eql(3);
            single.getCall(0).calledWith({op: '!=', value: 'joe', prop: 'author'}).should.eql(true);
            single.getCall(1).calledWith({op: '=', value: 'photo', prop: 'tag'}).should.eql(true);
            single.getCall(2).calledWith({op: '=', value: 'video', prop: 'tag', func: 'or'}).should.eql(true);
            group.callCount.should.eql(1);
            group.getCall(0).calledWith({
                group: [
                    {op: '=', value: 'photo', prop: 'tag'},
                    {op: '=', value: 'video', prop: 'tag', func: 'or'}
                ], func: 'and'
            }).should.eql(true);
        });

        it('should iterate through nested group statements with a group function', function () {
            var single = sandbox.spy(),
                group = sandbox.spy(function (statement) {
                    testFunc(statement.group); // eslint-disable-line no-use-before-define
                }),
                testFunc = function (stuff) {
                    eachStatement(stuff, single, group);
                };

            testFunc([
                {op: '=', value: false, prop: 'page'},
                {op: '=', value: 'published', prop: 'status', func: 'and'},
                {
                    group: [
                        {op: '!=', value: 'joe', prop: 'author'},
                        {
                            group: [
                                {op: '=', value: 'photo', prop: 'tag'},
                                {op: '=', value: 'video', prop: 'tag', func: 'or'}
                            ], func: 'and'
                        }
                    ], func: 'and'
                }
            ]);

            single.callCount.should.eql(5);
            single.getCall(0).calledWith({op: '=', value: false, prop: 'page'}).should.eql(true);
            single.getCall(1).calledWith({op: '=', value: 'published', prop: 'status', func: 'and'}).should.eql(true);
            single.getCall(2).calledWith({op: '!=', value: 'joe', prop: 'author'}).should.eql(true);
            single.getCall(3).calledWith({op: '=', value: 'photo', prop: 'tag'}).should.eql(true);
            single.getCall(4).calledWith({op: '=', value: 'video', prop: 'tag', func: 'or'}).should.eql(true);

            group.callCount.should.eql(2);
            group.getCall(0).calledWith({
                group: [
                    {op: '!=', value: 'joe', prop: 'author'},
                    {
                        group: [
                            {op: '=', value: 'photo', prop: 'tag'},
                            {op: '=', value: 'video', prop: 'tag', func: 'or'}
                        ], func: 'and'
                    }
                ], func: 'and'
            }).should.eql(true);

            group.getCall(1).calledWith({
                group: [
                    {op: '=', value: 'photo', prop: 'tag'},
                    {op: '=', value: 'video', prop: 'tag', func: 'or'}
                ], func: 'and'
            }).should.eql(true);
        });
    });

    describe('findStatement', function () {
        var findStatement = lodashStmt.findStatement;

        it('should match an object with a single property', function () {
            var statements = [
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            findStatement(statements, {prop: 'page'}).should.eql(true);
            findStatement(statements, {prop: 'status'}).should.eql(true);
            findStatement(statements, {prop: 'tags'}).should.eql(false);
        });

        it('should match an object with multiple properties', function () {
            var statements = [
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            findStatement(statements, {prop: 'page', op: '='}).should.eql(true);
            findStatement(statements, {prop: 'page', op: '!='}).should.eql(false);
        });

        it('should match an object with multiple properties including a regex', function () {
            var statements = [
                {prop: 'tags.slug', op: 'IN', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            findStatement(statements, {prop: /^tags/, op: 'IN'}).should.eql(true);
            findStatement(statements, {prop: 'tags', op: 'IN'}).should.eql(false);
        });

        describe('Specific Keys', function () {
            it('should match with a single string passed as keys', function () {
                var statements = [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ];

                findStatement(statements, {prop: 'page', op: '=', value: false}, 'prop').should.eql(true);
                findStatement(statements, {prop: 'status', op: '=', value: false}, 'prop').should.eql(true);
                findStatement(statements, {prop: 'tags', op: '=', value: false}, 'prop').should.eql(false);
            });

            it('should match with an array of strings passed as keys', function () {
                var statements = [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ];

                findStatement(statements, {prop: 'page', op: '=', value: false}, ['prop', 'op']).should.eql(true);
                findStatement(statements, {prop: 'page', op: '!=', value: false}, ['prop', 'op']).should.eql(false);
            });
        });

        describe('groups', function () {
            it('should match inside a group', function () {
                var statements = [
                    {op: '!=', value: 'joe', prop: 'author'},
                    {
                        group: [
                            {op: '=', value: 'photo', prop: 'tag'},
                            {op: '=', value: 'video', prop: 'tag', func: 'or'}
                        ], func: 'and'
                    }
                ];

                findStatement(statements, {value: 'photo'}).should.eql(true);
                findStatement(statements, {op: '=', value: 'photo', prop: 'tag'}, 'value').should.eql(true);
                findStatement(statements, {op: '=', value: 'photo', prop: 'tag'}, ['value', 'prop']).should.eql(true);
                findStatement(statements, {prop: /^tag/}).should.eql(true);
                findStatement(statements, {prop: 'page'}).should.eql(false);
            });
        });
    });

    describe('rejectStatements', function () {
        var rejectStatements = lodashStmt.rejectStatements,
            testFunction = function (match, fields) {
                return function (statement) {
                    return lodashStmt.matchStatement(statement, fields ? _.pick(match, fields) : match);
                };
            };

        it('should reject from a simple flat array', function () {
            var statements = [
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            rejectStatements(statements, testFunction({prop: 'page'}))
                .should.eql([{prop: 'status', op: '=', value: 'published'}]);
        });

        it('should reject with regex', function () {
            var statements = [
                {prop: 'tags.slug', op: 'IN', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            rejectStatements(statements, testFunction({prop: /^tags/, op: 'IN'}))
                .should.eql([{prop: 'status', op: '=', value: 'published'}]);
        });

        it('should filter out a statement from a group', function () {
            var statements = [
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ];

            rejectStatements(statements, testFunction({value: 'video'})).should.eql([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'}
                    ], func: 'and'
                }
            ]);
        });

        it('should remove group if all statements are removed', function () {
            var statements = [
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ];

            rejectStatements(statements, testFunction({prop: 'tag'})).should.eql([
                {op: '!=', value: 'joe', prop: 'author'}
            ]);
        });

        it('should ensure first statement has no func', function () {
            var statements = [
                {op: '=', value: false, prop: 'page'},
                {op: '=', value: 'cameron', prop: 'author', func: 'or'}
            ];

            rejectStatements(statements, testFunction({prop: 'page'})).should.eql([
                {op: '=', value: 'cameron', prop: 'author'}
            ]);
        });

        it('should ensure first statement in group has no func', function () {
            var statements = [
                {op: '=', value: 'photo', prop: 'tag'},
                {op: '=', value: 'video', prop: 'tag', func: 'or'},
                {
                    group: [
                        {op: '=', value: false, prop: 'page'},
                        {op: '=', value: 'cameron', prop: 'author', func: 'or'}
                    ], func: 'and'
                }
            ];

            rejectStatements(statements, testFunction({prop: 'page'})).should.eql([
                {op: '=', value: 'photo', prop: 'tag'},
                {op: '=', value: 'video', prop: 'tag', func: 'or'},
                {
                    group: [
                        {op: '=', value: 'cameron', prop: 'author'}
                    ], func: 'and'
                }
            ]);
        });

        it('should ensure first group has no func when removing a group from the front', function () {
            var statements = [
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ]
                },
                {
                    group: [
                        {op: '=', value: false, prop: 'page'},
                        {op: '=', value: 'cameron', prop: 'author', func: 'or'}
                    ], func: 'and'
                }
            ];

            rejectStatements(statements, testFunction({prop: 'tag'})).should.eql([
                {
                    group: [
                        {op: '=', value: false, prop: 'page'},
                        {op: '=', value: 'cameron', prop: 'author', func: 'or'}
                    ]
                }
            ]);
        });

        it('should ensure first statement has no func when removing a group from the front', function () {
            var statements = [
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ]
                },
                {op: '=', value: false, prop: 'page', func: 'and'},
                {op: '=', value: 'cameron', prop: 'author', func: 'or'}
            ];

            rejectStatements(statements, testFunction({prop: 'tag'})).should.eql([
                {op: '=', value: false, prop: 'page'},
                {op: '=', value: 'cameron', prop: 'author', func: 'or'}
            ]);
        });
    });

    describe('replaceStatements', function () {
        var replaceStatements = lodashStmt.replaceStatements,
            testFunction = function testFunction() {
                return {prop: 'magic', op: '=', value: true};
            },
            testFunctionGroup = function testFunctionGroup(stmt) {
                stmt.prop = 'magic';
                return {
                    group: [
                        stmt,
                        {prop: 'foo', op: '=', value: 'bar'}
                    ]
                };
            };

        it('should replace inside a simple flat array', function () {
            var statements = [
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            replaceStatements(statements, {prop: 'page'}, testFunction).should.eql([
                {prop: 'magic', op: '=', value: true},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ]);
        });

        it('should replace with group inside a simple flat array', function () {
            var statements = [
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            replaceStatements(statements, {prop: 'page'}, testFunctionGroup).should.eql([
                {
                    group: [
                        {prop: 'magic', op: '=', value: false},
                        {prop: 'foo', op: '=', value: 'bar'}
                    ]
                },
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ]);
        });

        it('should replace with regex', function () {
            var statements = [
                {prop: 'tags.slug', op: 'IN', value: false},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ];

            replaceStatements(statements, {prop: /^tags/, op: 'IN'}, testFunction).should.eql([
                {prop: 'magic', op: '=', value: true},
                {prop: 'status', op: '=', value: 'published', func: 'and'}
            ]);
        });

        it('should replace a statement from a group', function () {
            var statements = [
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ];

            replaceStatements(statements, {value: 'video'}, testFunction).should.eql([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: true, prop: 'magic'}
                    ], func: 'and'
                }
            ]);
        });

        it('should replace a statement from a group with a group', function () {
            var statements = [
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ];

            replaceStatements(statements, {value: 'video'}, testFunctionGroup).should.eql([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {
                            group: [
                                {prop: 'magic', op: '=', value: 'video', func: 'or'},
                                {prop: 'foo', op: '=', value: 'bar'}
                            ]
                        }
                    ], func: 'and'
                }
            ]);
        });
    });

    describe('mergeStatements', function () {
        var mergeStatements = lodashStmt.mergeStatements;

        describe('empty object', function () {
            it('should return a valid statement object when passed no args', function () {
                var result = mergeStatements();
                result.should.eql({statements: []});
            });

            it('should return a valid statement object when passed undefined args', function () {
                var result = mergeStatements(undefined, undefined);
                result.should.eql({statements: []});
            });

            it('should return a valid statement object when passed null args', function () {
                var result = mergeStatements(null, null);
                result.should.eql({statements: []});
            });
        });

        it('should merge two simple statements', function () {
            var result = mergeStatements(
                {prop: 'page', op: '=', value: false},
                {prop: 'status', op: '=', value: 'published'}
            );

            result.should.eql({
                statements: [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ]
            });
        });

        it('should correctly merge null and a valid statement', function () {
            var result = mergeStatements(
                null,
                {prop: 'status', op: '=', value: 'published'}
            );

            result.should.eql({
                statements: [
                    {prop: 'status', op: '=', value: 'published'}
                ]
            });
        });

        it('should correctly merge undefined and a valid statement', function () {
            var result = mergeStatements(
                undefined,
                {prop: 'status', op: '=', value: 'published'}
            );

            result.should.eql({
                statements: [
                    {prop: 'status', op: '=', value: 'published'}
                ]
            });
        });

        it('should merge two statement objects', function () {
            var obj1 = {
                    statements: [
                        {prop: 'page', op: '=', value: false},
                        {prop: 'status', op: '=', value: 'published', func: 'and'}
                    ]
                },
                obj2 = {
                    statements: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ]
                },
                result = mergeStatements(obj1, obj2);

            result.should.eql({
                statements: [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'},
                    {op: '=', value: 'photo', prop: 'tag', func: 'and'},
                    {op: '=', value: 'video', prop: 'tag', func: 'or'}
                ]
            });
        });

        it('should merge two statement objects when one is empty', function () {
            var obj1 = {
                    statements: [
                        {prop: 'page', op: '=', value: false},
                        {prop: 'status', op: '=', value: 'published', func: 'and'}
                    ]
                },
                obj2 = {statements: []},
                result = mergeStatements(obj1, obj2);

            result.should.eql({
                statements: [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ]
            });
        });

        it('should merge two statement objects when one is null', function () {
            var obj1 = {
                    statements: [
                        {prop: 'page', op: '=', value: false},
                        {prop: 'status', op: '=', value: 'published', func: 'and'}
                    ]
                },
                obj2 = null,
                result = mergeStatements(obj1, obj2);

            result.should.eql({
                statements: [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ]
            });
        });

        it('should merge two statement objects when one is undefined', function () {
            var obj1 = {
                    statements: [
                        {prop: 'page', op: '=', value: false},
                        {prop: 'status', op: '=', value: 'published', func: 'and'}
                    ]
                },
                obj2,
                result = mergeStatements(obj1, obj2);

            result.should.eql({
                statements: [
                    {prop: 'page', op: '=', value: false},
                    {prop: 'status', op: '=', value: 'published', func: 'and'}
                ]
            });
        });
    });

    describe('printStatements', function () {
        var printStatements = lodashStmt.printStatements,
            consoleSpy;

        it('should do nothing for empty statements', function () {
            consoleSpy = sandbox.spy(console, 'log');

            printStatements([]);

            consoleSpy.called.should.eql(false);
        });

        it('should iterate through flat statements', function () {
            consoleSpy = sandbox.spy(console, 'log');

            printStatements([
                {op: '!=', value: 'joe', prop: 'author'},
                {op: '=', value: 'photo', prop: 'tag', func: 'and'},
                {op: '=', value: 'video', prop: 'tag', func: 'or'}
            ]);

            consoleSpy.callCount.should.eql(3);
            consoleSpy.getCall(0).args.should.eql(['', {op: '!=', value: 'joe', prop: 'author'}]);
            consoleSpy.getCall(1).args.should.eql(['', {op: '=', value: 'photo', prop: 'tag', func: 'and'}]);
            consoleSpy.getCall(2).args.should.eql(['', {op: '=', value: 'video', prop: 'tag', func: 'or'}]);
        });

        it('should iterate through group statements without a group function', function () {
            consoleSpy = sandbox.spy(console, 'log');

            printStatements([
                {op: '!=', value: 'joe', prop: 'author'},
                {
                    group: [
                        {op: '=', value: 'photo', prop: 'tag'},
                        {op: '=', value: 'video', prop: 'tag', func: 'or'}
                    ], func: 'and'
                }
            ]);

            consoleSpy.callCount.should.eql(4);
            consoleSpy.getCall(0).args.should.eql(['', {op: '!=', value: 'joe', prop: 'author'}]);
            consoleSpy.getCall(1).args.should.eql(['', 'group', 'and']);
            consoleSpy.getCall(2).args.should.eql([' ', {op: '=', value: 'photo', prop: 'tag'}]);
            consoleSpy.getCall(3).args.should.eql([' ', {op: '=', value: 'video', prop: 'tag', func: 'or'}]);
        });

        it('should iterate through nested group statements without a group function', function () {
            consoleSpy = sandbox.spy(console, 'log');

            printStatements([
                {op: '=', value: false, prop: 'page'},
                {op: '=', value: 'published', prop: 'status', func: 'and'},
                {
                    group: [
                        {op: '!=', value: 'joe', prop: 'author'},
                        {
                            group: [
                                {op: '=', value: 'photo', prop: 'tag'},
                                {op: '=', value: 'video', prop: 'tag', func: 'or'}
                            ], func: 'and'
                        }
                    ], func: 'and'
                }
            ]);

            consoleSpy.callCount.should.eql(7);
            consoleSpy.getCall(0).args.should.eql(['', {op: '=', value: false, prop: 'page'}]);
            consoleSpy.getCall(1).args.should.eql(['', {op: '=', value: 'published', prop: 'status', func: 'and'}]);
            consoleSpy.getCall(2).args.should.eql(['', 'group', 'and']);
            consoleSpy.getCall(3).args.should.eql([' ', {op: '!=', value: 'joe', prop: 'author'}]);
            consoleSpy.getCall(4).args.should.eql([' ', 'group', 'and']);
            consoleSpy.getCall(5).args.should.eql(['  ', {op: '=', value: 'photo', prop: 'tag'}]);
            consoleSpy.getCall(6).args.should.eql(['  ', {op: '=', value: 'video', prop: 'tag', func: 'or'}]);
        });
    });
});
