const sourceRoot = new URL('../../src/', import.meta.url);

function sourceUrl(path) {
    return new URL(path, sourceRoot).href;
}

export async function resolve(specifier, context, nextResolve) {
    if (specifier === '$app/environment') {
        return nextResolve(
            new URL('./testAppEnvironment.ts', import.meta.url).href,
            context
        );
    }

    if (specifier.startsWith('$lib/')) {
        return nextResolve(
            sourceUrl(`lib/${specifier.slice('$lib/'.length)}.ts`),
            context
        );
    }

    return nextResolve(specifier, context);
}
