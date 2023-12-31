import {
  action,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUser } from "./users";
import { embedText } from "./ingest/embed";
import { paginationOptsValidator } from "convex/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

export const upsert = mutation({
  args: {
    id: v.optional(v.id("characters")),
    remixId: v.optional(v.id("characters")),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    model: v.optional(
      v.union(
        v.literal("gpt-3.5-turbo-1106"),
        v.literal("gpt-4-1106-preview"),
        v.literal("mistral-7b-instruct"),
        v.literal("mixtral-8x7b-instruct"),
        v.literal("pplx-7b-chat"),
        v.literal("pplx-7b-online"),
        v.literal("pplx-70b-chat"),
        v.literal("pplx-70b-online"),
        v.literal("accounts/fireworks/models/qwen-14b-chat"),
        v.literal("mistral-tiny"),
        v.literal("mistral-small"),
        v.literal("mistral-medium"),
      ),
    ),
    instructions: v.optional(v.string()),
    cardImageUrl: v.optional(v.string()),
    cardImageStorageId: v.optional(v.id("_storage")),
    greetings: v.optional(v.array(v.string())),
    knowledge: v.optional(v.string()),
    capabilities: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const updatedAt = new Date().toISOString();
    if (args.id) {
      const characterDraft = await ctx.db.get(args.id);
      if (characterDraft && user._id !== characterDraft.creatorId) {
        throw new ConvexError({
          message: "User does not have permission to modify this character.",
        });
      }
      const { id, cardImageUrl, cardImageStorageId, ...rest } = args;
      const character = await ctx.db.patch(id, {
        ...rest,
        ...(cardImageStorageId
          ? {
              cardImageUrl: (await ctx.storage.getUrl(
                cardImageStorageId,
              )) as string,
            }
          : { cardImageUrl }),
        updatedAt,
      });
      return character;
    } else {
      const { cardImageStorageId, cardImageUrl, ...rest } = args;
      const character = await ctx.db.insert("characters", {
        ...rest,
        ...(cardImageStorageId
          ? {
              cardImageUrl: (await ctx.storage.getUrl(
                cardImageStorageId,
              )) as string,
            }
          : { cardImageUrl }),
        creatorId: user._id,
        updatedAt,
        numChats: 0,
        isDraft: true,
        isArchived: false,
        isNSFW: false,
        isBlacklisted: false,
      });
      return character;
    }
  },
});

export const publish = mutation({
  args: {
    id: v.id("characters"),
    visibility: v.optional(v.union(v.literal("private"), v.literal("public"))),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const character = await ctx.db.get(args.id);
    if (!character) {
      throw new ConvexError({ message: "Character does not exist." });
    }
    if (user._id !== character.creatorId) {
      throw new ConvexError({
        message: "User does not have permission to modify this character.",
      });
    }
    if (!character.name || !character.greetings) {
      throw new ConvexError({
        message: "Character must have a name and greeting.",
      });
    }
    const updatedAt = new Date().toISOString();
    const updatedCharacter = await ctx.db.patch(args.id, {
      isDraft: false,
      ...(args.visibility ? { visibility: args.visibility } : {}),
      ...(character.description ? {} : { description: character.greetings[0] }),
      updatedAt,
    });
    !character.languageTag &&
      (await ctx.scheduler.runAfter(0, internal.llm.generateTags, {
        userId: user._id,
        characterId: character._id,
      }));
    return character._id;
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    genreTag: v.optional(v.string()),
    personalityTag: v.optional(v.string()),
    roleTag: v.optional(v.string()),
    languageTag: v.optional(v.string()),
    model: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("characters")
      .withIndex("byUpdatedAt")
      .filter((q) => q.eq(q.field("isDraft"), false))
      .filter((q) => q.eq(q.field("isBlacklisted"), false))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .filter((q) => q.neq(q.field("isNSFW"), true))
      .filter((q) => q.neq(q.field("visibility"), "private"));
    if (args.genreTag) {
      query = query.filter((q) => q.eq(q.field("genreTag"), args.genreTag));
    }
    if (args.personalityTag) {
      query = query.filter((q) =>
        q.eq(q.field("personalityTag"), args.personalityTag),
      );
    }
    if (args.roleTag) {
      query = query.filter((q) => q.eq(q.field("roleTag"), args.roleTag));
    }
    if (args.languageTag) {
      query = query.filter((q) =>
        q.eq(q.field("languageTag"), args.languageTag),
      );
    }
    if (args.model) {
      query = query.filter((q) => q.eq(q.field("model"), args.model));
    }

    return await query.order("desc").paginate(args.paginationOpts);
  },
});

