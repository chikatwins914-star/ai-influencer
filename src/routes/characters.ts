import { Router } from "express";
import { z } from "zod";
import { prisma } from "../utils/prisma.js";
import { deserializeCharacter, seedDefaultCharacters } from "../services/characterService.js";
import { AppError, asyncHandler } from "../middleware/errorHandler.js";
import { CharacterSheetSchema, toDbCharacterInput } from "../../shared/characterSchema.js";

export const characterRouter = Router();

// GET /api/characters — list all characters
characterRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const characters = await prisma.character.findMany({ orderBy: { createdAt: "asc" } });
    res.json(characters.map(deserializeCharacter));
  })
);

// GET /api/characters/seed-default
// One-time setup helper for a fresh deploy with an empty database: upserts
// (by name, so safe to call more than once) every character sheet bundled
// under assets/characters/. Takes no input, so a GET is used deliberately
// here for reachability from a plain browser address bar.
characterRouter.get(
  "/seed-default",
  asyncHandler(async (_req, res) => {
    const result = await seedDefaultCharacters();
    res.json(result);
  })
);

// GET /api/characters/:id
characterRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params["id"];
    if (!id) throw new AppError("Missing character id", 400);
    const character = await prisma.character.findUnique({ where: { id } });
    if (!character) throw new AppError("Character not found", 404);
    res.json(deserializeCharacter(character));
  })
);

// POST /api/characters — create from a full character sheet payload
characterRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const sheet = CharacterSheetSchema.parse(req.body);
    const created = await prisma.character.create({ data: toDbCharacterInput(sheet) });
    res.status(201).json(deserializeCharacter(created));
  })
);

// PATCH /api/characters/:id — partial update (e.g. tweak personality/hobbies)
const PatchSchema = CharacterSheetSchema.partial();
characterRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const id = req.params["id"];
    if (!id) throw new AppError("Missing character id", 400);

    const existing = await prisma.character.findUnique({ where: { id } });
    if (!existing) throw new AppError("Character not found", 404);

    const partial = PatchSchema.parse(req.body);
    const data: Record<string, unknown> = { ...partial };

    for (const field of ["hobbies", "favoriteFoods", "dislikedFoods", "accessories"] as const) {
      if (partial[field] !== undefined) {
        data[field] = JSON.stringify(partial[field]);
      }
    }
    // nationality is sheet-level metadata not persisted on the DB model; ignore if present
    delete data["nationality"];
    delete data["visualReferenceDoc"];
    delete data["referenceImages"];

    const updated = await prisma.character.update({ where: { id }, data });
    res.json(deserializeCharacter(updated));
  })
);

// Guard against accidental deletion of the only character record without confirmation
const DeleteQuerySchema = z.object({ confirm: z.literal("true") });
characterRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    DeleteQuerySchema.parse(req.query);
    const id = req.params["id"];
    if (!id) throw new AppError("Missing character id", 400);

    await prisma.character.delete({ where: { id } });
    res.status(204).send();
  })
);
