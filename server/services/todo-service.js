/**
 * Service to interact with todo database
 * @module services/ToDoService
 */
const ToDo = require('../models/todo')
const UserService = require('./user-service')

/**
 * Gets all users from mongodb database
 * @param {String} userId - User ID representing current user
 * @returns {Document} - Returns all todo documents for a given user
 */
async function findAllItems (userId) {
    const user = await UserService.getUser(userId)
    const todos = user.todos
    return ToDo.find({ _id: { $in: todos } })
}

/**
 * Get specific document
 * @param {String} id - ToDo ID string
 * @returns {document} - returns document by ID field
 */
function getItem (id) {
    return ToDo.findById({ _id: id })
}

/**
 * Post new item
 * @function
 * @param {Object} body - object representing todo item
 * @param {String} userid - id for user that created the todo item
 * @returns {Promise} – Promise to return document in mongoDB database
 */
async function postItem (body, userid) {
    if (!userid) throw Error('missing user id')

    const todo = new ToDo(body)

    const user = await UserService.pushItem(userid, 'todos', todo.id)
    if (user instanceof Error) throw user

    return todo.save().catch((error) => {
        throw error
    })
}

/**
 * Delete specific item and from user todo array
 * @param {String} id - ID representing todo object
 */
function deleteItem (id, userid) {
    return ToDo.deleteOne({ _id: id })
        .then(() => UserService.deleteItem(userid, 'todos', id))
        .catch((error) => {
            throw error
        })
}

module.exports = {
    findAllItems,
    getItem,
    postItem,
    deleteItem
}