export const search = query({
  args: {
    paginationOpts: paginationOptsValidator,
    genreTag: v.optional(v.string()),
    personalityTag: v.optional(v.string()),
    roleTag: v.optional(v.string()),
    languageTag: v.optional(v.string()),
    model: v.optional(v.string()),
    query: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query;
    if (args.query) {
      query = ctx.db
        .query("characters")
        .withSearchIndex("searchName", (q) =>
          q.search("name", args.query as string),
        )
        .filter((q) => q.eq(q.field("isDraft"), false))
        .filter((q) => q.eq(q.field("isBlacklisted"), false))
        .filter((q) => q.neq(q.field("isArchived"), true))
        .filter((q) => q.neq(q.field("isNSFW"), true))
        .filter((q) => q.neq(q.field("visibility"), "private"));
    } else {
      query = ctx.db
        .query("characters")
        .withIndex("byNumChats")
        .order("desc")
        .filter((q) => q.eq(q.field("isDraft"), false))
        .filter((q) => q.eq(q.field("isBlacklisted"), false))
        .filter((q) => q.neq(q.field("isArchived"), true))
        .filter((q) => q.neq(q.field("isNSFW"), true))
        .filter((q) => q.neq(q.field("visibility"), "private"));
    }
    if (args.genreTag) {
      query = query.filter((q) => q.eq(q.field("genreTag"), args.genreTag));
    }
    if (args.personalityTag) {
      query = query.filter((q) =>
        q.eq(q.field("personalityTag"), args.personalityTag),
      );
    }
    if (args.roleTag) {
      query = query.filter((q) => q.eq(q.field("roleTag"), args.roleTag));
    }
    if (args.languageTag) {
      query = query.filter((q) =>
        q.eq(q.field("languageTag"), args.languageTag),
      );
    }
    if (args.model) {
      query = query.filter((q) => q.eq(q.field("model"), args.model));
    }

    return await query.paginate(args.paginationOpts);
  },
});

export const listMy = query({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    return await ctx.db
      .query("characters")
      .filter((q) => q.eq(q.field("creatorId"), user._id))
      .filter((q) => q.neq(q.field("isArchived"), true))
      .order("desc")
      .paginate(args.paginationOpts);
  },
});

export const get = query({
  args: {
    id: v.id("characters"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getCharacter = internalQuery({
  args: {
    id: v.id("characters"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const archive = mutation({
  args: {
    id: v.id("characters"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    const characterDraft = await ctx.db.get(args.id);
    if (characterDraft && user._id !== characterDraft.creatorId) {
      throw new ConvexError({
        message: "User does not have permission to modify this character.",
      });
    }
    return await ctx.db.patch(args.id, { isArchived: true });
  },
});

export const similarCharacters = action({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await embedText(args.query);
    return await ctx.vectorSearch("characters", "byEmbedding", {
      vector: embedding[0] as number[],
      limit: 16,
    });
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const generateInstruction = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    characterId: v.id("characters"),
  },
  handler: async (ctx, { name, description, characterId }) => {
    const user = await getUser(ctx);
    await ctx.scheduler.runAfter(0, internal.llm.generateInstruction, {
      userId: user._id,
      characterId,
      name,
      description,
    });
    const character = await ctx.db.get(characterId);
    return character?.instructions;
  },
});

export const autofill = internalMutation(
  async (
    ctx,
    {
      characterId,
      name,
      description,
      instructions,
      greeting,
    }: {
      characterId: Id<"characters">;
      name: string;
      description: string;
      instructions: string;
      greeting: string;
    },
  ) => {
    return await ctx.db.patch(characterId, {
      name,
      description,
      instructions,
      greetings: [greeting],
    });
  },
);

export const tag = internalMutation(
  async (
    ctx,
    {
      characterId,
      languageTag,
      genreTag,
      personalityTag,
      roleTag,
    }: {
      characterId: Id<"characters">;
      languageTag: string;
      genreTag: string;
      personalityTag: string;
      roleTag: string;
    },
  ) => {
    return await ctx.db.patch(characterId, {
      languageTag,
      genreTag,
      personalityTag,
      roleTag,
    });
  },
);

export const generate = mutation({
  args: {},
  handler: async (ctx, {}) => {
    const user = await getUser(ctx);
    const updatedAt = new Date().toISOString();
    const character = await ctx.db.insert("characters", {
      creatorId: user._id,
      updatedAt,
      numChats: 0,
      isDraft: true,
      isArchived: false,
      isNSFW: false,
      isBlacklisted: false,
    });
    await ctx.scheduler.runAfter(0, internal.llm.generateCharacter, {
      userId: user._id,
      characterId: character,
    });
    return character;
  },
});

export const listPopularTags = query({
  handler: async (ctx) => {
    const popularCharacters = await ctx.db
      .query("characters")
      .withIndex("byNumChats")
      .order("desc")
      .take(100);
    type TagCount = { [key: string]: number };
    type TagCounts = { [key: string]: TagCount };
    const tagCounts: TagCounts = popularCharacters.reduce(
      (acc: TagCounts, character) => {
        (
          [
            "languageTag",
            "genreTag",
            "personalityTag",
            "roleTag",
            "model",
          ] as const
        ).forEach((tag) => {
          const tagValue = character[tag];
          if (tagValue) {
            acc[tag] = acc[tag] || {};
            // @ts-ignore
            acc[tag][tagValue] = (acc[tag][tagValue] || 0) + 1;
          }
        });
        return acc;
      },
      {},
    );
    type MostFrequentTags = {
      [key: string]: { tagName: string; count: number }[];
    };
    const mostFrequentTags: MostFrequentTags = Object.keys(tagCounts).reduce(
      (acc: MostFrequentTags, tag) => {
        // @ts-ignore
        const sortedTags = Object.entries(tagCounts[tag])
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([tagName, count]) => ({ tagName, count }));
        acc[tag] = sortedTags;
        return acc;
      },
      {},
    );

    return mostFrequentTags;
  },
});
