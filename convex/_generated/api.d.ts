/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as users__helpers_getCurrentUser from "../users/_helpers/getCurrentUser.js";
import type * as users__helpers_index from "../users/_helpers/index.js";
import type * as users__helpers_upsertUserRecord from "../users/_helpers/upsertUserRecord.js";
import type * as users__helpers_userByExternalId from "../users/_helpers/userByExternalId.js";
import type * as users_clerk_index from "../users/clerk/index.js";
import type * as users_clerk_userCreated from "../users/clerk/userCreated.js";
import type * as users_clerk_userDeleted from "../users/clerk/userDeleted.js";
import type * as users_clerk_userUpdated from "../users/clerk/userUpdated.js";
import type * as users_mutations_upsertUser from "../users/mutations/upsertUser.js";
import type * as users_webhooks from "../users/webhooks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "users/_helpers/getCurrentUser": typeof users__helpers_getCurrentUser;
  "users/_helpers/index": typeof users__helpers_index;
  "users/_helpers/upsertUserRecord": typeof users__helpers_upsertUserRecord;
  "users/_helpers/userByExternalId": typeof users__helpers_userByExternalId;
  "users/clerk/index": typeof users_clerk_index;
  "users/clerk/userCreated": typeof users_clerk_userCreated;
  "users/clerk/userDeleted": typeof users_clerk_userDeleted;
  "users/clerk/userUpdated": typeof users_clerk_userUpdated;
  "users/mutations/upsertUser": typeof users_mutations_upsertUser;
  "users/webhooks": typeof users_webhooks;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
