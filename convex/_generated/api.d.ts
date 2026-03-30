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
import type * as users__helpers_get_current_user from "../users/_helpers/get_current_user.js";
import type * as users__helpers_index from "../users/_helpers/index.js";
import type * as users__helpers_upsert_user_record from "../users/_helpers/upsert_user_record.js";
import type * as users__helpers_user_by_external_id from "../users/_helpers/user_by_external_id.js";
import type * as users_clerk_index from "../users/clerk/index.js";
import type * as users_clerk_userCreated from "../users/clerk/userCreated.js";
import type * as users_clerk_userDeleted from "../users/clerk/userDeleted.js";
import type * as users_clerk_userUpdated from "../users/clerk/userUpdated.js";
import type * as users_mutations_index from "../users/mutations/index.js";
import type * as users_mutations_upsertUser from "../users/mutations/upsertUser.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "users/_helpers/get_current_user": typeof users__helpers_get_current_user;
  "users/_helpers/index": typeof users__helpers_index;
  "users/_helpers/upsert_user_record": typeof users__helpers_upsert_user_record;
  "users/_helpers/user_by_external_id": typeof users__helpers_user_by_external_id;
  "users/clerk/index": typeof users_clerk_index;
  "users/clerk/userCreated": typeof users_clerk_userCreated;
  "users/clerk/userDeleted": typeof users_clerk_userDeleted;
  "users/clerk/userUpdated": typeof users_clerk_userUpdated;
  "users/mutations/index": typeof users_mutations_index;
  "users/mutations/upsertUser": typeof users_mutations_upsertUser;
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
