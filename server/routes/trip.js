// src/backend/routes/trip.js
import express from 'express';
import { generateTrip } from '../controllers/tripController.js';

const router = express.Router();

router.post('/', generateTrip);

export default router;
