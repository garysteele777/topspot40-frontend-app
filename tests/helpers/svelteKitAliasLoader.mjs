const sourceRoot = new URL('../../src/', import.meta.url);

function sourceUrl(path) {
    return new URL(path, sourceRoot).href;
}

export async function resolve(specifier, context, nextResolve) {
    if (specifier === '$app/environment') {
        return {
            url: new URL('./testAppEnvironment.ts', import.meta.url).href,
            shortCircuit: true
        };
    }

    if (specifier.startsWith('$lib/')) {
        return {
            url: sourceUrl(`lib/${specifier.slice('$lib/'.length)}.ts`),
            shortCircuit: true
        };
    }

    return nextResolve(specifier, context);
}
