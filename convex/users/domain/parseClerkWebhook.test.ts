import { describe, expect, test } from "vitest";

import { parseClerkEvent } from "./parseClerkWebhook";
import type { ClerkWebhookEvent } from "./parseClerkWebhook";

const emailList = [
  { id: "email_1", email_address: "primary@example.com" },
  { id: "email_2", email_address: "other@example.com" },
];

describe("parseClerkEvent — user.created", () => {
  test("maps primary email, names, and profile picture", () => {
    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: {
        id: "user_abc",
        email_addresses: emailList,
        primary_email_address_id: "email_1",
        first_name: "Alice",
        last_name: "Smith",
        image_url: "https://example.com/pic.jpg",
      },
    };
    expect(parseClerkEvent(event)).toEqual({
      type: "userCreated",
      args: {
        externalAuthId: "user_abc",
        email: "primary@example.com",
        firstName: "Alice",
        lastName: "Smith",
        profilePictureUrl: "https://example.com/pic.jpg",
      },
    });
  });

  test("falls back to empty string when no primary email matches", () => {
    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: {
        id: "user_abc",
        email_addresses: emailList,
        primary_email_address_id: "email_unknown",
        first_name: null,
        last_name: null,
        image_url: null,
      },
    };
    expect(parseClerkEvent(event).args.email).toBe("");
  });

  test("omits optional fields when null", () => {
    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: {
        id: "user_abc",
        email_addresses: emailList,
        primary_email_address_id: "email_1",
        first_name: null,
        last_name: null,
        image_url: null,
      },
    };
    const { args } = parseClerkEvent(event);
    expect(args.firstName).toBeUndefined();
    expect(args.lastName).toBeUndefined();
    expect(args.profilePictureUrl).toBeUndefined();
  });

  test("selects the correct primary email when multiple are present", () => {
    const event: ClerkWebhookEvent = {
      type: "user.created",
      data: {
        id: "user_abc",
        email_addresses: emailList,
        primary_email_address_id: "email_2",
        first_name: null,
        last_name: null,
        image_url: null,
      },
    };
    expect(parseClerkEvent(event).args.email).toBe("other@example.com");
  });
});

describe("parseClerkEvent — user.updated", () => {
  test("maps all provided fields", () => {
    const event: ClerkWebhookEvent = {
      type: "user.updated",
      data: {
        id: "user_upd",
        email_addresses: emailList,
        primary_email_address_id: "email_2",
        first_name: "Bob",
        last_name: "Jones",
        image_url: null,
      },
    };
    expect(parseClerkEvent(event)).toEqual({
      type: "userUpdated",
      args: {
        externalAuthId: "user_upd",
        email: "other@example.com",
        firstName: "Bob",
        lastName: "Jones",
        profilePictureUrl: undefined,
      },
    });
  });

  test("leaves email undefined when no primary email matches", () => {
    const event: ClerkWebhookEvent = {
      type: "user.updated",
      data: {
        id: "user_upd",
        email_addresses: emailList,
        primary_email_address_id: "email_unknown",
        first_name: null,
        last_name: null,
        image_url: null,
      },
    };
    expect(parseClerkEvent(event).args.email).toBeUndefined();
  });
});

describe("parseClerkEvent — user.deleted", () => {
  test("maps externalAuthId from deleted payload", () => {
    const event: ClerkWebhookEvent = {
      type: "user.deleted",
      data: { id: "user_del", deleted: true },
    };
    expect(parseClerkEvent(event)).toEqual({
      type: "userDeleted",
      args: { externalAuthId: "user_del" },
    });
  });
});
