export const DEFAULT_ENVIRONMENT_ADAPTER = 'frontend-only';

export function normalizeEnvironmentAdapter(adapter = {}) {
    if (!adapter || typeof adapter !== 'object' || Array.isArray(adapter)) {
        throw new Error('E2E environment adapter must be an object');
    }

    const name = typeof adapter.name === 'string' && adapter.name.trim() !== ''
        ? adapter.name.trim()
        : 'inline';

    if (adapter.setup !== undefined && typeof adapter.setup !== 'function') {
        throw new Error(`E2E environment adapter "${name}" setup must be a function`);
    }
    if (adapter.teardown !== undefined && typeof adapter.teardown !== 'function') {
        throw new Error(`E2E environment adapter "${name}" teardown must be a function`);
    }

    return {
        ...adapter,
        name,
        unavailableUrls: normalizeStringArray(adapter.unavailableUrls, `${name}.unavailableUrls`),
        testConfig: normalizePlainObject(adapter.testConfig, `${name}.testConfig`),
        previewUrlParams: normalizeStringMap(adapter.previewUrlParams, `${name}.previewUrlParams`),
    };
}

export function resolveEnvironmentAdapter(e2eCase, registry, options = {}) {
    const adapterName = e2eCase?.fixture?.adapter ?? e2eCase?.adapter ?? options.defaultAdapter ?? DEFAULT_ENVIRONMENT_ADAPTER;
    if (typeof adapterName !== 'string' || adapterName.trim() === '') {
        throw new Error(`E2E case "${e2eCase?.id ?? '<unknown>'}" fixture.adapter must be a non-empty string`);
    }

    const adapter = registry?.[adapterName];
    if (!adapter) {
        throw new Error(`E2E environment adapter "${adapterName}" was not found for case "${e2eCase?.id ?? '<unknown>'}"`);
    }
    return normalizeEnvironmentAdapter(adapter);
}

export function mergeEnvironmentAdapterOptions(options = {}, adapter = {}) {
    const normalized = normalizeEnvironmentAdapter(adapter);
    return {
        ...options,
        testConfig: {
            ...normalized.testConfig,
            ...(options.testConfig ?? {}),
        },
        preview: {
            ...(options.preview ?? {}),
            urlParams: {
                ...normalized.previewUrlParams,
                ...(options.preview?.urlParams ?? {}),
            },
        },
    };
}

export async function setupEnvironmentAdapter(adapter, context) {
    const normalized = normalizeEnvironmentAdapter(adapter);
    try {
        return await normalized.setup?.(context);
    } catch (error) {
        const logPath = context?.runPaths?.logPath?.(`${normalized.name}.log`);
        const hint = logPath ? ` See ${logPath}.` : '';
        throw new Error(`E2E environment adapter "${normalized.name}" setup failed.${hint} ${errorMessage(error)}`);
    }
}

export async function teardownEnvironmentAdapter(adapter, context) {
    const normalized = normalizeEnvironmentAdapter(adapter);
    try {
        await normalized.teardown?.(context);
    } catch (error) {
        throw new Error(`E2E environment adapter "${normalized.name}" teardown failed. ${errorMessage(error)}`);
    }
}

export function createFrontendOnlyAdapter(options = {}) {
    return normalizeEnvironmentAdapter({
        name: options.name ?? 'frontend-only',
        testConfig: options.testConfig,
        previewUrlParams: options.previewUrlParams ?? (options.fixtureName ? { e2eFixture: options.fixtureName } : {}),
    });
}

function normalizeStringArray(value, field) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`E2E environment adapter ${field} must be an array of strings`);
    }
    return value.map((item) => requiredString(item, `${field}[]`));
}

function normalizePlainObject(value, field) {
    if (value === undefined) {
        return {};
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`E2E environment adapter ${field} must be an object`);
    }
    return value;
}

function normalizeStringMap(value, field) {
    if (value === undefined) {
        return {};
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`E2E environment adapter ${field} must be an object`);
    }
    return Object.fromEntries(
        Object.entries(value).map(([key, item]) => [key, requiredString(item, `${field}.${key}`)]),
    );
}

function requiredString(value, field) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`E2E environment adapter ${field} must be a non-empty string`);
    }
    return value.trim();
}

function errorMessage(error) {
    return error instanceof Error ? error.message : String(error);
}
