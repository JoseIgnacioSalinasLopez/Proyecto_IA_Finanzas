import express from 'express';
import { getEvents, createEvent, updateEvent, deleteEvent } from '../controllers/event.controller.js';
import { protect } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.route('/')
    .get(protect, getEvents)
    .post(protect, createEvent);

router.route('/:id')
    .put(protect, updateEvent)
    .delete(protect, deleteEvent);

export default router;
