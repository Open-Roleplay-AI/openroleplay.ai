import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

const http = httpRouter();

http.route({
  path: "/stripe",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature: string = request.headers.get("stripe-signature") as string;
    const result = await ctx.runAction(internal.stripe.fulfill, {
      signature,
      payload: await request.text(),
    });
    if (result.success) {
      return new Response(null, {
        status: 200,
      });
    } else {
      return new Response("Webhook Error", {
        status: 400,
      });
    }
  }),
});

http.route({
  path: "/character",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const characterId = url.searchParams.get("characterId") as Id<"characters">;
    const result = await ctx.runQuery(api.characters.get, {
      id: characterId,
    });
    if (result) {
      return new Response(JSON.stringify(result), {
        status: 200,
      });
    } else {
      return new Response("Character not found", {
        status: 404,
      });
    }
  }),
});

export default http;
