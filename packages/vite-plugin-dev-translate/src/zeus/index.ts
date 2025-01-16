/* eslint-disable */

import { AllTypesProps, ReturnTypes, Ops } from './const.js';
import fetch, { Response } from 'node-fetch';
import WebSocket from 'ws';
export const HOST = "https://backend.devtranslate.app/graphql"


export const HEADERS = {}
export const apiSubscription = (options: chainOptions) => (query: string) => {
  try {
    const queryString = options[0] + '?query=' + encodeURIComponent(query);
    const wsString = queryString.replace('http', 'ws');
    const host = (options.length > 1 && options[1]?.websocket?.[0]) || wsString;
    const webSocketOptions = options[1]?.websocket || [host];
    const ws = new WebSocket(...webSocketOptions);
    return {
      ws,
      on: (e: (args: any) => void) => {
        ws.onmessage = (event: any) => {
          if (event.data) {
            const parsed = JSON.parse(event.data);
            const data = parsed.data;
            return e(data);
          }
        };
      },
      off: (e: (args: any) => void) => {
        ws.onclose = e;
      },
      error: (e: (args: any) => void) => {
        ws.onerror = e;
      },
      open: (e: () => void) => {
        ws.onopen = e;
      },
    };
  } catch {
    throw new Error('No websockets implemented');
  }
};
const handleFetchResponse = (response: Response): Promise<GraphQLResponse> => {
  if (!response.ok) {
    return new Promise((_, reject) => {
      response
        .text()
        .then((text) => {
          try {
            reject(JSON.parse(text));
          } catch (err) {
            reject(text);
          }
        })
        .catch(reject);
    });
  }
  return response.json() as Promise<GraphQLResponse>;
};

export const apiFetch =
  (options: fetchOptions) =>
  (query: string, variables: Record<string, unknown> = {}) => {
    const fetchOptions = options[1] || {};
    if (fetchOptions.method && fetchOptions.method === 'GET') {
      return fetch(`${options[0]}?query=${encodeURIComponent(query)}`, fetchOptions)
        .then(handleFetchResponse)
        .then((response: GraphQLResponse) => {
          if (response.errors) {
            throw new GraphQLError(response);
          }
          return response.data;
        });
    }
    return fetch(`${options[0]}`, {
      body: JSON.stringify({ query, variables }),
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      ...fetchOptions,
    })
      .then(handleFetchResponse)
      .then((response: GraphQLResponse) => {
        if (response.errors) {
          throw new GraphQLError(response);
        }
        return response.data;
      });
  };

export const InternalsBuildQuery = ({
  ops,
  props,
  returns,
  options,
  scalars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  options?: OperationOptions;
  scalars?: ScalarDefinition;
}) => {
  const ibb = (
    k: string,
    o: InputValueType | VType,
    p = '',
    root = true,
    vars: Array<{ name: string; graphQLType: string }> = [],
  ): string => {
    const keyForPath = purifyGraphQLKey(k);
    const newPath = [p, keyForPath].join(SEPARATOR);
    if (!o) {
      return '';
    }
    if (typeof o === 'boolean' || typeof o === 'number') {
      return k;
    }
    if (typeof o === 'string') {
      return `${k} ${o}`;
    }
    if (Array.isArray(o)) {
      const args = InternalArgsBuilt({
        props,
        returns,
        ops,
        scalars,
        vars,
      })(o[0], newPath);
      return `${ibb(args ? `${k}(${args})` : k, o[1], p, false, vars)}`;
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(`${alias}:${operationName}`, operation, p, false, vars);
        })
        .join('\n');
    }
    const hasOperationName = root && options?.operationName ? ' ' + options.operationName : '';
    const keyForDirectives = o.__directives ?? '';
    const query = `{${Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map((e) => ibb(...e, [p, `field<>${keyForPath}`].join(SEPARATOR), false, vars))
      .join('\n')}}`;
    if (!root) {
      return `${k} ${keyForDirectives}${hasOperationName} ${query}`;
    }
    const varsString = vars.map((v) => `${v.name}: ${v.graphQLType}`).join(', ');
    return `${k} ${keyForDirectives}${hasOperationName}${varsString ? `(${varsString})` : ''} ${query}`;
  };
  return ibb;
};

type UnionOverrideKeys<T, U> = Omit<T, keyof U> & U;

export const Thunder =
  <SCLR extends ScalarDefinition>(fn: FetchFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: Record<string, unknown> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    return fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
      ops?.variables,
    ).then((data) => {
      if (options?.scalars) {
        return decodeScalarsInResponse({
          response: data,
          initialOp: operation,
          initialZeusQuery: o as VType,
          returns: ReturnTypes,
          scalars: options.scalars,
          ops: Ops,
        });
      }
      return data;
    }) as Promise<InputType<GraphQLTypes[R], Z, UnionOverrideKeys<SCLR, OVERRIDESCLR>>>;
  };

export const Chain = (...options: chainOptions) => Thunder(apiFetch(options));

