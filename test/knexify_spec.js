/* globals describe, beforeEach, afterEach, it */
var sinon  = require('sinon'),
    knex = require('knex')({}),
    knexify = require('../lib/knexify');

describe('Knexify', function () {
    var postKnex, sandbox = sinon.sandbox.create();

    beforeEach(function () {
        postKnex = knex('posts');
        sandbox.spy(postKnex, 'where');
        sandbox.spy(postKnex, 'orWhere');
        sandbox.spy(postKnex, 'andWhere');
        sandbox.spy(postKnex, 'whereNull');
        sandbox.spy(postKnex, 'whereNotNull');
        sandbox.spy(postKnex, 'orWhereNull');
        sandbox.spy(postKnex, 'orWhereNotNull');
    });

    afterEach(function () {
        sandbox.restore();
    });

    it('should correctly build an empty query', function () {
        knexify(postKnex, {
            statements: []
        });

        // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
        postKnex.toSQL().should.eql({
            bindings: [],
            method: 'select',
            options: {},
            sql: 'select * from "posts"'
        });

        postKnex.toQuery().should.eql('select * from "posts"');

        postKnex.where.calledOnce.should.eql(false);
        postKnex.orWhere.calledOnce.should.eql(false);
        postKnex.andWhere.calledOnce.should.eql(false);
        postKnex.whereNull.calledOnce.should.eql(false);
        postKnex.whereNotNull.calledOnce.should.eql(false);
        postKnex.orWhereNull.calledOnce.should.eql(false);
        postKnex.orWhereNotNull.calledOnce.should.eql(false);
    });

    it('should correctly build a simple query', function () {
        knexify(postKnex, {
            statements: [
                {prop: 'id', op: '=', value: 5}
            ]
        });

        // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
        postKnex.toSQL().should.eql({
            bindings: [5],
            method: 'select',
            options: {},
            sql: 'select * from "posts" where "posts"."id" = ?'
        });

        postKnex.toQuery().should.eql('select * from "posts" where "posts"."id" = 5');

        postKnex.where.calledOnce.should.eql(true);

        postKnex.orWhere.calledOnce.should.eql(false);
        postKnex.andWhere.calledOnce.should.eql(false);
        postKnex.whereNull.calledOnce.should.eql(false);
        postKnex.whereNotNull.calledOnce.should.eql(false);
        postKnex.orWhereNull.calledOnce.should.eql(false);
        postKnex.orWhereNotNull.calledOnce.should.eql(false);
    });

    it('should correctly build an "and" query', function () {
        knexify(postKnex, {
            statements: [
                {prop: 'id', op: '=', value: 5},
                {prop: 'slug', op: '=', value: 'welcome-to-ghost', func: 'and'}
            ]
        });

        // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
        postKnex.toSQL().should.eql({
            bindings: [5, 'welcome-to-ghost'],
            method: 'select',
            options: {},
            sql: 'select * from "posts" where "posts"."id" = ? and "posts"."slug" = ?'
        });

        postKnex.toQuery().should.eql(
            'select * from "posts" where "posts"."id" = 5 and "posts"."slug" = \'welcome-to-ghost\''
        );

        postKnex.where.calledOnce.should.eql(true);
        postKnex.andWhere.calledOnce.should.eql(true);

        postKnex.orWhere.calledOnce.should.eql(false);
        postKnex.whereNull.calledOnce.should.eql(false);
        postKnex.whereNotNull.calledOnce.should.eql(false);
        postKnex.orWhereNull.calledOnce.should.eql(false);
        postKnex.orWhereNotNull.calledOnce.should.eql(false);
    });

    it('should correctly build an "or" query', function () {
        knexify(postKnex, {
            statements: [
                {prop: 'id', op: '=', value: 5},
                {prop: 'slug', op: '=', value: 'welcome-to-ghost', func: 'or'}
            ]
        });

        // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
        postKnex.toSQL().should.eql({
            bindings: [5, 'welcome-to-ghost'],
            method: 'select',
            options: {},
            sql: 'select * from "posts" where "posts"."id" = ? or "posts"."slug" = ?'
        });

        postKnex.toQuery().should.eql(
            'select * from "posts" where "posts"."id" = 5 or "posts"."slug" = \'welcome-to-ghost\''
        );

        // called by orWhere function
        postKnex.where.calledTwice.should.eql(true);
        postKnex.orWhere.calledOnce.should.eql(true);

        postKnex.andWhere.calledOnce.should.eql(false);
        postKnex.whereNull.calledOnce.should.eql(false);
        postKnex.whereNotNull.calledOnce.should.eql(false);
        postKnex.orWhereNull.calledOnce.should.eql(false);
        postKnex.orWhereNotNull.calledOnce.should.eql(false);
    });

    describe('null special cases', function () {
        it('should correctly build a query with NULL', function () {
            knexify(postKnex, {
                statements: [
                    {prop: 'image', op: 'IS', value: null}
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: [],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "posts"."image" is null'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "posts"."image" is null'
            );

            postKnex.whereNull.calledOnce.should.eql(true);

            postKnex.where.calledOnce.should.eql(false);
            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.andWhere.calledOnce.should.eql(false);
            postKnex.whereNotNull.calledOnce.should.eql(false);
            postKnex.orWhereNull.calledOnce.should.eql(false);
            postKnex.orWhereNotNull.calledOnce.should.eql(false);
        });

        it('should correctly build a query with NOT NULL', function () {
            knexify(postKnex, {
                statements: [
                    {prop: 'image', op: 'IS NOT', value: null}
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: [],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "posts"."image" is not null'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "posts"."image" is not null'
            );

            // Called by whereNotNull function
            postKnex.whereNull.calledOnce.should.eql(true);
            postKnex.whereNotNull.calledOnce.should.eql(true);

            postKnex.where.calledOnce.should.eql(false);
            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.andWhere.calledOnce.should.eql(false);
            postKnex.orWhereNull.calledOnce.should.eql(false);
            postKnex.orWhereNotNull.calledOnce.should.eql(false);
        });

        it('should correctly build an "or" query with NULL', function () {
            knexify(postKnex, {
                statements: [
                    {prop: 'id', op: '=', value: 5},
                    {prop: 'image', op: 'IS', value: null, func: 'or'}
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: [5],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "posts"."id" = ? or "posts"."image" is null'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "posts"."id" = 5 or "posts"."image" is null'
            );

            // Called by orWhereNull function
            postKnex.whereNull.calledOnce.should.eql(true);
            postKnex.orWhereNull.calledOnce.should.eql(true);

            postKnex.where.calledOnce.should.eql(true);
            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.andWhere.calledOnce.should.eql(false);
            postKnex.whereNotNull.calledOnce.should.eql(false);
            postKnex.orWhereNotNull.calledOnce.should.eql(false);
        });

        it('should correctly build an "or" query with NOT NULL', function () {
            knexify(postKnex, {
                statements: [
                    {prop: 'id', op: '=', value: 5},
                    {prop: 'image', op: 'IS NOT', value: null, func: 'or'}
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: [5],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "posts"."id" = ? or "posts"."image" is not null'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "posts"."id" = 5 or "posts"."image" is not null'
            );

            postKnex.where.calledOnce.should.eql(true);
            postKnex.orWhereNotNull.calledOnce.should.eql(true);
            // These 2 are called by orWhereNotNull
            postKnex.whereNotNull.calledOnce.should.eql(true);
            postKnex.whereNull.calledOnce.should.eql(true);

            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.andWhere.calledOnce.should.eql(false);
            postKnex.orWhereNull.calledOnce.should.eql(false);
        });
    });

    describe('group special cases', function () {
        it('should correctly build a group query', function () {
            knexify(postKnex, {
                statements: [
                    {op: '!=', value: 'joe', prop: 'author'},
                    {
                        group: [
                            {op: '=', value: 'photo', prop: 'tag'},
                            {op: '=', value: 'video', prop: 'tag', func: 'or'}
                        ], func: 'and'
                    }
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: ['joe', 'photo', 'video'],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "author"."slug" != ? and ("tags"."slug" = ? or "tags"."slug" = ?)'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "author"."slug" != \'joe\' and ("tags"."slug" = \'photo\' or "tags"."slug" = \'video\')'
            );

            postKnex.where.calledOnce.should.eql(true);
            postKnex.andWhere.calledOnce.should.eql(true);

            // can't stub out the sub-query-builder functions
            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.whereNull.calledOnce.should.eql(false);
            postKnex.whereNotNull.calledOnce.should.eql(false);
            postKnex.orWhereNull.calledOnce.should.eql(false);
            postKnex.orWhereNotNull.calledOnce.should.eql(false);
        });

        it('should correctly build a group query with a not null caluse', function () {
            knexify(postKnex, {
                statements: [
                    {op: '!=', value: 'joe', prop: 'author'},
                    {
                        group: [
                            {op: '=', value: 'true', prop: 'featured'},
                            {prop: 'image', op: 'IS NOT', value: null, func: 'or'}
                        ], func: 'and'
                    }
                ]
            });

            // Check the output from both toSQL and toQuery - this emulates calling the query twice for pagination
            postKnex.toSQL().should.eql({
                bindings: ['joe', 'true'],
                method: 'select',
                options: {},
                sql: 'select * from "posts" where "author"."slug" != ? and ("posts"."featured" = ? or "posts"."image" is not null)'
            });

            postKnex.toQuery().should.eql(
                'select * from "posts" where "author"."slug" != \'joe\' and ("posts"."featured" = \'true\' or "posts"."image" is not null)'
            );

            postKnex.where.calledOnce.should.eql(true);
            postKnex.andWhere.calledOnce.should.eql(true);

            // can't stub out the sub-query-builder functions
            postKnex.orWhere.calledOnce.should.eql(false);
            postKnex.whereNull.calledOnce.should.eql(false);
            postKnex.whereNotNull.calledOnce.should.eql(false);
            postKnex.orWhereNull.calledOnce.should.eql(false);
            postKnex.orWhereNotNull.calledOnce.should.eql(false);
        });
    });
});
