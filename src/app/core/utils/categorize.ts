export enum LineCategory {
    Code = 'code',
    Test = 'test',
    Docs = 'docs',
    Config = 'config',
    Deps = 'deps',
    Gen = 'gen',
}

const DEPS =
    /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|npm-shrinkwrap\.json|go\.(mod|sum)|cargo\.lock|gemfile(\.lock)?|requirements[^/]*\.txt|poetry\.lock|pipfile(\.lock)?|composer\.(json|lock)|pom\.xml|build\.gradle[^/]*|packages\.lock\.json|pubspec\.(yaml|lock))$/;
const GEN = /\.(min\.(js|css)|map|d\.ts)$|\.(pb\.go|g\.dart|freezed\.dart|gr\.dart|generated\.[a-z0-9]+)$|(^|\/)(dist|build|out|coverage|node_modules|vendor|generated|__generated__|\.next|\.angular)\//;
const TEST = /(^|\/)(tests?|specs?|__tests__|__mocks__|e2e|cypress|fixtures)\/|\.(test|spec|stories)\.[a-z0-9]+$|_(test|spec)\.[a-z0-9]+$/;
const DOCS = /\.(md|mdx|rst|adoc|txt)$|(^|\/)docs?\//;
const CONFIG = /\.(ya?ml|toml|ini|cfg|conf|env|properties|json|json5|xml|lock)$|(^|\/)(dockerfile|makefile|\.[^/]+|tsconfig[^/]*\.json|[^/]*\.config\.[a-z0-9]+|[^/]*\.rc)$/;

export const categorizeFile = (path: string): LineCategory => {
    const p = path.toLowerCase();
    if (DEPS.test(p)) {
        return LineCategory.Deps;
    }
    if (GEN.test(p)) {
        return LineCategory.Gen;
    }
    if (TEST.test(p)) {
        return LineCategory.Test;
    }
    if (DOCS.test(p)) {
        return LineCategory.Docs;
    }
    if (CONFIG.test(p)) {
        return LineCategory.Config;
    }
    return LineCategory.Code;
};

const ORDER = [LineCategory.Code, LineCategory.Test, LineCategory.Docs, LineCategory.Config, LineCategory.Deps, LineCategory.Gen];

// Sum of changed lines per category, as a [code, test, docs, config, deps, gen] tuple
// aligned with the F-row category slots.
export const categorizeChanges = (files: { filename?: string; additions?: number; deletions?: number }[]): number[] => {
    const totals: Record<string, number> = {};
    for (const file of files) {
        if (!file.filename) {
            continue;
        }
        const category = categorizeFile(file.filename);
        totals[category] = (totals[category] || 0) + (file.additions || 0) + (file.deletions || 0);
    }
    return ORDER.map((category) => {
        return totals[category] || 0;
    });
};
