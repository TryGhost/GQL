/**
 * Context
 *
 * Temporary file that contains things that shouldn't be in this module
 */

// contextual information we need to do the next stage of processing
var resourceContext = {
    posts: {
        name: 'posts',
        propAliases: {author: 'author.slug', tags: 'tags.slug', tag: 'tags.slug'},
        relations: ['tags', 'author'],
        namedProperties: []
    },
    tags: {
        name: 'tags',
        propAliases: {},
        relations: [],
        namedProperties: ['posts_count']
    },
    users: {
        name: 'users',
        propAliases: {role: 'roles.name'},
        relations: [],
        namedProperties: ['posts_count']
    }
};

module.exports = resourceContext;