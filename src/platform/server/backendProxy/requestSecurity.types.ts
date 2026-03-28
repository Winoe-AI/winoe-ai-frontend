export type ProxyMethod = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type MethodRule = {
  pattern: RegExp;
  methods: readonly ProxyMethod[];
};
