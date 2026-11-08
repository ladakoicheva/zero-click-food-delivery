import { Router } from "express";
import { getMatchedItems } from "./controller.js";

export const suggestionsRouter = Router();


suggestionsRouter.get('/',getMatchedItems)