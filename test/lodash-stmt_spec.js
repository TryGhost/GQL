var should = require('should'),
    sinon  = require('sinon'),
    _      = require('lodash'),

    sandbox = sinon.sandbox.create();

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

        it('should provide eachStatement', function () {
            should.exist(_.eachStatement);
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
                {op: "!=", value: "joe", prop: "author"},
                {op: "=", value: "photo", prop: "tag", func: "and"},
                {op: "=", value: "video", prop: "tag", func: "or"}
            ], single, group);

            single.callCount.should.eql(3);
            group.called.should.eql(false);
        });

        it('should iterate through group statements without a group function', function () {
            var single = sandbox.spy();

            eachStatement([
                {op: "!=", value: "joe", prop: "author"},
                {group: [
                        {op: "=", value: "photo", prop: "tag"},
                        {op: "=", value: "video", prop: "tag", func: "or"}
                ], func: "and"}
            ], single);

            single.callCount.should.eql(3);
            single.getCall(0).calledWith({op: "!=", value: "joe", prop: "author"}).should.eql(true);
            single.getCall(1).calledWith({op: "=", value: "photo", prop: "tag"}).should.eql(true);
            single.getCall(2).calledWith({op: "=", value: "video", prop: "tag", func: "or"}).should.eql(true);
        });

        it('should iterate through nested group statements without a group function', function () {
            var single = sandbox.spy();

            eachStatement([
                {op: "=", value: false, prop: "page"},
                {op: "=", value: "published", prop: "status", func: "and"},
                {group: [
                    {op: "!=", value: "joe", prop: "author"},
                    {group: [
                        {op: "=", value: "photo", prop: "tag"},
                        {op: "=", value: "video", prop: "tag", func: "or"}
                    ], func: "and"}
                ], func: "and"}
            ], single);

            single.callCount.should.eql(5);
            single.getCall(0).calledWith({op: "=", value: false, prop: "page"}).should.eql(true);
            single.getCall(1).calledWith({op: "=", value: "published", prop: "status", func: "and"}).should.eql(true);
            single.getCall(2).calledWith({op: "!=", value: "joe", prop: "author"}).should.eql(true);
            single.getCall(3).calledWith({op: "=", value: "photo", prop: "tag"}).should.eql(true);
            single.getCall(4).calledWith({op: "=", value: "video", prop: "tag", func: "or"}).should.eql(true);
        });

        it('should iterate through group statements with a group function', function () {
            var single = sandbox.spy(),
                group = sandbox.spy(function (statement) {
                    testFunc(statement.group);
                }),
                testFunc = function (stuff) {
                    eachStatement(stuff, single, group);
                };

            testFunc([
                {op: "!=", value: "joe", prop: "author"},
                {group: [
                        {op: "=", value: "photo", prop: "tag"},
                        {op: "=", value: "video", prop: "tag", func: "or"}
                ], func: "and"}
            ]);


            single.callCount.should.eql(3);
            single.getCall(0).calledWith({op: "!=", value: "joe", prop: "author"}).should.eql(true);
            single.getCall(1).calledWith({op: "=", value: "photo", prop: "tag"}).should.eql(true);
            single.getCall(2).calledWith({op: "=", value: "video", prop: "tag", func: "or"}).should.eql(true);
            group.callCount.should.eql(1);
            group.getCall(0).calledWith({group: [
                {op: "=", value: "photo", prop: "tag"},
                {op: "=", value: "video", prop: "tag", func: "or"}
            ], func: "and"}).should.eql(true);
        });

        it('should iterate through nested group statements with a group function', function () {
            var single = sandbox.spy(),
                group = sandbox.spy(function (statement) {
                    testFunc(statement.group);
                }),
                testFunc = function (stuff) {
                    eachStatement(stuff, single, group);
                };

            testFunc([
                {op: "=", value: false, prop: "page"},
                {op: "=", value: "published", prop: "status", func: "and"},
                {group: [
                    {op: "!=", value: "joe", prop: "author"},
                    {group: [
                        {op: "=", value: "photo", prop: "tag"},
                        {op: "=", value: "video", prop: "tag", func: "or"}
                    ], func: "and"}
                ], func: "and"}
            ]);

            single.callCount.should.eql(5);
            single.getCall(0).calledWith({op: "=", value: false, prop: "page"}).should.eql(true);
            single.getCall(1).calledWith({op: "=", value: "published", prop: "status", func: "and"}).should.eql(true);
            single.getCall(2).calledWith({op: "!=", value: "joe", prop: "author"}).should.eql(true);
            single.getCall(3).calledWith({op: "=", value: "photo", prop: "tag"}).should.eql(true);
            single.getCall(4).calledWith({op: "=", value: "video", prop: "tag", func: "or"}).should.eql(true);

            group.callCount.should.eql(2);
            group.getCall(0).calledWith({group: [
                {op: "!=", value: "joe", prop: "author"},
                {
                    group: [
                        {op: "=", value: "photo", prop: "tag"},
                        {op: "=", value: "video", prop: "tag", func: "or"}
                    ], func: "and"
                }
            ], func: "and"}).should.eql(true);

            group.getCall(1).calledWith({group: [
                {op: "=", value: "photo", prop: "tag"},
                {op: "=", value: "video", prop: "tag", func: "or"}
            ], func: "and"}).should.eql(true);
        });
    });
});

