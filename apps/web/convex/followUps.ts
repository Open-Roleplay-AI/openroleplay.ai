import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { getUser } from "./users";
import { internal } from "./_generated/api";

export const create = internalMutation({
  args: {
    chatId: v.id("chats"),
    followUp1: v.optional(v.string()),
    followUp2: v.optional(v.string()),
    followUp3: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("followUps", {
      ...args,
      isStale: false,
    });
  },
});

export const update = internalMutation({
  args: {
    followUpId: v.id("followUps"),
    followUp1: v.optional(v.string()),
    followUp2: v.optional(v.string()),
    followUp3: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { followUpId, ...rest } = args;
    return await ctx.db.patch(followUpId, {
      ...rest,
    });
  },
});

export const generate = mutation({
  args: {
    chatId: v.id("chats"),
    characterId: v.id("characters"),
    personaId: v.optional(v.id("personas")),
  },
  handler: async (ctx, { chatId, characterId, personaId }) => {
    const user = await getUser(ctx);
    await ctx.scheduler.runAfter(0, internal.llm.generateFollowups, {
      chatId,
      characterId,
      personaId: personaId ? personaId : user?.primaryPersonaId,
      userId: user._id,
    });
  },
});

export const get = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("_id"), args.chatId))
      .filter((q) => q.eq(q.field("userId"), user._id))
      .first();
    console.log("chat::", chat);
    if (chat) {
      console.log("chatId provided:::", args.chatId);
      console.log("chatId find:::", chat._id);
      const followUp = await ctx.db
        .query("followUps")
        .withIndex("by_creation_time")
        .filter((q) => q.eq(q.field("chatId"), args.chatId))
        .order("desc")
        .first();
      console.log("followUp::", followUp);
      return followUp;
    }
  },
});

export const autopilot = mutation({
  args: {
    chatId: v.id("chats"),
    characterId: v.id("characters"),
    personaId: v.optional(v.id("personas")),
  },
  handler: async (ctx, { chatId, characterId, personaId }) => {
    const user = await getUser(ctx);
    await ctx.scheduler.runAfter(0, internal.llm.answer, {
      chatId,
      characterId,
      personaId: personaId ? personaId : user?.primaryPersonaId,
      userId: user._id,
      reverseRole: true,
    });
    const character = await ctx.db.get(characterId);
    const updatedAt = new Date().toISOString();
    await ctx.db.patch(characterId, {
      numChats: character?.numChats ? character?.numChats + 1 : 1,
      updatedAt,
    });
  },
});
