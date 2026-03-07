import * as eventService from '../services/event.service.js';

export const getEvents = async (req, res, next) => {
    try {
        const events = await eventService.getEvents(req.user.id);
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        next(error);
    }
};

export const createEvent = async (req, res, next) => {
    try {
        const event = await eventService.createEvent(req.user.id, req.body);
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

export const updateEvent = async (req, res, next) => {
    try {
        const event = await eventService.updateEvent(req.user.id, req.params.id, req.body);
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

export const deleteEvent = async (req, res, next) => {
    try {
        await eventService.deleteEvent(req.user.id, req.params.id);
        res.status(200).json({ success: true, message: 'Event deleted' });
    } catch (error) {
        next(error);
    }
};