export const SubscriptionThunder =
  <SCLR extends ScalarDefinition>(fn: SubscriptionFunction, thunderGraphQLOptions?: ThunderGraphQLOptions<SCLR>) =>
  <O extends keyof typeof Ops, OVERRIDESCLR extends SCLR, R extends keyof ValueTypes = GenericOperation<O>>(
    operation: O,
    graphqlOptions?: ThunderGraphQLOptions<OVERRIDESCLR>,
  ) =>
  <Z extends ValueTypes[R]>(
    o: Z & {
      [P in keyof Z]: P extends keyof ValueTypes[R] ? Z[P] : never;
    },
    ops?: OperationOptions & { variables?: ExtractVariables<Z> },
  ) => {
    const options = {
      ...thunderGraphQLOptions,
      ...graphqlOptions,
    };
    type CombinedSCLR = UnionOverrideKeys<SCLR, OVERRIDESCLR>;
    const returnedFunction = fn(
      Zeus(operation, o, {
        operationOptions: ops,
        scalars: options?.scalars,
      }),
    ) as SubscriptionToGraphQL<Z, GraphQLTypes[R], CombinedSCLR>;
    if (returnedFunction?.on && options?.scalars) {
      const wrapped = returnedFunction.on;
      returnedFunction.on = (fnToCall: (args: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => void) =>
        wrapped((data: InputType<GraphQLTypes[R], Z, CombinedSCLR>) => {
          if (options?.scalars) {
            return fnToCall(
              decodeScalarsInResponse({
                response: data,
                initialOp: operation,
                initialZeusQuery: o as VType,
                returns: ReturnTypes,
                scalars: options.scalars,
                ops: Ops,
              }),
            );
          }
          return fnToCall(data);
        });
    }
    return returnedFunction;
  };

export const Subscription = (...options: chainOptions) => SubscriptionThunder(apiSubscription(options));
export const Zeus = <
  Z extends ValueTypes[R],
  O extends keyof typeof Ops,
  R extends keyof ValueTypes = GenericOperation<O>,
>(
  operation: O,
  o: Z,
  ops?: {
    operationOptions?: OperationOptions;
    scalars?: ScalarDefinition;
  },
) =>
  InternalsBuildQuery({
    props: AllTypesProps,
    returns: ReturnTypes,
    ops: Ops,
    options: ops?.operationOptions,
    scalars: ops?.scalars,
  })(operation, o as VType);

export const ZeusSelect = <T>() => ((t: unknown) => t) as SelectionFunction<T>;

export const Selector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();

export const TypeFromSelector = <T extends keyof ValueTypes>(key: T) => key && ZeusSelect<ValueTypes[T]>();
export const Gql = Chain(HOST, {
  headers: {
    'Content-Type': 'application/json',
    ...HEADERS,
  },
});

export const ZeusScalars = ZeusSelect<ScalarCoders>();

type ScalarsSelector<T> = {
  [X in Required<{
    [P in keyof T]: T[P] extends number | string | undefined | boolean ? P : never;
  }>[keyof T]]: true;
};

export const fields = <T extends keyof ModelTypes>(k: T) => {
  const t = ReturnTypes[k];
  const o = Object.fromEntries(
    Object.entries(t)
      .filter(([, value]) => {
        const isReturnType = ReturnTypes[value as string];
        if (!isReturnType || (typeof isReturnType === 'string' && isReturnType.startsWith('scalar.'))) {
          return true;
        }
      })
      .map(([key]) => [key, true as const]),
  );
  return o as ScalarsSelector<ModelTypes[T]>;
};

export const decodeScalarsInResponse = <O extends Operations>({
  response,
  scalars,
  returns,
  ops,
  initialZeusQuery,
  initialOp,
}: {
  ops: O;
  response: any;
  returns: ReturnTypesType;
  scalars?: Record<string, ScalarResolver | undefined>;
  initialOp: keyof O;
  initialZeusQuery: InputValueType | VType;
}) => {
  if (!scalars) {
    return response;
  }
  const builder = PrepareScalarPaths({
    ops,
    returns,
  });

  const scalarPaths = builder(initialOp as string, ops[initialOp], initialZeusQuery);
  if (scalarPaths) {
    const r = traverseResponse({ scalarPaths, resolvers: scalars })(initialOp as string, response, [ops[initialOp]]);
    return r;
  }
  return response;
};

export const traverseResponse = ({
  resolvers,
  scalarPaths,
}: {
  scalarPaths: { [x: string]: `scalar.${string}` };
  resolvers: {
    [x: string]: ScalarResolver | undefined;
  };
}) => {
  const ibb = (k: string, o: InputValueType | VType, p: string[] = []): unknown => {
    if (Array.isArray(o)) {
      return o.map((eachO) => ibb(k, eachO, p));
    }
    if (o == null) {
      return o;
    }
    const scalarPathString = p.join(SEPARATOR);
    const currentScalarString = scalarPaths[scalarPathString];
    if (currentScalarString) {
      const currentDecoder = resolvers[currentScalarString.split('.')[1]]?.decode;
      if (currentDecoder) {
        return currentDecoder(o);
      }
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string' || !o) {
      return o;
    }
    const entries = Object.entries(o).map(([k, v]) => [k, ibb(k, v, [...p, purifyGraphQLKey(k)])] as const);
    const objectFromEntries = entries.reduce<Record<string, unknown>>((a, [k, v]) => {
      a[k] = v;
      return a;
    }, {});
    return objectFromEntries;
  };
  return ibb;
};

export type AllTypesPropsType = {
  [x: string]:
    | undefined
    | `scalar.${string}`
    | 'enum'
    | {
        [x: string]:
          | undefined
          | string
          | {
              [x: string]: string | undefined;
            };
      };
};

export type ReturnTypesType = {
  [x: string]:
    | {
        [x: string]: string | undefined;
      }
    | `scalar.${string}`
    | undefined;
};
export type InputValueType = {
  [x: string]: undefined | boolean | string | number | [any, undefined | boolean | InputValueType] | InputValueType;
};
export type VType =
  | undefined
  | boolean
  | string
  | number
  | [any, undefined | boolean | InputValueType]
  | InputValueType;

export type PlainType = boolean | number | string | null | undefined;
export type ZeusArgsType =
  | PlainType
  | {
      [x: string]: ZeusArgsType;
    }
  | Array<ZeusArgsType>;

export type Operations = Record<string, string>;

export type VariableDefinition = {
  [x: string]: unknown;
};

export const SEPARATOR = '|';

export type fetchOptions = Parameters<typeof fetch>;
type websocketOptions = typeof WebSocket extends new (...args: infer R) => WebSocket ? R : never;
export type chainOptions = [fetchOptions[0], fetchOptions[1] & { websocket?: websocketOptions }] | [fetchOptions[0]];
export type FetchFunction = (query: string, variables?: Record<string, unknown>) => Promise<any>;
export type SubscriptionFunction = (query: string) => any;
type NotUndefined<T> = T extends undefined ? never : T;
export type ResolverType<F> = NotUndefined<F extends [infer ARGS, any] ? ARGS : undefined>;

export type OperationOptions = {
  operationName?: string;
};

export type ScalarCoder = Record<string, (s: unknown) => string>;

export interface GraphQLResponse {
  data?: Record<string, any>;
  errors?: Array<{
    message: string;
  }>;
}
export class GraphQLError extends Error {
  constructor(public response: GraphQLResponse) {
    super('');
    console.error(response);
  }
  toString() {
    return 'GraphQL Response Error';
  }
}
export type GenericOperation<O> = O extends keyof typeof Ops ? typeof Ops[O] : never;
export type ThunderGraphQLOptions<SCLR extends ScalarDefinition> = {
  scalars?: SCLR | ScalarCoders;
};

const ExtractScalar = (mappedParts: string[], returns: ReturnTypesType): `scalar.${string}` | undefined => {
  if (mappedParts.length === 0) {
    return;
  }
  const oKey = mappedParts[0];
  const returnP1 = returns[oKey];
  if (typeof returnP1 === 'object') {
    const returnP2 = returnP1[mappedParts[1]];
    if (returnP2) {
      return ExtractScalar([returnP2, ...mappedParts.slice(2)], returns);
    }
    return undefined;
  }
  return returnP1 as `scalar.${string}` | undefined;
};

export const PrepareScalarPaths = ({ ops, returns }: { returns: ReturnTypesType; ops: Operations }) => {
  const ibb = (
    k: string,
    originalKey: string,
    o: InputValueType | VType,
    p: string[] = [],
    pOriginals: string[] = [],
    root = true,
  ): { [x: string]: `scalar.${string}` } | undefined => {
    if (!o) {
      return;
    }
    if (typeof o === 'boolean' || typeof o === 'number' || typeof o === 'string') {
      const extractionArray = [...pOriginals, originalKey];
      const isScalar = ExtractScalar(extractionArray, returns);
      if (isScalar?.startsWith('scalar')) {
        const partOfTree = {
          [[...p, k].join(SEPARATOR)]: isScalar,
        };
        return partOfTree;
      }
      return {};
    }
    if (Array.isArray(o)) {
      return ibb(k, k, o[1], p, pOriginals, false);
    }
    if (k === '__alias') {
      return Object.entries(o)
        .map(([alias, objectUnderAlias]) => {
          if (typeof objectUnderAlias !== 'object' || Array.isArray(objectUnderAlias)) {
            throw new Error(
              'Invalid alias it should be __alias:{ YOUR_ALIAS_NAME: { OPERATION_NAME: { ...selectors }}}',
            );
          }
          const operationName = Object.keys(objectUnderAlias)[0];
          const operation = objectUnderAlias[operationName];
          return ibb(alias, operationName, operation, p, pOriginals, false);
        })
        .reduce((a, b) => ({
          ...a,
          ...b,
        }));
    }
    const keyName = root ? ops[k] : k;
    return Object.entries(o)
      .filter(([k]) => k !== '__directives')
      .map(([k, v]) => {
        // Inline fragments shouldn't be added to the path as they aren't a field
        const isInlineFragment = originalKey.match(/^...\s*on/) != null;
        return ibb(
          k,
          k,
          v,
          isInlineFragment ? p : [...p, purifyGraphQLKey(keyName || k)],
          isInlineFragment ? pOriginals : [...pOriginals, purifyGraphQLKey(originalKey)],
          false,
        );
      })
      .reduce((a, b) => ({
        ...a,
        ...b,
      }));
  };
  return ibb;
};

export const purifyGraphQLKey = (k: string) => k.replace(/\([^)]*\)/g, '').replace(/^[^:]*\:/g, '');

const mapPart = (p: string) => {
  const [isArg, isField] = p.split('<>');
  if (isField) {
    return {
      v: isField,
      __type: 'field',
    } as const;
  }
  return {
    v: isArg,
    __type: 'arg',
  } as const;
};

type Part = ReturnType<typeof mapPart>;

