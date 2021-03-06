/**
 * Module to interact with user's google calendar (will probably split it up later)
 * @module api/routes/blockout
 * @requires express
 * @exports router - express router to handle api calls to /api/router
 */
const express = require('express')
const router = express.Router()
const CalendarService = require('../../services/calendar-service')
const ToDoService = require('../../services/todo-service')

/**
 * Gets user todos
 */
router.get('/todo', (request, response) => {
    try {
        var userId = request.session.user_id
        ToDoService.findAllItems(userId).then((todos) => response.json(todos))
    } catch (error) {
        response.status(400).send(error)
        console.log(error)
    }
})

/**
 * Posts a new user todo
 */
router.post('/todo', async (request, response) => {
    // receives deadline in YYYY-MM-DDTHH:MM:SS format in utc time
    const todo = {
        name: request.body.name,
        duration: request.body.duration,
        deadline: new Date(request.body.deadline + 'Z')
    }
    if (request.body.minDuration) todo.minDuration = request.body.minDuration
    if (request.body.maxDuration) todo.maxDuration = request.body.maxDuration

    const accessToken = request.session.access_token
    const calendarServiceInstance = new CalendarService(accessToken)
    const eventId = await calendarServiceInstance.postEvents(todo)

    // Once busininess logic implemented, insert all eventIds into todo.events array.
    todo.events = [eventId]

    ToDoService.postItem(todo, request.session.user_id)
        .then((result) => {
            response.json(result)
        })
        .catch((error) => {
            response.status(400).send({ error: error.message })
        })
})

router.delete('/todo/:id', async (request, response) => {
    const accessToken = request.session.access_token
    const calendarServiceInstance = new CalendarService(accessToken)
    const events = await ToDoService.getItem(request.params.id).then(
        (result) => result.events
    )
    Array.prototype.forEach.call(events, (eventId) =>
        calendarServiceInstance.deleteEvent(eventId)
    )

    ToDoService.deleteItem(request.params.id, request.session.user_id)
        .then((result) => response.status(204).json(result))
        .catch((error) => response.send(error))
})

module.exports = router
