import { Router } from "express";
import { createOrder } from "./controller.js";
import { getStatus } from "./controller.js";

export const orderRouter = Router();

orderRouter.post('/', createOrder)
orderRouter.get('/:trackingNumber',getStatus)