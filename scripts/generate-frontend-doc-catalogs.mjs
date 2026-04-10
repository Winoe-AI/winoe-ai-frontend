#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const docsDir = path.join(root, 'docs', 'frontend');

function toPosix(value) {
  return value.split(path.sep).join('/');
}

function relFromRoot(absPath) {
  return toPosix(path.relative(root, absPath));
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(abs)));
    } else {
      out.push(abs);
    }
  }
  return out;
}

function splitCamel(value) {
  return value
    .replace(/\.[^.]+$/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\[\]]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function inferAudience(relPath) {
  const candidate = relPath.includes('/candidate/');
  const talent_partner = relPath.includes('/talent_partner/');
  if (candidate && talent_partner) return 'both';
  if (candidate) return 'candidate';
  if (talent - partner) return 'talent_partner';
  if (
    relPath.includes('/auth/') ||
    relPath.includes('/marketing/') ||
    relPath.startsWith('src/shared/') ||
    relPath.startsWith('src/app/')
  ) {
    return 'both';
  }
  return 'Purpose unclear — needs review';
}

function inferLayer(relPath) {
  if (relPath.startsWith('src/app/')) {
    if (relPath.endsWith('/page.tsx')) return 'page';
    if (relPath.endsWith('/layout.tsx')) return 'layout';
    if (relPath.endsWith('/loading.tsx')) return 'loading-state';
    return 'app-shell';
  }
  if (relPath.startsWith('src/features/')) return 'feature';
  if (relPath.startsWith('src/shared/')) return 'shared';
  return 'Purpose unclear — needs review';
}

function inferComponentPurpose(relPath) {
  const base = path.basename(relPath);
  if (base === 'page.tsx') {
    const route = relPath
      .replace(/^src\/app\//, '/')
      .replace(/\/page\.tsx$/, '')
      .replace(/\/(\([^/]+\))/g, '')
      .replace(/\/+/g, '/');
    return `Route entry for \`${route || '/'}\`.`;
  }
  if (base === 'layout.tsx')
    return 'Layout wrapper for nested routes/components.';
  if (base === 'loading.tsx')
    return 'Loading placeholder while route data resolves.';
  if (base === 'global-error.tsx')
    return 'Global error boundary UI for unhandled route errors.';

  const raw = splitCamel(base);
  if (!raw || raw.toLowerCase() === 'index') {
    return 'Purpose unclear — needs review';
  }
  return `Renders ${raw.toLowerCase()} UI.`;
}

function countAnyUsage(content) {
  const matches = content.match(/(:\s*any\b|<\s*any\s*>|\bas any\b)/g);
  return matches ? matches.length : 0;
}

function extractBlockFromOpenBrace(content, openBraceIndex) {
  let depth = 0;
  for (let i = openBraceIndex; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '{') depth += 1;
    if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return content.slice(openBraceIndex + 1, i);
      }
    }
  }
  return null;
}