export const ResolveFromPath = (props: AllTypesPropsType, returns: ReturnTypesType, ops: Operations) => {
  const ResolvePropsType = (mappedParts: Part[]) => {
    const oKey = ops[mappedParts[0].v];
    const propsP1 = oKey ? props[oKey] : props[mappedParts[0].v];
    if (propsP1 === 'enum' && mappedParts.length === 1) {
      return 'enum';
    }
    if (typeof propsP1 === 'string' && propsP1.startsWith('scalar.') && mappedParts.length === 1) {
      return propsP1;
    }
    if (typeof propsP1 === 'object') {
      if (mappedParts.length < 2) {
        return 'not';
      }
      const propsP2 = propsP1[mappedParts[1].v];
      if (typeof propsP2 === 'string') {
        return rpp(
          `${propsP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
      if (typeof propsP2 === 'object') {
        if (mappedParts.length < 3) {
          return 'not';
        }
        const propsP3 = propsP2[mappedParts[2].v];
        if (propsP3 && mappedParts[2].__type === 'arg') {
          return rpp(
            `${propsP3}${SEPARATOR}${mappedParts
              .slice(3)
              .map((mp) => mp.v)
              .join(SEPARATOR)}`,
          );
        }
      }
    }
  };
  const ResolveReturnType = (mappedParts: Part[]) => {
    if (mappedParts.length === 0) {
      return 'not';
    }
    const oKey = ops[mappedParts[0].v];
    const returnP1 = oKey ? returns[oKey] : returns[mappedParts[0].v];
    if (typeof returnP1 === 'object') {
      if (mappedParts.length < 2) return 'not';
      const returnP2 = returnP1[mappedParts[1].v];
      if (returnP2) {
        return rpp(
          `${returnP2}${SEPARATOR}${mappedParts
            .slice(2)
            .map((mp) => mp.v)
            .join(SEPARATOR)}`,
        );
      }
    }
  };
  const rpp = (path: string): 'enum' | 'not' | `scalar.${string}` => {
    const parts = path.split(SEPARATOR).filter((l) => l.length > 0);
    const mappedParts = parts.map(mapPart);
    const propsP1 = ResolvePropsType(mappedParts);
    if (propsP1) {
      return propsP1;
    }
    const returnP1 = ResolveReturnType(mappedParts);
    if (returnP1) {
      return returnP1;
    }
    return 'not';
  };
  return rpp;
};

export const InternalArgsBuilt = ({
  props,
  ops,
  returns,
  scalars,
  vars,
}: {
  props: AllTypesPropsType;
  returns: ReturnTypesType;
  ops: Operations;
  scalars?: ScalarDefinition;
  vars: Array<{ name: string; graphQLType: string }>;
}) => {
  const arb = (a: ZeusArgsType, p = '', root = true): string => {
    if (typeof a === 'string') {
      if (a.startsWith(START_VAR_NAME)) {
        const [varName, graphQLType] = a.replace(START_VAR_NAME, '$').split(GRAPHQL_TYPE_SEPARATOR);
        const v = vars.find((v) => v.name === varName);
        if (!v) {
          vars.push({
            name: varName,
            graphQLType,
          });
        } else {
          if (v.graphQLType !== graphQLType) {
            throw new Error(
              `Invalid variable exists with two different GraphQL Types, "${v.graphQLType}" and ${graphQLType}`,
            );
          }
        }
        return varName;
      }
    }
    const checkType = ResolveFromPath(props, returns, ops)(p);
    if (checkType.startsWith('scalar.')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, ...splittedScalar] = checkType.split('.');
      const scalarKey = splittedScalar.join('.');
      return (scalars?.[scalarKey]?.encode?.(a) as string) || JSON.stringify(a);
    }
    if (Array.isArray(a)) {
      return `[${a.map((arr) => arb(arr, p, false)).join(', ')}]`;
    }
    if (typeof a === 'string') {
      if (checkType === 'enum') {
        return a;
      }
      return `${JSON.stringify(a)}`;
    }
    if (typeof a === 'object') {
      if (a === null) {
        return `null`;
      }
      const returnedObjectString = Object.entries(a)
        .filter(([, v]) => typeof v !== 'undefined')
        .map(([k, v]) => `${k}: ${arb(v, [p, k].join(SEPARATOR), false)}`)
        .join(',\n');
      if (!root) {
        return `{${returnedObjectString}}`;
      }
      return returnedObjectString;
    }
    return `${a}`;
  };
  return arb;
};

export const resolverFor = <X, T extends keyof ResolverInputTypes, Z extends keyof ResolverInputTypes[T]>(
  type: T,
  field: Z,
  fn: (
    args: Required<ResolverInputTypes[T]>[Z] extends [infer Input, any] ? Input : any,
    source: any,
  ) => Z extends keyof ModelTypes[T] ? ModelTypes[T][Z] | Promise<ModelTypes[T][Z]> | X : never,
) => fn as (args?: any, source?: any) => ReturnType<typeof fn>;

export type UnwrapPromise<T> = T extends Promise<infer R> ? R : T;
export type ZeusState<T extends (...args: any[]) => Promise<any>> = NonNullable<UnwrapPromise<ReturnType<T>>>;
export type ZeusHook<
  T extends (...args: any[]) => Record<string, (...args: any[]) => Promise<any>>,
  N extends keyof ReturnType<T>,
> = ZeusState<ReturnType<T>[N]>;

export type WithTypeNameValue<T> = T & {
  __typename?: boolean;
  __directives?: string;
};
export type AliasType<T> = WithTypeNameValue<T> & {
  __alias?: Record<string, WithTypeNameValue<T>>;
};
type DeepAnify<T> = {
  [P in keyof T]?: any;
};
type IsPayLoad<T> = T extends [any, infer PayLoad] ? PayLoad : T;
export type ScalarDefinition = Record<string, ScalarResolver>;

type IsScalar<S, SCLR extends ScalarDefinition> = S extends 'scalar' & { name: infer T }
  ? T extends keyof SCLR
    ? SCLR[T]['decode'] extends (s: unknown) => unknown
      ? ReturnType<SCLR[T]['decode']>
      : unknown
    : unknown
  : S;
type IsArray<T, U, SCLR extends ScalarDefinition> = T extends Array<infer R>
  ? InputType<R, U, SCLR>[]
  : InputType<T, U, SCLR>;
type FlattenArray<T> = T extends Array<infer R> ? R : T;
type BaseZeusResolver = boolean | 1 | string | Variable<any, string>;

type IsInterfaced<SRC extends DeepAnify<DST>, DST, SCLR extends ScalarDefinition> = FlattenArray<SRC> extends
  | ZEUS_INTERFACES
  | ZEUS_UNIONS
  ? {
      [P in keyof SRC]: SRC[P] extends '__union' & infer R
        ? P extends keyof DST
          ? IsArray<R, '__typename' extends keyof DST ? DST[P] & { __typename: true } : DST[P], SCLR>
          : IsArray<R, '__typename' extends keyof DST ? { __typename: true } : Record<string, never>, SCLR>
        : never;
    }[keyof SRC] & {
      [P in keyof Omit<
        Pick<
          SRC,
          {
            [P in keyof DST]: SRC[P] extends '__union' & infer R ? never : P;
          }[keyof DST]
        >,
        '__typename'
      >]: IsPayLoad<DST[P]> extends BaseZeusResolver ? IsScalar<SRC[P], SCLR> : IsArray<SRC[P], DST[P], SCLR>;
    }
  : {
      [P in keyof Pick<SRC, keyof DST>]: IsPayLoad<DST[P]> extends BaseZeusResolver
        ? IsScalar<SRC[P], SCLR>
        : IsArray<SRC[P], DST[P], SCLR>;
    };

export type MapType<SRC, DST, SCLR extends ScalarDefinition> = SRC extends DeepAnify<DST>
  ? IsInterfaced<SRC, DST, SCLR>
  : never;
// eslint-disable-next-line @typescript-eslint/ban-types
export type InputType<SRC, DST, SCLR extends ScalarDefinition = {}> = IsPayLoad<DST> extends { __alias: infer R }
  ? {
      [P in keyof R]: MapType<SRC, R[P], SCLR>[keyof MapType<SRC, R[P], SCLR>];
    } & MapType<SRC, Omit<IsPayLoad<DST>, '__alias'>, SCLR>
  : MapType<SRC, IsPayLoad<DST>, SCLR>;
export type SubscriptionToGraphQL<Z, T, SCLR extends ScalarDefinition> = {
  ws: WebSocket;
  on: (fn: (args: InputType<T, Z, SCLR>) => void) => void;
  off: (fn: (e: { data?: InputType<T, Z, SCLR>; code?: number; reason?: string; message?: string }) => void) => void;
  error: (fn: (e: { data?: InputType<T, Z, SCLR>; errors?: string[] }) => void) => void;
  open: () => void;
};

// eslint-disable-next-line @typescript-eslint/ban-types
export type FromSelector<SELECTOR, NAME extends keyof GraphQLTypes, SCLR extends ScalarDefinition = {}> = InputType<
  GraphQLTypes[NAME],
  SELECTOR,
  SCLR
>;

export type ScalarResolver = {
  encode?: (s: unknown) => string;
  decode?: (s: unknown) => unknown;
};

export type SelectionFunction<V> = <Z extends V>(
  t: Z & {
    [P in keyof Z]: P extends keyof V ? Z[P] : never;
  },
) => Z;

type BuiltInVariableTypes = {
  ['String']: string;
  ['Int']: number;
  ['Float']: number;
  ['ID']: unknown;
  ['Boolean']: boolean;
};
type AllVariableTypes = keyof BuiltInVariableTypes | keyof ZEUS_VARIABLES;
type VariableRequired<T extends string> = `${T}!` | T | `[${T}]` | `[${T}]!` | `[${T}!]` | `[${T}!]!`;
type VR<T extends string> = VariableRequired<VariableRequired<T>>;

export type GraphQLVariableType = VR<AllVariableTypes>;

type ExtractVariableTypeString<T extends string> = T extends VR<infer R1>
  ? R1 extends VR<infer R2>
    ? R2 extends VR<infer R3>
      ? R3 extends VR<infer R4>
        ? R4 extends VR<infer R5>
          ? R5
          : R4
        : R3
      : R2
    : R1
  : T;

type DecomposeType<T, Type> = T extends `[${infer R}]`
  ? Array<DecomposeType<R, Type>> | undefined
  : T extends `${infer R}!`
  ? NonNullable<DecomposeType<R, Type>>
  : Type | undefined;

type ExtractTypeFromGraphQLType<T extends string> = T extends keyof ZEUS_VARIABLES
  ? ZEUS_VARIABLES[T]
  : T extends keyof BuiltInVariableTypes
  ? BuiltInVariableTypes[T]
  : any;

export type GetVariableType<T extends string> = DecomposeType<
  T,
  ExtractTypeFromGraphQLType<ExtractVariableTypeString<T>>
>;

type UndefinedKeys<T> = {
  [K in keyof T]-?: T[K] extends NonNullable<T[K]> ? never : K;
}[keyof T];

type WithNullableKeys<T> = Pick<T, UndefinedKeys<T>>;
type WithNonNullableKeys<T> = Omit<T, UndefinedKeys<T>>;

type OptionalKeys<T> = {
  [P in keyof T]?: T[P];
};

export type WithOptionalNullables<T> = OptionalKeys<WithNullableKeys<T>> & WithNonNullableKeys<T>;

export type Variable<T extends GraphQLVariableType, Name extends string> = {
  ' __zeus_name': Name;
  ' __zeus_type': T;
};

export type ExtractVariablesDeep<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariablesDeep<Query[K]>> }[keyof Query]>;

export type ExtractVariables<Query> = Query extends Variable<infer VType, infer VName>
  ? { [key in VName]: GetVariableType<VType> }
  : Query extends [infer Inputs, infer Outputs]
  ? ExtractVariablesDeep<Inputs> & ExtractVariables<Outputs>
  : Query extends string | number | boolean | Array<string | number | boolean>
  ? // eslint-disable-next-line @typescript-eslint/ban-types
    {}
  : UnionToIntersection<{ [K in keyof Query]: WithOptionalNullables<ExtractVariables<Query[K]>> }[keyof Query]>;

type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export const START_VAR_NAME = `$ZEUS_VAR`;
export const GRAPHQL_TYPE_SEPARATOR = `__$GRAPHQL__`;

export const $ = <Type extends GraphQLVariableType, Name extends string>(name: Name, graphqlType: Type) => {
  return (START_VAR_NAME + name + GRAPHQL_TYPE_SEPARATOR + graphqlType) as unknown as Variable<Type, Name>;
};
type ZEUS_INTERFACES = GraphQLTypes["Node"]
export type ScalarCoders = {
	BigInt?: ScalarResolver;
}
type ZEUS_UNIONS = never

export type ValueTypes = {
    ["Languages"]:Languages;
	["Formality"]:Formality;
	["TranslateInput"]: {
	content: string | Variable<any, string>,
	/** array of languages content needs to be translated to */
	languages: Array<ValueTypes["Languages"]> | Variable<any, string>,
	formality?: ValueTypes["Formality"] | undefined | null | Variable<any, string>,
	/** AI context of the translation used as a global context */
	context?: string | undefined | null | Variable<any, string>,
	/** if not specified it is auto detected */
	inputLanguage?: ValueTypes["Languages"] | undefined | null | Variable<any, string>,
	/** if not specified defaults to json */
	format?: ValueTypes["Format"] | undefined | null | Variable<any, string>,
	/** scope translation cache to individual project rather than account wide */
	projectId?: string | undefined | null | Variable<any, string>,
	omitCache?: boolean | undefined | null | Variable<any, string>
};
	["ApiMutation"]: AliasType<{
translate?: [{	translate: ValueTypes["TranslateInput"] | Variable<any, string>},ValueTypes["TranslationResponse"]],
clearCache?: [{	projectId?: string | undefined | null | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ApiKey"]: AliasType<{
	name?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TranslationSingleResponse"]: AliasType<{
	language?:boolean | `@${string}`,
	result?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TranslationResponse"]: AliasType<{
	results?:ValueTypes["TranslationSingleResponse"],
		__typename?: boolean | `@${string}`
}>;
	["CreateApiKey"]: {
	name: string | Variable<any, string>
};
	["Node"]:AliasType<{
		createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`;
		['...on ApiKey']?: Omit<ValueTypes["ApiKey"],keyof ValueTypes["Node"]>;
		['...on StoredTranslation']?: Omit<ValueTypes["StoredTranslation"],keyof ValueTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["StoredTranslation"]: AliasType<{
	jsonContent?:boolean | `@${string}`,
	results?:ValueTypes["TranslationSingleResponse"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	inputSize?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number | Variable<any, string>,
	start?: number | undefined | null | Variable<any, string>
};
	["PageInfo"]: AliasType<{
	hasNext?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StoredTranslationConnection"]: AliasType<{
	items?:ValueTypes["StoredTranslation"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["UsersConnection"]: AliasType<{
	items?:ValueTypes["User"],
	pageInfo?:ValueTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	/** Size of everything . Works as a number */
["BigInt"]:unknown;
	["Format"]:Format;
	["ApiQuery"]: AliasType<{
predictTranslationCost?: [{	translate: ValueTypes["TranslateInput"] | Variable<any, string>},ValueTypes["PredictionResponse"]],
translations?: [{	page: ValueTypes["PageInput"] | Variable<any, string>},ValueTypes["StoredTranslationConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["PredictionResponse"]: AliasType<{
	cost?:boolean | `@${string}`,
	cached?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AdminQuery"]: AliasType<{
users?: [{	page?: ValueTypes["PageInput"] | undefined | null | Variable<any, string>},ValueTypes["UsersConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["AdminMutation"]: AliasType<{
userOps?: [{	userId: string | Variable<any, string>},ValueTypes["UserOps"]],
		__typename?: boolean | `@${string}`
}>;
	["UserOps"]: AliasType<{
changeUserTokens?: [{	tokens: ValueTypes["BigInt"] | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
	api?:ValueTypes["ApiMutation"],
	users?:ValueTypes["UsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["AuthorizedUserMutation"]: AliasType<{
createApiKey?: [{	apiKey: ValueTypes["CreateApiKey"] | Variable<any, string>},boolean | `@${string}`],
revokeApiKey?: [{	_id: string | Variable<any, string>},boolean | `@${string}`],
	api?:ValueTypes["ApiMutation"],
	admin?:ValueTypes["AdminMutation"],
changePasswordWhenLogged?: [{	changePasswordData: ValueTypes["ChangePasswordWhenLoggedInput"] | Variable<any, string>},ValueTypes["ChangePasswordWhenLoggedResponse"]],
editUser?: [{	updatedUser: ValueTypes["UpdateUserInput"] | Variable<any, string>},ValueTypes["EditUserResponse"]],
integrateSocialAccount?: [{	userData: ValueTypes["SimpleUserInput"] | Variable<any, string>},ValueTypes["IntegrateSocialAccountResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["AuthorizedUserQuery"]: AliasType<{
	apiKeys?:ValueTypes["ApiKey"],
	api?:ValueTypes["ApiQuery"],
	admin?:ValueTypes["AdminQuery"],
	me?:ValueTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
translations?: [{	page: ValueTypes["PageInput"] | Variable<any, string>},ValueTypes["StoredTranslationConnection"]],
	boughtTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	users?:ValueTypes["UsersQuery"],
	api?:ValueTypes["ApiQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersQuery"]: AliasType<{
	user?:ValueTypes["AuthorizedUserQuery"],
	publicUsers?:ValueTypes["PublicUsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersMutation"]: AliasType<{
	user?:ValueTypes["AuthorizedUserMutation"],
	publicUsers?:ValueTypes["PublicUsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicUsersQuery"]: AliasType<{
	login?:ValueTypes["LoginQuery"],
getGoogleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ValueTypes["GetOAuthInput"] | Variable<any, string>},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null | Variable<any, string>,
	state?: string | undefined | null | Variable<any, string>,
	redirectUri?: string | undefined | null | Variable<any, string>
};
	["PublicUsersMutation"]: AliasType<{
register?: [{	user: ValueTypes["RegisterInput"] | Variable<any, string>},ValueTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ValueTypes["VerifyEmailInput"] | Variable<any, string>},ValueTypes["VerifyEmailResponse"]],
changePasswordWithToken?: [{	token: ValueTypes["ChangePasswordWithTokenInput"] | Variable<any, string>},ValueTypes["ChangePasswordWithTokenResponse"]],
generateOAuthToken?: [{	tokenData: ValueTypes["GenerateOAuthTokenInput"] | Variable<any, string>},ValueTypes["GenerateOAuthTokenResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username?: string | undefined | null | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	avatarUrl?: string | undefined | null | Variable<any, string>
};
	["GenerateOAuthTokenInput"]: {
	social: ValueTypes["SocialKind"] | Variable<any, string>,
	code: string | Variable<any, string>
};
	["SimpleUserInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["LoginInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>
};
	["VerifyEmailInput"]: {
	token: string | Variable<any, string>
};
	["ChangePasswordWithTokenInput"]: {
	username: string | Variable<any, string>,
	forgotToken: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string | Variable<any, string>,
	newPassword: string | Variable<any, string>
};
	["RegisterInput"]: {
	username: string | Variable<any, string>,
	password: string | Variable<any, string>,
	fullName?: string | undefined | null | Variable<any, string>,
	invitationToken?: string | undefined | null | Variable<any, string>
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: AliasType<{
password?: [{	user: ValueTypes["LoginInput"] | Variable<any, string>},ValueTypes["LoginResponse"]],
provider?: [{	params: ValueTypes["ProviderLoginInput"] | Variable<any, string>},ValueTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string | Variable<any, string>},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string | Variable<any, string>,
	redirectUri: string | Variable<any, string>
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ValueTypes["ProviderResponse"],
	google?:ValueTypes["ProviderResponse"],
	github?:ValueTypes["ProviderResponse"],
	microsoft?:ValueTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>
  }

export type ResolverInputTypes = {
    ["Languages"]:Languages;
	["Formality"]:Formality;
	["TranslateInput"]: {
	content: string,
	/** array of languages content needs to be translated to */
	languages: Array<ResolverInputTypes["Languages"]>,
	formality?: ResolverInputTypes["Formality"] | undefined | null,
	/** AI context of the translation used as a global context */
	context?: string | undefined | null,
	/** if not specified it is auto detected */
	inputLanguage?: ResolverInputTypes["Languages"] | undefined | null,
	/** if not specified defaults to json */
	format?: ResolverInputTypes["Format"] | undefined | null,
	/** scope translation cache to individual project rather than account wide */
	projectId?: string | undefined | null,
	omitCache?: boolean | undefined | null
};
	["ApiMutation"]: AliasType<{
translate?: [{	translate: ResolverInputTypes["TranslateInput"]},ResolverInputTypes["TranslationResponse"]],
clearCache?: [{	projectId?: string | undefined | null},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ApiKey"]: AliasType<{
	name?:boolean | `@${string}`,
	value?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TranslationSingleResponse"]: AliasType<{
	language?:boolean | `@${string}`,
	result?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["TranslationResponse"]: AliasType<{
	results?:ResolverInputTypes["TranslationSingleResponse"],
		__typename?: boolean | `@${string}`
}>;
	["CreateApiKey"]: {
	name: string
};
	["Node"]:AliasType<{
		createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`;
		['...on ApiKey']?: Omit<ResolverInputTypes["ApiKey"],keyof ResolverInputTypes["Node"]>;
		['...on StoredTranslation']?: Omit<ResolverInputTypes["StoredTranslation"],keyof ResolverInputTypes["Node"]>;
		__typename?: boolean | `@${string}`
}>;
	["StoredTranslation"]: AliasType<{
	jsonContent?:boolean | `@${string}`,
	results?:ResolverInputTypes["TranslationSingleResponse"],
	createdAt?:boolean | `@${string}`,
	_id?:boolean | `@${string}`,
	name?:boolean | `@${string}`,
	inputSize?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["PageInput"]: {
	limit: number,
	start?: number | undefined | null
};
	["PageInfo"]: AliasType<{
	hasNext?:boolean | `@${string}`,
	total?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["StoredTranslationConnection"]: AliasType<{
	items?:ResolverInputTypes["StoredTranslation"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	["UsersConnection"]: AliasType<{
	items?:ResolverInputTypes["User"],
	pageInfo?:ResolverInputTypes["PageInfo"],
		__typename?: boolean | `@${string}`
}>;
	/** Size of everything . Works as a number */
["BigInt"]:unknown;
	["Format"]:Format;
	["ApiQuery"]: AliasType<{
predictTranslationCost?: [{	translate: ResolverInputTypes["TranslateInput"]},ResolverInputTypes["PredictionResponse"]],
translations?: [{	page: ResolverInputTypes["PageInput"]},ResolverInputTypes["StoredTranslationConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["PredictionResponse"]: AliasType<{
	cost?:boolean | `@${string}`,
	cached?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["AdminQuery"]: AliasType<{
users?: [{	page?: ResolverInputTypes["PageInput"] | undefined | null},ResolverInputTypes["UsersConnection"]],
		__typename?: boolean | `@${string}`
}>;
	["AdminMutation"]: AliasType<{
userOps?: [{	userId: string},ResolverInputTypes["UserOps"]],
		__typename?: boolean | `@${string}`
}>;
	["UserOps"]: AliasType<{
changeUserTokens?: [{	tokens: ResolverInputTypes["BigInt"]},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["Mutation"]: AliasType<{
	/** entry point for Weebhooks. */
	webhook?:boolean | `@${string}`,
	api?:ResolverInputTypes["ApiMutation"],
	users?:ResolverInputTypes["UsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["AuthorizedUserMutation"]: AliasType<{
createApiKey?: [{	apiKey: ResolverInputTypes["CreateApiKey"]},boolean | `@${string}`],
revokeApiKey?: [{	_id: string},boolean | `@${string}`],
	api?:ResolverInputTypes["ApiMutation"],
	admin?:ResolverInputTypes["AdminMutation"],
changePasswordWhenLogged?: [{	changePasswordData: ResolverInputTypes["ChangePasswordWhenLoggedInput"]},ResolverInputTypes["ChangePasswordWhenLoggedResponse"]],
editUser?: [{	updatedUser: ResolverInputTypes["UpdateUserInput"]},ResolverInputTypes["EditUserResponse"]],
integrateSocialAccount?: [{	userData: ResolverInputTypes["SimpleUserInput"]},ResolverInputTypes["IntegrateSocialAccountResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["AuthorizedUserQuery"]: AliasType<{
	apiKeys?:ResolverInputTypes["ApiKey"],
	api?:ResolverInputTypes["ApiQuery"],
	admin?:ResolverInputTypes["AdminQuery"],
	me?:ResolverInputTypes["User"],
		__typename?: boolean | `@${string}`
}>;
	["User"]: AliasType<{
	_id?:boolean | `@${string}`,
	consumedTokens?:boolean | `@${string}`,
	username?:boolean | `@${string}`,
	emailConfirmed?:boolean | `@${string}`,
	createdAt?:boolean | `@${string}`,
	fullName?:boolean | `@${string}`,
	avatarUrl?:boolean | `@${string}`,
translations?: [{	page: ResolverInputTypes["PageInput"]},ResolverInputTypes["StoredTranslationConnection"]],
	boughtTokens?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["Query"]: AliasType<{
	users?:ResolverInputTypes["UsersQuery"],
	api?:ResolverInputTypes["ApiQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersQuery"]: AliasType<{
	user?:ResolverInputTypes["AuthorizedUserQuery"],
	publicUsers?:ResolverInputTypes["PublicUsersQuery"],
		__typename?: boolean | `@${string}`
}>;
	["UsersMutation"]: AliasType<{
	user?:ResolverInputTypes["AuthorizedUserMutation"],
	publicUsers?:ResolverInputTypes["PublicUsersMutation"],
		__typename?: boolean | `@${string}`
}>;
	["PublicUsersQuery"]: AliasType<{
	login?:ResolverInputTypes["LoginQuery"],
getGoogleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getMicrosoftOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getGithubOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
getAppleOAuthLink?: [{	setup: ResolverInputTypes["GetOAuthInput"]},boolean | `@${string}`],
requestForForgotPassword?: [{	username: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["PublicUsersMutation"]: AliasType<{
register?: [{	user: ResolverInputTypes["RegisterInput"]},ResolverInputTypes["RegisterResponse"]],
verifyEmail?: [{	verifyData: ResolverInputTypes["VerifyEmailInput"]},ResolverInputTypes["VerifyEmailResponse"]],
changePasswordWithToken?: [{	token: ResolverInputTypes["ChangePasswordWithTokenInput"]},ResolverInputTypes["ChangePasswordWithTokenResponse"]],
generateOAuthToken?: [{	tokenData: ResolverInputTypes["GenerateOAuthTokenInput"]},ResolverInputTypes["GenerateOAuthTokenResponse"]],
		__typename?: boolean | `@${string}`
}>;
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: AliasType<{
	result?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["UpdateUserInput"]: {
	username?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null
};
	["GenerateOAuthTokenInput"]: {
	social: ResolverInputTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	fullName?: string | undefined | null,
	invitationToken?: string | undefined | null
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: AliasType<{
password?: [{	user: ResolverInputTypes["LoginInput"]},ResolverInputTypes["LoginResponse"]],
provider?: [{	params: ResolverInputTypes["ProviderLoginInput"]},ResolverInputTypes["ProviderLoginQuery"]],
refreshToken?: [{	refreshToken: string},boolean | `@${string}`],
		__typename?: boolean | `@${string}`
}>;
	["ProviderLoginInput"]: {
	code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: AliasType<{
	apple?:ResolverInputTypes["ProviderResponse"],
	google?:ResolverInputTypes["ProviderResponse"],
	github?:ResolverInputTypes["ProviderResponse"],
	microsoft?:ResolverInputTypes["ProviderResponse"],
		__typename?: boolean | `@${string}`
}>;
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: AliasType<{
	registered?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["LoginResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["ProviderResponse"]: AliasType<{
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?:boolean | `@${string}`,
	accessToken?:boolean | `@${string}`,
	refreshToken?:boolean | `@${string}`,
	providerAccessToken?:boolean | `@${string}`,
	/** field describes whether this is first login attempt for this username */
	register?:boolean | `@${string}`,
	hasError?:boolean | `@${string}`,
		__typename?: boolean | `@${string}`
}>;
	["schema"]: AliasType<{
	query?:ResolverInputTypes["Query"],
	mutation?:ResolverInputTypes["Mutation"],
		__typename?: boolean | `@${string}`
}>
  }

export type ModelTypes = {
    ["Languages"]:Languages;
	["Formality"]:Formality;
	["TranslateInput"]: {
	content: string,
	/** array of languages content needs to be translated to */
	languages: Array<ModelTypes["Languages"]>,
	formality?: ModelTypes["Formality"] | undefined | null,
	/** AI context of the translation used as a global context */
	context?: string | undefined | null,
	/** if not specified it is auto detected */
	inputLanguage?: ModelTypes["Languages"] | undefined | null,
	/** if not specified defaults to json */
	format?: ModelTypes["Format"] | undefined | null,
	/** scope translation cache to individual project rather than account wide */
	projectId?: string | undefined | null,
	omitCache?: boolean | undefined | null
};
	["ApiMutation"]: {
		translate?: ModelTypes["TranslationResponse"] | undefined | null,
	clearCache?: boolean | undefined | null
};
	["ApiKey"]: {
		name: string,
	value: string,
	createdAt: string,
	_id: string
};
	["TranslationSingleResponse"]: {
		language: ModelTypes["Languages"],
	result: string,
	consumedTokens: ModelTypes["BigInt"]
};
	["TranslationResponse"]: {
		results?: Array<ModelTypes["TranslationSingleResponse"]> | undefined | null
};
	["CreateApiKey"]: {
	name: string
};
	["Node"]: ModelTypes["ApiKey"] | ModelTypes["StoredTranslation"];
	["StoredTranslation"]: {
		jsonContent: string,
	results?: Array<ModelTypes["TranslationSingleResponse"]> | undefined | null,
	createdAt: string,
	_id: string,
	name?: string | undefined | null,
	inputSize: ModelTypes["BigInt"],
	consumedTokens: ModelTypes["BigInt"]
};
	["PageInput"]: {
	limit: number,
	start?: number | undefined | null
};
	["PageInfo"]: {
		hasNext?: boolean | undefined | null,
	total: number
};
	["StoredTranslationConnection"]: {
		items?: Array<ModelTypes["StoredTranslation"]> | undefined | null,
	pageInfo: ModelTypes["PageInfo"]
};
	["UsersConnection"]: {
		items?: Array<ModelTypes["User"]> | undefined | null,
	pageInfo: ModelTypes["PageInfo"]
};
	/** Size of everything . Works as a number */
["BigInt"]:any;
	["Format"]:Format;
	["ApiQuery"]: {
		predictTranslationCost: ModelTypes["PredictionResponse"],
	translations?: ModelTypes["StoredTranslationConnection"] | undefined | null
};
	["PredictionResponse"]: {
		cost: ModelTypes["BigInt"],
	cached: ModelTypes["BigInt"]
};
	["AdminQuery"]: {
		users?: ModelTypes["UsersConnection"] | undefined | null
};
	["AdminMutation"]: {
		userOps?: ModelTypes["UserOps"] | undefined | null
};
	["UserOps"]: {
		changeUserTokens?: boolean | undefined | null
};
	["Mutation"]: {
		/** entry point for Weebhooks. */
	webhook?: string | undefined | null,
	api?: ModelTypes["ApiMutation"] | undefined | null,
	users?: ModelTypes["UsersMutation"] | undefined | null
};
	["AuthorizedUserMutation"]: {
		createApiKey?: string | undefined | null,
	revokeApiKey?: boolean | undefined | null,
	api?: ModelTypes["ApiMutation"] | undefined | null,
	admin?: ModelTypes["AdminMutation"] | undefined | null,
	changePasswordWhenLogged: ModelTypes["ChangePasswordWhenLoggedResponse"],
	editUser: ModelTypes["EditUserResponse"],
	integrateSocialAccount: ModelTypes["IntegrateSocialAccountResponse"]
};
	["AuthorizedUserQuery"]: {
		apiKeys?: Array<ModelTypes["ApiKey"]> | undefined | null,
	api?: ModelTypes["ApiQuery"] | undefined | null,
	admin?: ModelTypes["AdminQuery"] | undefined | null,
	me?: ModelTypes["User"] | undefined | null
};
	["User"]: {
		_id: string,
	consumedTokens?: ModelTypes["BigInt"] | undefined | null,
	username: string,
	emailConfirmed: boolean,
	createdAt?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null,
	translations?: ModelTypes["StoredTranslationConnection"] | undefined | null,
	boughtTokens?: ModelTypes["BigInt"] | undefined | null
};
	["Query"]: {
		users?: ModelTypes["UsersQuery"] | undefined | null,
	api?: ModelTypes["ApiQuery"] | undefined | null
};
	["UsersQuery"]: {
		user?: ModelTypes["AuthorizedUserQuery"] | undefined | null,
	publicUsers?: ModelTypes["PublicUsersQuery"] | undefined | null
};
	["UsersMutation"]: {
		user?: ModelTypes["AuthorizedUserMutation"] | undefined | null,
	publicUsers?: ModelTypes["PublicUsersMutation"] | undefined | null
};
	["PublicUsersQuery"]: {
		login: ModelTypes["LoginQuery"],
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	["GetOAuthInput"]: {
	scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["PublicUsersMutation"]: {
		register: ModelTypes["RegisterResponse"],
	verifyEmail: ModelTypes["VerifyEmailResponse"],
	changePasswordWithToken: ModelTypes["ChangePasswordWithTokenResponse"],
	generateOAuthToken: ModelTypes["GenerateOAuthTokenResponse"]
};
	["EditUserError"]:EditUserError;
	["EditUserResponse"]: {
		result?: boolean | undefined | null,
	hasError?: ModelTypes["EditUserError"] | undefined | null
};
	["VerifyEmailError"]:VerifyEmailError;
	["VerifyEmailResponse"]: {
		result?: boolean | undefined | null,
	hasError?: ModelTypes["VerifyEmailError"] | undefined | null
};
	["ChangePasswordWhenLoggedError"]:ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
		result?: boolean | undefined | null,
	hasError?: ModelTypes["ChangePasswordWhenLoggedError"] | undefined | null
};
	["ChangePasswordWithTokenError"]:ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
		result?: boolean | undefined | null,
	hasError?: ModelTypes["ChangePasswordWithTokenError"] | undefined | null
};
	["SquashAccountsError"]:SquashAccountsError;
	["IntegrateSocialAccountError"]:IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
		result?: boolean | undefined | null,
	hasError?: ModelTypes["IntegrateSocialAccountError"] | undefined | null
};
	["GenerateOAuthTokenError"]:GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
		result?: string | undefined | null,
	hasError?: ModelTypes["GenerateOAuthTokenError"] | undefined | null
};
	["UpdateUserInput"]: {
	username?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null
};
	["GenerateOAuthTokenInput"]: {
	social: ModelTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
	username: string,
	password: string
};
	["LoginInput"]: {
	username: string,
	password: string
};
	["VerifyEmailInput"]: {
	token: string
};
	["ChangePasswordWithTokenInput"]: {
	username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
	oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
	username: string,
	password: string,
	fullName?: string | undefined | null,
	invitationToken?: string | undefined | null
};
	["SocialKind"]:SocialKind;
	["LoginQuery"]: {
		password: ModelTypes["LoginResponse"],
	provider: ModelTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
	code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: {
		apple?: ModelTypes["ProviderResponse"] | undefined | null,
	google?: ModelTypes["ProviderResponse"] | undefined | null,
	github?: ModelTypes["ProviderResponse"] | undefined | null,
	microsoft?: ModelTypes["ProviderResponse"] | undefined | null
};
	["RegisterErrors"]:RegisterErrors;
	["LoginErrors"]:LoginErrors;
	["ProviderErrors"]:ProviderErrors;
	["RegisterResponse"]: {
		registered?: boolean | undefined | null,
	hasError?: ModelTypes["RegisterErrors"] | undefined | null
};
	["LoginResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined | null,
	accessToken?: string | undefined | null,
	refreshToken?: string | undefined | null,
	hasError?: ModelTypes["LoginErrors"] | undefined | null
};
	["ProviderResponse"]: {
		/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined | null,
	accessToken?: string | undefined | null,
	refreshToken?: string | undefined | null,
	providerAccessToken?: string | undefined | null,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined | null,
	hasError?: ModelTypes["ProviderErrors"] | undefined | null
};
	["schema"]: {
	query?: ModelTypes["Query"] | undefined | null,
	mutation?: ModelTypes["Mutation"] | undefined | null
}
    }

export type GraphQLTypes = {
    ["Languages"]: Languages;
	["Formality"]: Formality;
	["TranslateInput"]: {
		content: string,
	/** array of languages content needs to be translated to */
	languages: Array<GraphQLTypes["Languages"]>,
	formality?: GraphQLTypes["Formality"] | undefined | null,
	/** AI context of the translation used as a global context */
	context?: string | undefined | null,
	/** if not specified it is auto detected */
	inputLanguage?: GraphQLTypes["Languages"] | undefined | null,
	/** if not specified defaults to json */
	format?: GraphQLTypes["Format"] | undefined | null,
	/** scope translation cache to individual project rather than account wide */
	projectId?: string | undefined | null,
	omitCache?: boolean | undefined | null
};
	["ApiMutation"]: {
	__typename: "ApiMutation",
	translate?: GraphQLTypes["TranslationResponse"] | undefined | null,
	clearCache?: boolean | undefined | null
};
	["ApiKey"]: {
	__typename: "ApiKey",
	name: string,
	value: string,
	createdAt: string,
	_id: string
};
	["TranslationSingleResponse"]: {
	__typename: "TranslationSingleResponse",
	language: GraphQLTypes["Languages"],
	result: string,
	consumedTokens: GraphQLTypes["BigInt"]
};
	["TranslationResponse"]: {
	__typename: "TranslationResponse",
	results?: Array<GraphQLTypes["TranslationSingleResponse"]> | undefined | null
};
	["CreateApiKey"]: {
		name: string
};
	["Node"]: {
	__typename:"ApiKey" | "StoredTranslation",
	createdAt: string,
	_id: string
	['...on ApiKey']: '__union' & GraphQLTypes["ApiKey"];
	['...on StoredTranslation']: '__union' & GraphQLTypes["StoredTranslation"];
};
	["StoredTranslation"]: {
	__typename: "StoredTranslation",
	jsonContent: string,
	results?: Array<GraphQLTypes["TranslationSingleResponse"]> | undefined | null,
	createdAt: string,
	_id: string,
	name?: string | undefined | null,
	inputSize: GraphQLTypes["BigInt"],
	consumedTokens: GraphQLTypes["BigInt"]
};
	["PageInput"]: {
		limit: number,
	start?: number | undefined | null
};
	["PageInfo"]: {
	__typename: "PageInfo",
	hasNext?: boolean | undefined | null,
	total: number
};
	["StoredTranslationConnection"]: {
	__typename: "StoredTranslationConnection",
	items?: Array<GraphQLTypes["StoredTranslation"]> | undefined | null,
	pageInfo: GraphQLTypes["PageInfo"]
};
	["UsersConnection"]: {
	__typename: "UsersConnection",
	items?: Array<GraphQLTypes["User"]> | undefined | null,
	pageInfo: GraphQLTypes["PageInfo"]
};
	/** Size of everything . Works as a number */
["BigInt"]: "scalar" & { name: "BigInt" };
	["Format"]: Format;
	["ApiQuery"]: {
	__typename: "ApiQuery",
	predictTranslationCost: GraphQLTypes["PredictionResponse"],
	translations?: GraphQLTypes["StoredTranslationConnection"] | undefined | null
};
	["PredictionResponse"]: {
	__typename: "PredictionResponse",
	cost: GraphQLTypes["BigInt"],
	cached: GraphQLTypes["BigInt"]
};
	["AdminQuery"]: {
	__typename: "AdminQuery",
	users?: GraphQLTypes["UsersConnection"] | undefined | null
};
	["AdminMutation"]: {
	__typename: "AdminMutation",
	userOps?: GraphQLTypes["UserOps"] | undefined | null
};
	["UserOps"]: {
	__typename: "UserOps",
	changeUserTokens?: boolean | undefined | null
};
	["Mutation"]: {
	__typename: "Mutation",
	/** entry point for Weebhooks. */
	webhook?: string | undefined | null,
	api?: GraphQLTypes["ApiMutation"] | undefined | null,
	users?: GraphQLTypes["UsersMutation"] | undefined | null
};
	["AuthorizedUserMutation"]: {
	__typename: "AuthorizedUserMutation",
	createApiKey?: string | undefined | null,
	revokeApiKey?: boolean | undefined | null,
	api?: GraphQLTypes["ApiMutation"] | undefined | null,
	admin?: GraphQLTypes["AdminMutation"] | undefined | null,
	changePasswordWhenLogged: GraphQLTypes["ChangePasswordWhenLoggedResponse"],
	editUser: GraphQLTypes["EditUserResponse"],
	integrateSocialAccount: GraphQLTypes["IntegrateSocialAccountResponse"]
};
	["AuthorizedUserQuery"]: {
	__typename: "AuthorizedUserQuery",
	apiKeys?: Array<GraphQLTypes["ApiKey"]> | undefined | null,
	api?: GraphQLTypes["ApiQuery"] | undefined | null,
	admin?: GraphQLTypes["AdminQuery"] | undefined | null,
	me?: GraphQLTypes["User"] | undefined | null
};
	["User"]: {
	__typename: "User",
	_id: string,
	consumedTokens?: GraphQLTypes["BigInt"] | undefined | null,
	username: string,
	emailConfirmed: boolean,
	createdAt?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null,
	translations?: GraphQLTypes["StoredTranslationConnection"] | undefined | null,
	boughtTokens?: GraphQLTypes["BigInt"] | undefined | null
};
	["Query"]: {
	__typename: "Query",
	users?: GraphQLTypes["UsersQuery"] | undefined | null,
	api?: GraphQLTypes["ApiQuery"] | undefined | null
};
	["UsersQuery"]: {
	__typename: "UsersQuery",
	user?: GraphQLTypes["AuthorizedUserQuery"] | undefined | null,
	publicUsers?: GraphQLTypes["PublicUsersQuery"] | undefined | null
};
	["UsersMutation"]: {
	__typename: "UsersMutation",
	user?: GraphQLTypes["AuthorizedUserMutation"] | undefined | null,
	publicUsers?: GraphQLTypes["PublicUsersMutation"] | undefined | null
};
	["PublicUsersQuery"]: {
	__typename: "PublicUsersQuery",
	login: GraphQLTypes["LoginQuery"],
	getGoogleOAuthLink: string,
	getMicrosoftOAuthLink: string,
	getGithubOAuthLink: string,
	getAppleOAuthLink: string,
	requestForForgotPassword: boolean
};
	["GetOAuthInput"]: {
		scopes?: Array<string> | undefined | null,
	state?: string | undefined | null,
	redirectUri?: string | undefined | null
};
	["PublicUsersMutation"]: {
	__typename: "PublicUsersMutation",
	register: GraphQLTypes["RegisterResponse"],
	verifyEmail: GraphQLTypes["VerifyEmailResponse"],
	changePasswordWithToken: GraphQLTypes["ChangePasswordWithTokenResponse"],
	generateOAuthToken: GraphQLTypes["GenerateOAuthTokenResponse"]
};
	["EditUserError"]: EditUserError;
	["EditUserResponse"]: {
	__typename: "EditUserResponse",
	result?: boolean | undefined | null,
	hasError?: GraphQLTypes["EditUserError"] | undefined | null
};
	["VerifyEmailError"]: VerifyEmailError;
	["VerifyEmailResponse"]: {
	__typename: "VerifyEmailResponse",
	result?: boolean | undefined | null,
	hasError?: GraphQLTypes["VerifyEmailError"] | undefined | null
};
	["ChangePasswordWhenLoggedError"]: ChangePasswordWhenLoggedError;
	["ChangePasswordWhenLoggedResponse"]: {
	__typename: "ChangePasswordWhenLoggedResponse",
	result?: boolean | undefined | null,
	hasError?: GraphQLTypes["ChangePasswordWhenLoggedError"] | undefined | null
};
	["ChangePasswordWithTokenError"]: ChangePasswordWithTokenError;
	["ChangePasswordWithTokenResponse"]: {
	__typename: "ChangePasswordWithTokenResponse",
	result?: boolean | undefined | null,
	hasError?: GraphQLTypes["ChangePasswordWithTokenError"] | undefined | null
};
	["SquashAccountsError"]: SquashAccountsError;
	["IntegrateSocialAccountError"]: IntegrateSocialAccountError;
	["IntegrateSocialAccountResponse"]: {
	__typename: "IntegrateSocialAccountResponse",
	result?: boolean | undefined | null,
	hasError?: GraphQLTypes["IntegrateSocialAccountError"] | undefined | null
};
	["GenerateOAuthTokenError"]: GenerateOAuthTokenError;
	["GenerateOAuthTokenResponse"]: {
	__typename: "GenerateOAuthTokenResponse",
	result?: string | undefined | null,
	hasError?: GraphQLTypes["GenerateOAuthTokenError"] | undefined | null
};
	["UpdateUserInput"]: {
		username?: string | undefined | null,
	fullName?: string | undefined | null,
	avatarUrl?: string | undefined | null
};
	["GenerateOAuthTokenInput"]: {
		social: GraphQLTypes["SocialKind"],
	code: string
};
	["SimpleUserInput"]: {
		username: string,
	password: string
};
	["LoginInput"]: {
		username: string,
	password: string
};
	["VerifyEmailInput"]: {
		token: string
};
	["ChangePasswordWithTokenInput"]: {
		username: string,
	forgotToken: string,
	newPassword: string
};
	["ChangePasswordWhenLoggedInput"]: {
		oldPassword: string,
	newPassword: string
};
	["RegisterInput"]: {
		username: string,
	password: string,
	fullName?: string | undefined | null,
	invitationToken?: string | undefined | null
};
	["SocialKind"]: SocialKind;
	["LoginQuery"]: {
	__typename: "LoginQuery",
	password: GraphQLTypes["LoginResponse"],
	provider: GraphQLTypes["ProviderLoginQuery"],
	/** endpoint for refreshing accessToken based on refreshToken */
	refreshToken: string
};
	["ProviderLoginInput"]: {
		code: string,
	redirectUri: string
};
	["ProviderLoginQuery"]: {
	__typename: "ProviderLoginQuery",
	apple?: GraphQLTypes["ProviderResponse"] | undefined | null,
	google?: GraphQLTypes["ProviderResponse"] | undefined | null,
	github?: GraphQLTypes["ProviderResponse"] | undefined | null,
	microsoft?: GraphQLTypes["ProviderResponse"] | undefined | null
};
	["RegisterErrors"]: RegisterErrors;
	["LoginErrors"]: LoginErrors;
	["ProviderErrors"]: ProviderErrors;
	["RegisterResponse"]: {
	__typename: "RegisterResponse",
	registered?: boolean | undefined | null,
	hasError?: GraphQLTypes["RegisterErrors"] | undefined | null
};
	["LoginResponse"]: {
	__typename: "LoginResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	login?: string | undefined | null,
	accessToken?: string | undefined | null,
	refreshToken?: string | undefined | null,
	hasError?: GraphQLTypes["LoginErrors"] | undefined | null
};
	["ProviderResponse"]: {
	__typename: "ProviderResponse",
	/** same value as accessToken, for delete in future, 
improvise, adapt, overcome, frontend! */
	jwt?: string | undefined | null,
	accessToken?: string | undefined | null,
	refreshToken?: string | undefined | null,
	providerAccessToken?: string | undefined | null,
	/** field describes whether this is first login attempt for this username */
	register?: boolean | undefined | null,
	hasError?: GraphQLTypes["ProviderErrors"] | undefined | null
}
    }
export enum Languages {
	ENUS = "ENUS",
	ENGB = "ENGB",
	CS = "CS",
	RU = "RU",
	ET = "ET",
	ES = "ES",
	ZH = "ZH",
	SK = "SK",
	SL = "SL",
	IT = "IT",
	JA = "JA",
	ID = "ID",
	SV = "SV",
	KO = "KO",
	TR = "TR",
	PTBR = "PTBR",
	PTPT = "PTPT",
	EL = "EL",
	DA = "DA",
	FR = "FR",
	BG = "BG",
	LT = "LT",
	DE = "DE",
	LV = "LV",
	NB = "NB",
	NL = "NL",
	PL = "PL",
	FI = "FI",
	UK = "UK",
	RO = "RO",
	HU = "HU"
}
export enum Formality {
	less = "less",
	more = "more",
	default = "default",
	prefer_less = "prefer_less",
	prefer_more = "prefer_more"
}
export enum Format {
	json = "json",
	xml = "xml"
}
export enum EditUserError {
	USERNAME_ALREADY_TAKEN = "USERNAME_ALREADY_TAKEN",
	FAILED_MONGO_UPDATE = "FAILED_MONGO_UPDATE",
	USER_DOES_NOT_EXIST = "USER_DOES_NOT_EXIST"
}
export enum VerifyEmailError {
	TOKEN_CANNOT_BE_FOUND = "TOKEN_CANNOT_BE_FOUND"
}
export enum ChangePasswordWhenLoggedError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	OLD_PASSWORD_IS_INVALID = "OLD_PASSWORD_IS_INVALID",
	PASSWORD_WEAK = "PASSWORD_WEAK"
}
export enum ChangePasswordWithTokenError {
	CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL = "CANNOT_CHANGE_PASSWORD_FOR_USER_REGISTERED_VIA_SOCIAL",
	TOKEN_IS_INVALID = "TOKEN_IS_INVALID",
	PASSWORD_IS_TOO_WEAK = "PASSWORD_IS_TOO_WEAK"
}
export enum SquashAccountsError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNTS_DO_NOT_HAVE_CONFIRMED_EMAIL",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD"
}
export enum IntegrateSocialAccountError {
	YOU_HAVE_ONLY_ONE_ACCOUNT = "YOU_HAVE_ONLY_ONE_ACCOUNT",
	YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE = "YOUR_ACCOUNT_DOES_NOT_HANDLE_CHANGE_PASSWORD_MODE",
	INCORRECT_PASSWORD = "INCORRECT_PASSWORD",
	CANNOT_FIND_USER = "CANNOT_FIND_USER",
	YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL = "YOUR_ACCOUNT_DOES_NOT_HAVE_CONFIRMED_EMAIL"
}
export enum GenerateOAuthTokenError {
	TOKEN_NOT_GENERATED = "TOKEN_NOT_GENERATED",
	CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIEVE_USER_INFORMATION_FROM_APPLE"
}
export enum SocialKind {
	Google = "Google",
	Github = "Github",
	Apple = "Apple",
	Microsoft = "Microsoft"
}
export enum RegisterErrors {
	USERNAME_EXISTS = "USERNAME_EXISTS",
	PASSWORD_WEAK = "PASSWORD_WEAK",
	INVITE_DOMAIN_INCORRECT = "INVITE_DOMAIN_INCORRECT",
	LINK_EXPIRED = "LINK_EXPIRED",
	USERNAME_INVALID = "USERNAME_INVALID"
}
export enum LoginErrors {
	CONFIRM_EMAIL_BEFOR_LOGIN = "CONFIRM_EMAIL_BEFOR_LOGIN",
	INVALID_LOGIN_OR_PASSWORD = "INVALID_LOGIN_OR_PASSWORD",
	CANNOT_FIND_CONNECTED_USER = "CANNOT_FIND_CONNECTED_USER",
	YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL = "YOU_PROVIDED_OTHER_METHOD_OF_LOGIN_ON_THIS_EMAIL",
	UNEXPECTED_ERROR = "UNEXPECTED_ERROR"
}
export enum ProviderErrors {
	CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN = "CANNOT_RETRIVE_PROFILE_FROM_GOOGLE_TRY_REFRESH_TOKEN",
	CANNOT_FIND_EMAIL_FOR_THIS_PROFIL = "CANNOT_FIND_EMAIL_FOR_THIS_PROFIL",
	CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE = "CANNOT_RETRIVE_USER_INFORMATION_FROM_APPLE",
	CODE_IS_NOT_EXIST_IN_ARGS = "CODE_IS_NOT_EXIST_IN_ARGS",
	CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN = "CANNOT_RETRIVE_SUB_FIELD_FROM_JWT_TOKEN",
	CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT = "CANNOT_RETRIVE_TOKEN_FROM_MICROSOFT"
}

type ZEUS_VARIABLES = {
	["Languages"]: ValueTypes["Languages"];
	["Formality"]: ValueTypes["Formality"];
	["TranslateInput"]: ValueTypes["TranslateInput"];
	["CreateApiKey"]: ValueTypes["CreateApiKey"];
	["PageInput"]: ValueTypes["PageInput"];
	["BigInt"]: ValueTypes["BigInt"];
	["Format"]: ValueTypes["Format"];
	["GetOAuthInput"]: ValueTypes["GetOAuthInput"];
	["EditUserError"]: ValueTypes["EditUserError"];
	["VerifyEmailError"]: ValueTypes["VerifyEmailError"];
	["ChangePasswordWhenLoggedError"]: ValueTypes["ChangePasswordWhenLoggedError"];
	["ChangePasswordWithTokenError"]: ValueTypes["ChangePasswordWithTokenError"];
	["SquashAccountsError"]: ValueTypes["SquashAccountsError"];
	["IntegrateSocialAccountError"]: ValueTypes["IntegrateSocialAccountError"];
	["GenerateOAuthTokenError"]: ValueTypes["GenerateOAuthTokenError"];
	["UpdateUserInput"]: ValueTypes["UpdateUserInput"];
	["GenerateOAuthTokenInput"]: ValueTypes["GenerateOAuthTokenInput"];
	["SimpleUserInput"]: ValueTypes["SimpleUserInput"];
	["LoginInput"]: ValueTypes["LoginInput"];
	["VerifyEmailInput"]: ValueTypes["VerifyEmailInput"];
	["ChangePasswordWithTokenInput"]: ValueTypes["ChangePasswordWithTokenInput"];
	["ChangePasswordWhenLoggedInput"]: ValueTypes["ChangePasswordWhenLoggedInput"];
	["RegisterInput"]: ValueTypes["RegisterInput"];
	["SocialKind"]: ValueTypes["SocialKind"];
	["ProviderLoginInput"]: ValueTypes["ProviderLoginInput"];
	["RegisterErrors"]: ValueTypes["RegisterErrors"];
	["LoginErrors"]: ValueTypes["LoginErrors"];
	["ProviderErrors"]: ValueTypes["ProviderErrors"];
}