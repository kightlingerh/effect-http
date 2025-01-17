import type * as Effect from "@effect/io/Effect";
import type * as Schema from "@effect/schema/Schema";

import type { AnyApi, Api, Endpoint } from "../Api";
import type { EndpointSchemasToInput, SelectEndpointById } from "../Server";
import * as internal from "../internal/client";
import type { ClientError } from "./Errors";

type MakeHeadersOptionIfAllPartial<I> = I extends { headers: any }
  ? Schema.Spread<
      (Record<string, never> extends I["headers"]
        ? { headers?: I["headers"] }
        : Pick<I, "headers">) &
        Omit<I, "headers">
    >
  : I;

type DropCommonHeaders<I, H> = {
  [K in keyof I]: K extends "headers"
    ? Schema.Spread<
        {
          [HK in Extract<keyof H, keyof I[K]>]?: I[K][HK];
        } & {
          [HK in Exclude<keyof I[K], keyof H>]: I[K][HK];
        }
      >
    : I[K];
};

type ClientFunction<Es extends Endpoint[], Id, I> = Record<
  string,
  never
> extends I
  ? (
      input?: I,
    ) => Effect.Effect<
      never,
      ClientError,
      Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >
  : (
      input: I,
    ) => Effect.Effect<
      never,
      ClientError,
      Schema.To<SelectEndpointById<Es, Id>["schemas"]["response"]>
    >;

export type Client<A extends AnyApi, H> = A extends Api<infer Es>
  ? Schema.Spread<{
      [Id in Es[number]["id"]]: ClientFunction<
        Es,
        Id,
        MakeHeadersOptionIfAllPartial<
          DropCommonHeaders<
            EndpointSchemasToInput<SelectEndpointById<Es, Id>["schemas"]>,
            H
          >
        >
      >;
    }>
  : never;

export type ClientOptions<H extends Record<string, unknown>> = {
  headers: H;
};

/** Derive client implementation from the `Api` */
export const client: <A extends AnyApi, H extends Record<string, unknown>>(
  baseUrl: URL,
  options?: ClientOptions<H>,
) => (api: A) => Client<A, H> = internal.client;