function parsePropTypeBlocks(content) {
  const map = new Map();
  const headerRe = /(?:type|interface)\s+([A-Za-z0-9_]+Props)\s*(?:=\s*)?\{/g;
  let match = headerRe.exec(content);
  while (match) {
    const typeName = match[1];
    const openIndex = headerRe.lastIndex - 1;
    const block = extractBlockFromOpenBrace(content, openIndex);
    if (block) {
      const required = [];
      const optional = [];
      const fieldRe = /^\s*([A-Za-z0-9_]+)(\?)?\s*:/gm;
      let fieldMatch = fieldRe.exec(block);
      while (fieldMatch) {
        if (fieldMatch[2] === '?') optional.push(fieldMatch[1]);
        else required.push(fieldMatch[1]);
        fieldMatch = fieldRe.exec(block);
      }
      map.set(typeName, {
        required,
        optional,
      });
    }
    match = headerRe.exec(content);
  }
  return map;
}

function splitTopLevelCsv(value) {
  const result = [];
  let current = '';
  let paren = 0;
  let brace = 0;
  let bracket = 0;
  for (let i = 0; i < value.length; i += 1) {
    const ch = value[i];
    if (ch === '(') paren += 1;
    if (ch === ')') paren -= 1;
    if (ch === '{') brace += 1;
    if (ch === '}') brace -= 1;
    if (ch === '[') bracket += 1;
    if (ch === ']') bracket -= 1;
    if (ch === ',' && paren === 0 && brace === 0 && bracket === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) result.push(current.trim());
  return result;
}

function parseDestructuredPropNames(value) {
  const cleaned = value.replace(/^\{/, '').replace(/\}$/, '').trim();
  if (!cleaned) return { names: [], defaulted: [] };
  const names = [];
  const defaulted = [];
  const chunks = splitTopLevelCsv(cleaned);
  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('...')) {
      names.push(trimmed.replace(/^\.\.\./, '').trim());
      continue;
    }
    const eqIndex = trimmed.indexOf('=');
    const beforeDefault =
      eqIndex >= 0 ? trimmed.slice(0, eqIndex).trim() : trimmed;
    const left = beforeDefault.split(':')[0].trim();
    if (!left) continue;
    names.push(left);
    if (eqIndex >= 0) defaulted.push(left);
  }
  return { names, defaulted };
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function parseInlineTypeFields(typeLiteral) {
  const required = [];
  const optional = [];
  const fieldRe = /([A-Za-z0-9_]+)(\?)?\s*:/g;
  let match = fieldRe.exec(typeLiteral);
  while (match) {
    if (match[2] === '?') optional.push(match[1]);
    else required.push(match[1]);
    match = fieldRe.exec(typeLiteral);
  }
  return { required, optional };
}

function parseExportedComponents(content) {
  const items = [];

  const fnRe =
    /export\s+(default\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g;
  let fnMatch = fnRe.exec(content);
  while (fnMatch) {
    items.push({
      isDefault: Boolean(fnMatch[1]),
      name: fnMatch[2],
      params: fnMatch[3],
      index: fnMatch.index,
    });
    fnMatch = fnRe.exec(content);
  }

  const constRe =
    /export\s+(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/g;
  let constMatch = constRe.exec(content);
  while (constMatch) {
    const name = constMatch[1];
    if (/^[A-Z]/.test(name)) {
      items.push({
        isDefault: false,
        name,
        params: constMatch[2],
        index: constMatch.index,
      });
    }
    constMatch = constRe.exec(content);
  }

  return items;
}

function resolvePropsInfo(content, component) {
  if (!component) {
    return {
      propsSummary: 'Purpose unclear — needs review',
      required: 'Purpose unclear — needs review',
      optional: 'Purpose unclear — needs review',
      defaulted: 'Purpose unclear — needs review',
    };
  }

  const propTypes = parsePropTypeBlocks(content);
  const rawParams = normalizeWhitespace(component.params);
  if (!rawParams || rawParams === ' ') {
    return {
      propsSummary: 'No props.',
      required: 'none',
      optional: 'none',
      defaulted: 'none',
    };
  }

  const firstParam = splitTopLevelCsv(rawParams)[0] ?? '';
  if (!firstParam) {
    return {
      propsSummary: 'No props.',
      required: 'none',
      optional: 'none',
      defaulted: 'none',
    };
  }

  if (firstParam.startsWith('{')) {
    const closeBrace = firstParam.lastIndexOf('}');
    const destructured =
      closeBrace >= 0 ? firstParam.slice(0, closeBrace + 1) : firstParam;
    const afterBrace =
      closeBrace >= 0 ? firstParam.slice(closeBrace + 1).trim() : '';
    const { names, defaulted } = parseDestructuredPropNames(destructured);

    let required = [];
    let optional = [];

    const typedNameMatch = afterBrace.match(/^:\s*([A-Za-z0-9_]+)\s*$/);
    const inlineTypeMatch = afterBrace.match(/^:\s*(\{[\s\S]*\})\s*$/);
    if (typedNameMatch && propTypes.has(typedNameMatch[1])) {
      const data = propTypes.get(typedNameMatch[1]);
      required = data.required;
      optional = data.optional;
    } else if (inlineTypeMatch) {
      const data = parseInlineTypeFields(inlineTypeMatch[1]);
      required = data.required;
      optional = data.optional;
    }

    return {
      propsSummary: names.length
        ? `Props: ${names.join(', ')}`
        : 'Destructured props (unable to resolve names).',
      required: required.length ? required.join(', ') : 'none/implicit',
      optional: optional.length ? optional.join(', ') : 'none/implicit',
      defaulted: defaulted.length ? defaulted.join(', ') : 'none',
    };
  }

  const typedParamMatch = firstParam.match(
    /^([A-Za-z0-9_]+)\s*:\s*([A-Za-z0-9_]+)$/,
  );
  if (typedParamMatch) {
    const typeName = typedParamMatch[2];
    if (propTypes.has(typeName)) {
      const data = propTypes.get(typeName);
      return {
        propsSummary: `Typed props object: ${typedParamMatch[1]} (${typeName})`,
        required: data.required.length ? data.required.join(', ') : 'none',
        optional: data.optional.length ? data.optional.join(', ') : 'none',
        defaulted: 'none',
      };
    }
    return {
      propsSummary: `Typed props object: ${typedParamMatch[1]} (${typeName})`,
      required: 'Purpose unclear — needs review',
      optional: 'Purpose unclear — needs review',
      defaulted: 'none',
    };
  }

  return {
    propsSummary: `Param signature: ${firstParam}`,
    required: 'Purpose unclear — needs review',
    optional: 'Purpose unclear — needs review',
    defaulted: 'Purpose unclear — needs review',
  };
}

function markdownEscape(value) {
  return value.replace(/\\/g, '\\\\').replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function pickPrimaryComponent(content, components) {
  if (components.length === 0) return null;
  const defaultByNameMatch = content.match(
    /export\s+default\s+function\s+([A-Za-z0-9_]+)/,
  );
  if (defaultByNameMatch) {
    const named = components.find(
      (item) => item.name === defaultByNameMatch[1],
    );
    if (named) return named;
  }
  const explicitDefault = components.find((item) => item.isDefault);
  if (explicitDefault) return explicitDefault;
  return components[0];
}

function generateComponentsCatalog(tsxFiles, contentByFile) {
  const rows = [];

  for (const absPath of tsxFiles) {
    const relPath = relFromRoot(absPath);
    const content = contentByFile.get(absPath) ?? '';
    const components = parseExportedComponents(content);
    const primary = pickPrimaryComponent(content, components);
    const propsInfo = resolvePropsInfo(content, primary);
    const anyCount = countAnyUsage(content);

    rows.push({
      file: relPath,
      audience: inferAudience(relPath),
      layer: inferLayer(relPath),
      purpose: inferComponentPurpose(relPath),
      props: propsInfo.propsSummary,
      required: propsInfo.required,
      optional: propsInfo.optional,
      defaulted: propsInfo.defaulted,
      anyFindings: anyCount > 0 ? `${anyCount} explicit any usage(s)` : 'none',
    });
  }

  rows.sort((a, b) => a.file.localeCompare(b.file));

  const lines = [];
  lines.push('# Components Catalog');
  lines.push('');
  lines.push(
    'Generated from `src/**/*.tsx`. This file is the source-of-truth catalog for component/page modules while inline comments remain disallowed.',
  );
  lines.push('');
  lines.push(
    '| File | Audience | Layer | Purpose | Props Summary | Required Props | Optional Props | Defaulted Props | `any` Findings |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const row of rows) {
    lines.push(
      `| \`${markdownEscape(row.file)}\` | ${markdownEscape(row.audience)} | ${markdownEscape(row.layer)} | ${markdownEscape(row.purpose)} | ${markdownEscape(row.props)} | ${markdownEscape(row.required)} | ${markdownEscape(row.optional)} | ${markdownEscape(row.defaulted)} | ${markdownEscape(row.anyFindings)} |`,
    );
  }

  lines.push('');
  lines.push('Notes:');
  lines.push(
    '- `Purpose unclear — needs review` marks entries that could not be inferred confidently from names/signatures alone.',
  );
  lines.push(
    '- `Required/optional/defaulted` values are static extraction hints; verify complex generic/conditional props directly in source when editing behavior.',
  );

  return `${lines.join('\n')}\n`;
}

function skipQuotedOrComment(content, index) {
  const quote = content[index];
  if (quote === '"' || quote === "'" || quote === '`') {
    let i = index + 1;
    while (i < content.length) {
      const ch = content[i];
      if (ch === '\\') {
        i += 2;
        continue;
      }
      if (ch === quote) return i + 1;
      i += 1;
    }
    return content.length;
  }
  if (quote === '/' && content[index + 1] === '/') {
    let i = index + 2;
    while (i < content.length && content[i] !== '\n') i += 1;
    return i;
  }
  if (quote === '/' && content[index + 1] === '*') {
    let i = index + 2;
    while (i < content.length - 1) {
      if (content[i] === '*' && content[i + 1] === '/') return i + 2;
      i += 1;
    }
    return content.length;
  }
  return index + 1;
}

function findMatchingParen(content, openParenIndex) {
  let depth = 0;
  for (let i = openParenIndex; i < content.length; i += 1) {
    const ch = content[i];
    if (ch === '"' || ch === "'" || ch === '`' || ch === '/') {
      const next = skipQuotedOrComment(content, i);
      if (next > i + 1) {
        i = next - 1;
        continue;
      }
    }
    if (ch === '(') {
      depth += 1;
      continue;
    }
    if (ch === ')') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function extractParamsAfter(content, startIndex) {
  const openParen = content.indexOf('(', startIndex);
  if (openParen < 0) return null;
  const closeParen = findMatchingParen(content, openParen);
  if (closeParen < 0) return null;
  return {
    openParen,
    closeParen,
    params: content.slice(openParen + 1, closeParen),
  };
}

function hasArrowOrBlockAfterParams(content, closeParen) {
  const tail = content.slice(closeParen + 1, closeParen + 260);
  return /^\s*(?::[\s\S]{0,200}?)?\s*(=>|\{)/.test(tail);
}

function collectHookDeclarations(content) {
  const declarations = new Map();
  const addDeclaration = (name, params, index) => {
    if (!/^use[A-Za-z0-9_]+$/.test(name)) return;
    if (!declarations.has(name)) {
      declarations.set(name, {
        name,
        params: normalizeWhitespace(params ?? ''),
        index,
      });
    }
  };

  const fnDeclRe = /(?:^|\n)\s*function\s+(use[A-Za-z0-9_]+)\b/g;
  let fnDeclMatch = fnDeclRe.exec(content);
  while (fnDeclMatch) {
    const parsed = extractParamsAfter(content, fnDeclRe.lastIndex);
    if (parsed && hasArrowOrBlockAfterParams(content, parsed.closeParen)) {
      addDeclaration(fnDeclMatch[1], parsed.params, fnDeclMatch.index);
    }
    fnDeclMatch = fnDeclRe.exec(content);
  }

  const constDeclRe = /(?:^|\n)\s*(?:const|let|var)\s+(use[A-Za-z0-9_]+)\s*=/g;
  let constDeclMatch = constDeclRe.exec(content);
  while (constDeclMatch) {
    const parsed = extractParamsAfter(content, constDeclRe.lastIndex);
    if (parsed && hasArrowOrBlockAfterParams(content, parsed.closeParen)) {
      addDeclaration(constDeclMatch[1], parsed.params, constDeclMatch.index);
    }
    constDeclMatch = constDeclRe.exec(content);
  }

  return declarations;
}

function extractExportedHooks(content) {
  const hooks = [];
  const declarations = collectHookDeclarations(content);
  const addHook = (name, params, index) => {
    hooks.push({
      name,
      params: normalizeWhitespace(params ?? ''),
      index,
    });
  };

  const exportedFnRe = /export\s+function\s+(use[A-Za-z0-9_]+)\b/g;
  let exportedFnMatch = exportedFnRe.exec(content);
  while (exportedFnMatch) {
    const parsed = extractParamsAfter(content, exportedFnRe.lastIndex);
    if (parsed && hasArrowOrBlockAfterParams(content, parsed.closeParen)) {
      addHook(exportedFnMatch[1], parsed.params, exportedFnMatch.index);
    }
    exportedFnMatch = exportedFnRe.exec(content);
  }

  const exportedDefaultFnRe =
    /export\s+default\s+function\s+(use[A-Za-z0-9_]+)\b/g;
  let exportedDefaultFnMatch = exportedDefaultFnRe.exec(content);
  while (exportedDefaultFnMatch) {
    const parsed = extractParamsAfter(content, exportedDefaultFnRe.lastIndex);
    if (parsed && hasArrowOrBlockAfterParams(content, parsed.closeParen)) {
      addHook(
        exportedDefaultFnMatch[1],
        parsed.params,
        exportedDefaultFnMatch.index,
      );
    }
    exportedDefaultFnMatch = exportedDefaultFnRe.exec(content);
  }

  const exportedConstRe =
    /export\s+(?:const|let|var)\s+(use[A-Za-z0-9_]+)\s*=/g;
  let exportedConstMatch = exportedConstRe.exec(content);
  while (exportedConstMatch) {
    const parsed = extractParamsAfter(content, exportedConstRe.lastIndex);
    if (parsed && hasArrowOrBlockAfterParams(content, parsed.closeParen)) {
      addHook(exportedConstMatch[1], parsed.params, exportedConstMatch.index);
    }
    exportedConstMatch = exportedConstRe.exec(content);
  }

  // Also pick up `export { useX }` when the hook is declared and exported later.
  const exportListRe = /export\s*\{([^}]+)\}\s*;/g;
  let exportListMatch = exportListRe.exec(content);
  while (exportListMatch) {
    const entries = exportListMatch[1].split(',').map((entry) => entry.trim());
    for (const entry of entries) {
      if (!entry) continue;
      const [localRaw, exportedRaw] = entry
        .split(/\s+as\s+/i)
        .map((part) => part.trim());
      const localName = localRaw ?? '';
      const exportedName = exportedRaw ?? localName;
      if (!/^use[A-Za-z0-9_]+$/.test(exportedName)) continue;
      const declaration = declarations.get(localName);
      if (!declaration) continue;
      addHook(exportedName, declaration.params, declaration.index);
    }
    exportListMatch = exportListRe.exec(content);
  }

  const seen = new Set();
  return hooks.filter((hook) => {
    const key = `${hook.name}:${hook.index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function inferHookPurpose(name) {
  const phrase = splitCamel(name.replace(/^use/, ''));
  if (!phrase) return 'Purpose unclear — needs review';
  return `Manages ${phrase.toLowerCase()} behavior.`;
}

function extractHookBody(content, hookIndex) {
  const start = content.indexOf('{', hookIndex);
  if (start < 0) return '';
  const block = extractBlockFromOpenBrace(content, start);
  return block ?? '';
}

function inferHookReturnShape(body) {
  const returnObjMatch = body.match(/return\s*\{([\s\S]{0,500}?)\}\s*;/m);
  if (returnObjMatch) {
    const keys = splitTopLevelCsv(returnObjMatch[1])
      .map((item) => item.split(':')[0].trim())
      .map((item) => item.replace(/^\.\.\./, '').trim())
      .filter(Boolean)
      .slice(0, 8);
    if (keys.length > 0) {
      return `{ ${keys.join(', ')}${keys.length >= 8 ? ', ...' : ''} }`;
    }
  }
  const returnCallMatch = body.match(/return\s+([A-Za-z0-9_]+)\(/);
  if (returnCallMatch) return `${returnCallMatch[1]}(...)`;
  if (body.includes('return '))
    return 'Non-object return; inspect file for exact shape.';
  return 'Purpose unclear — needs review';
}

function inferHookSideEffects(body) {
  const tags = [];
  if (body.includes('useEffect(')) tags.push('react effect lifecycle');
  if (body.includes('setTimeout(') || body.includes('setInterval('))
    tags.push('timer scheduling');
  if (
    body.includes('requestWithMeta') ||
    body.includes('apiClient') ||
    body.includes('talentPartnerBffClient') ||
    body.includes('fetch(')
  ) {
    tags.push('network I/O');
  }
  if (body.includes('localStorage') || body.includes('sessionStorage'))
    tags.push('web storage I/O');
  if (body.includes('router.') || body.includes('window.location'))
    tags.push('client navigation side effects');
  if (body.includes('notify(')) tags.push('toast/notification side effects');
  return tags.length ? tags.join('; ') : 'none observed';
}

function inferHookPrereqs(content, body) {
  const tags = [];
  if (content.includes('useCandidateSession'))
    tags.push('`CandidateSessionProvider` context');
  if (content.includes('useNotifications'))
    tags.push('`NotificationsProvider` context');
  if (content.includes('useQuery(') || content.includes('useQueryClient('))
    tags.push('React Query provider');
  if (content.includes('useRouter')) tags.push('Next client router context');
  if (body.includes('candidateSessionId'))
    tags.push('valid `candidateSessionId` input');
  return tags.length ? tags.join('; ') : 'none beyond React runtime';
}

function generateHooksCatalog(hookFiles, contentByFile) {
  const rows = [];

  for (const absPath of hookFiles) {
    const relPath = relFromRoot(absPath);
    const content = contentByFile.get(absPath) ?? '';
    const hooks = extractExportedHooks(content);
    for (const hook of hooks) {
      const body = extractHookBody(content, hook.index);
      rows.push({
        hook: hook.name,
        file: relPath,
        purpose: inferHookPurpose(hook.name),
        params: hook.params || 'none',
        returns: inferHookReturnShape(body),
        sideEffects: inferHookSideEffects(body),
        prerequisites: inferHookPrereqs(content, body),
        usage: `\`const value = ${hook.name}(${hook.params ? '/* params */' : ''});\``,
      });
    }
  }

  rows.sort((a, b) =>
    a.file === b.file
      ? a.hook.localeCompare(b.hook)
      : a.file.localeCompare(b.file),
  );

  const lines = [];
  lines.push('# Hooks Catalog');
  lines.push('');
  lines.push('Generated from exported `use*` hooks in `src/**`.');
  lines.push('');
  lines.push(
    '| Hook | File | Purpose | Params | Return Shape | Side Effects | Prerequisites | Usage Example |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |');

  for (const row of rows) {
    lines.push(
      `| \`${markdownEscape(row.hook)}\` | \`${markdownEscape(row.file)}\` | ${markdownEscape(row.purpose)} | ${markdownEscape(row.params)} | ${markdownEscape(row.returns)} | ${markdownEscape(row.sideEffects)} | ${markdownEscape(row.prerequisites)} | ${markdownEscape(row.usage)} |`,
    );
  }

  lines.push('');
  lines.push('Notes:');
  lines.push(
    '- `Purpose unclear — needs review` is used when static extraction cannot infer intent confidently.',
  );
  lines.push(
    '- For hooks with deeply composed returns, inspect the source module directly before refactors.',
  );

  return `${lines.join('\n')}\n`;
}

function classifyUtility(relPath) {
  const base = path.basename(relPath);
  if (/constants/i.test(base)) return 'constants';
  if (/types/i.test(base) || /\.types\./i.test(base)) return 'types';
  if (relPath.includes('/lib/')) return 'lib';
  if (relPath.includes('/utils/')) return 'utility';
  return 'utility';
}

function exportedNames(content, pattern) {
  const result = [];
  let match = pattern.exec(content);
  while (match) {
    result.push(match[1]);
    match = pattern.exec(content);
  }
  return result;
}

function extractFunctionSignatures(content) {
  const signatures = [];
  const fnRe =
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*(?::\s*([^\{\n]+))?/g;
  let fnMatch = fnRe.exec(content);
  while (fnMatch) {
    signatures.push({
      name: fnMatch[1],
      params: normalizeWhitespace(fnMatch[2]),
      returns: fnMatch[3] ? normalizeWhitespace(fnMatch[3]) : 'inferred',
      kind: 'function',
    });
    fnMatch = fnRe.exec(content);
  }

  const constFnRe =
    /export\s+const\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?(?:<[^>]+>\s*)?\(([^)]*)\)\s*(?::\s*([^=\n]+))?\s*=>/g;
  let constMatch = constFnRe.exec(content);
  while (constMatch) {
    signatures.push({
      name: constMatch[1],
      params: normalizeWhitespace(constMatch[2]),
      returns: constMatch[3] ? normalizeWhitespace(constMatch[3]) : 'inferred',
      kind: 'const-fn',
    });
    constMatch = constFnRe.exec(content);
  }

  return signatures;
}

function nonObviousTypeFieldNotes(content) {
  const typeHeaders = exportedNames(
    content,
    /export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g,
  );
  if (typeHeaders.length === 0) return 'none';

  const snakeCaseFieldMatch = content.match(/\b[A-Za-z0-9]+_[A-Za-z0-9_]+\b/g);
  if (snakeCaseFieldMatch && snakeCaseFieldMatch.length > 0) {
    return `Contains API-shaped fields (${Array.from(new Set(snakeCaseFieldMatch)).slice(0, 4).join(', ')}${snakeCaseFieldMatch.length > 4 ? ', ...' : ''}).`;
  }

  const statusFieldMatch = content.match(/\bstatus\b|\berrorCode\b|\bstate\b/g);
  if (statusFieldMatch) {
    return 'Contains status/error/state fields that mirror backend contracts.';
  }

  return 'Type exports are straightforward; verify unions when expanding contract usage.';
}

function generateUtilitiesCatalog(utilityFiles, contentByFile) {
  const rows = [];

  for (const absPath of utilityFiles) {
    const relPath = relFromRoot(absPath);
    const content = contentByFile.get(absPath) ?? '';

    const fnSigs = extractFunctionSignatures(content);
    const fnSummary = fnSigs.length
      ? fnSigs
          .slice(0, 4)
          .map(
            (sig) => `\`${sig.name}(${sig.params || ''}) => ${sig.returns}\``,
          )
          .join('; ')
      : 'none';

    const constants = exportedNames(
      content,
      /export\s+const\s+([A-Za-z0-9_]+)/g,
    ).filter((name) => !fnSigs.some((sig) => sig.name === name));

    const types = exportedNames(
      content,
      /export\s+(?:type|interface)\s+([A-Za-z0-9_]+)/g,
    );

    const exampleTarget = fnSigs[0]?.name ?? constants[0] ?? types[0] ?? null;
    const example = exampleTarget
      ? `\`import { ${exampleTarget} } from '@/${relPath.replace(/^src\//, '').replace(/\.ts$/, '')}';\``
      : 'Purpose unclear — needs review';

    let behavior = 'Purpose unclear — needs review';
    if (fnSigs.length > 0) {
      behavior = `Exports reusable behavior helpers (${fnSigs
        .slice(0, 3)
        .map((sig) => sig.name)
        .join(', ')}${fnSigs.length > 3 ? ', ...' : ''}).`;
    } else if (constants.length > 0) {
      behavior = `Defines configuration/constants (${constants.slice(0, 4).join(', ')}${constants.length > 4 ? ', ...' : ''}).`;
    } else if (types.length > 0) {
      behavior = `Defines shared type contracts (${types.slice(0, 4).join(', ')}${types.length > 4 ? ', ...' : ''}).`;
    }

    rows.push({
      module: relPath,
      category: classifyUtility(relPath),
      behavior,
      functionSignatures: fnSummary,
      constants: constants.length ? constants.slice(0, 6).join(', ') : 'none',
      types: types.length ? types.slice(0, 6).join(', ') : 'none',
      typeNotes: nonObviousTypeFieldNotes(content),
      example,
    });
  }

  rows.sort((a, b) => a.module.localeCompare(b.module));

  const lines = [];
  lines.push('# Utilities, Constants, and Types Catalog');
  lines.push('');
  lines.push(
    'Generated from utility/constants/type-oriented modules in `src/**`.',
  );
  lines.push('');
  lines.push(
    '| Module | Category | Behavior | Function Behavior / Params / Returns | Constants Intent / Usage | Type Notes | Example |',
  );
  lines.push('| --- | --- | --- | --- | --- | --- | --- |');

  for (const row of rows) {
    const constantsSummary =
      row.constants === 'none' ? 'none' : `${row.constants}`;
    lines.push(
      `| \`${markdownEscape(row.module)}\` | ${markdownEscape(row.category)} | ${markdownEscape(row.behavior)} | ${markdownEscape(row.functionSignatures)} | ${markdownEscape(constantsSummary)} | ${markdownEscape(row.typeNotes)} | ${markdownEscape(row.example)} |`,
    );
  }

  lines.push('');
  lines.push('Notes:');
  lines.push(
    '- Entries marked `Purpose unclear — needs review` require manual follow-up before relying on inferred semantics.',
  );
  lines.push(
    '- Function signature extraction is static and may omit overload details.',
  );

  return `${lines.join('\n')}\n`;
}

function isHookFile(relPath) {
  if (!/\.(ts|tsx)$/.test(relPath)) return false;
  if (relPath.endsWith('.d.ts')) return false;
  if (relPath.includes('/__tests__/') || relPath.includes('/tests/'))
    return false;
  return true;
}

function isUtilityFile(relPath) {
  if (!relPath.endsWith('.ts')) return false;
  if (relPath.endsWith('.d.ts')) return false;
  if (relPath.includes('/api/client/')) return false;

  return (
    relPath.includes('/utils/') ||
    relPath.includes('/lib/') ||
    /(?:Utils|utils|constants|types)\.ts$/.test(path.basename(relPath)) ||
    /\.types\./.test(relPath)
  );
}

async function main() {
  const allFiles = await walk(srcDir);
  const tsxFiles = allFiles.filter((file) => file.endsWith('.tsx'));
  const hookFiles = allFiles.filter((file) => isHookFile(relFromRoot(file)));
  const utilityFiles = allFiles.filter((file) =>
    isUtilityFile(relFromRoot(file)),
  );

  const contentByFile = new Map();
  await Promise.all(
    [...new Set([...tsxFiles, ...hookFiles, ...utilityFiles])].map(
      async (file) => {
        const text = await fs.readFile(file, 'utf8');
        contentByFile.set(file, text);
      },
    ),
  );

  const componentsMd = generateComponentsCatalog(tsxFiles, contentByFile);
  const hooksMd = generateHooksCatalog(hookFiles, contentByFile);
  const utilitiesMd = generateUtilitiesCatalog(utilityFiles, contentByFile);

  await fs.mkdir(docsDir, { recursive: true });
  await fs.writeFile(
    path.join(docsDir, 'components-catalog.md'),
    componentsMd,
    'utf8',
  );
  await fs.writeFile(path.join(docsDir, 'hooks-catalog.md'), hooksMd, 'utf8');
  await fs.writeFile(
    path.join(docsDir, 'utilities-catalog.md'),
    utilitiesMd,
    'utf8',
  );

  process.stdout.write(
    [
      'Generated frontend catalogs:',
      '- docs/frontend/components-catalog.md',
      '- docs/frontend/hooks-catalog.md',
      '- docs/frontend/utilities-catalog.md',
    ].join('\n') + '\n',
  );
}

main().catch((error) => {
  process.stderr.write(`Failed to generate docs catalogs: ${String(error)}\n`);
  process.exitCode = 1;
});
