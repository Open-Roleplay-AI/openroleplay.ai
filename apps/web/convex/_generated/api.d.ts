/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * Generated by convex@1.7.1.
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as characterCard from "../characterCard.js";
import type * as characters from "../characters.js";
import type * as chats from "../chats.js";
import type * as constants from "../constants.js";
import type * as crystals from "../crystals.js";
import type * as followUps from "../followUps.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as image from "../image.js";
import type * as ingest_embed from "../ingest/embed.js";
import type * as llm from "../llm.js";
import type * as messages from "../messages.js";
import type * as models from "../models.js";
import type * as payments from "../payments.js";
import type * as personas from "../personas.js";
import type * as random from "../random.js";
import type * as serve from "../serve.js";
import type * as stories from "../stories.js";
import type * as stripe from "../stripe.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  characterCard: typeof characterCard;
  characters: typeof characters;
  chats: typeof chats;
  constants: typeof constants;
  crystals: typeof crystals;
  followUps: typeof followUps;
  helpers: typeof helpers;
  http: typeof http;
  image: typeof image;
  "ingest/embed": typeof ingest_embed;
  llm: typeof llm;
  messages: typeof messages;
  models: typeof models;
  payments: typeof payments;
  personas: typeof personas;
  random: typeof random;
  serve: typeof serve;
  stories: typeof stories;
  stripe: typeof stripe;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
