/* tslint:disable */
/* eslint-disable */
export function run_wasm(code: string, opts: any): Promise<any>;
export function get_help_doc(): string;
export function get_wq_ver(): string;
export function get_builtins(): string;
export function get_err_codes(): string;
export class WqSession {
  free(): void;
  constructor();
  push_stdin(lines: any): void;
  set_stdout(stdout: any): void;
  set_stderr(stderr: any): void;
  eval(code: string, opts: any): Promise<any>;
  set_debug(n: number): number;
  get_env(): string;
  clear_env(): void;
  set_box_mode(): boolean;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly run_wasm: (a: number, b: number, c: any) => any;
  readonly __wbg_wqsession_free: (a: number, b: number) => void;
  readonly wqsession_new: () => number;
  readonly wqsession_push_stdin: (a: number, b: any) => void;
  readonly wqsession_set_stdout: (a: number, b: any) => void;
  readonly wqsession_set_stderr: (a: number, b: any) => void;
  readonly wqsession_eval: (a: number, b: number, c: number, d: any) => any;
  readonly wqsession_set_debug: (a: number, b: number) => number;
  readonly wqsession_get_env: (a: number) => [number, number];
  readonly wqsession_clear_env: (a: number) => void;
  readonly wqsession_set_box_mode: (a: number) => number;
  readonly get_help_doc: () => [number, number];
  readonly get_wq_ver: () => [number, number];
  readonly get_builtins: () => [number, number];
  readonly get_err_codes: () => [number, number];
  readonly __wbindgen_exn_store: (a: number) => void;
  readonly __externref_table_alloc: () => number;
  readonly __wbindgen_export_2: WebAssembly.Table;
  readonly __wbindgen_export_3: WebAssembly.Table;
  readonly __wbindgen_malloc: (a: number, b: number) => number;
  readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_free: (a: number, b: number, c: number) => void;
  readonly closure280_externref_shim: (a: number, b: number, c: any) => void;
  readonly closure297_externref_shim: (a: number, b: number, c: any, d: any) => void;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
