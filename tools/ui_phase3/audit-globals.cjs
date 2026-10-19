// Host-only audit. Install acorn in a temporary tooling prefix; no app dependency.
const fs = require('node:fs');
const path = require('node:path');
const acorn = require('acorn');
const root = path.resolve('EasyFormSE_finance/assets/www2');
const definitions = new Map();
let scripts = 0, legacyExports = 0;
function controllerExports(tree) {
    const call = tree.body.find(node => node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression' && node.expression.callee.type === 'FunctionExpression');
    if (!call) return [];
    const outer = call.expression.callee.body.body;
    const controller = outer.some(node => node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression' &&
        node.expression.left.type === 'MemberExpression' && /^App.+Controller$/.test(node.expression.left.property.name || ''));
    if (!controller) return [];
    // A namespaced component publishes one legacy object, not every API method
    // as a window function. Continue auditing that object's actual global name.
    const namespaces = [];
    function namespace(node) {
        if (!node || typeof node !== 'object') return;
        if (node.type === 'AssignmentExpression' && node.left.type === 'MemberExpression' && node.left.object.name === 'w' &&
            node.right.type === 'CallExpression' && node.right.callee.name === 'create' && node.right.arguments.length === 0) {
            namespaces.push({ name: node.left.property.name, kind: 'legacy-object', line: node.loc.start.line });
        }
        for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(namespace); else if (value && typeof value === 'object') namespace(value);
    }
    outer.forEach(namespace);
    if (namespaces.length) return namespaces;

    const factory = outer.find(node => node.type === 'FunctionDeclaration' && node.id.name === 'create');
    if (!factory) return [];
    const declarations = [];
    function add(object, kind) {
        if (!object || object.type !== 'ObjectExpression') return;
        object.properties.forEach(property => declarations.push({ name: property.key.name || property.key.value, kind, line: property.loc.start.line }));
    }
    for (const node of factory.body.body) {
        if (node.type === 'VariableDeclaration') node.declarations.forEach(declaration => { if (declaration.id.name === 'api') add(declaration.init, 'legacy-export'); });
        if (node.type === 'ExpressionStatement' && node.expression.type === 'CallExpression') {
            const expr = node.expression, callee = expr.callee;
            if (callee.type === 'MemberExpression' && callee.object.name === 'Object' && callee.property.name === 'defineProperties' && expr.arguments[0]?.name === 'api') add(expr.arguments[1], 'legacy-state');
        }
    }
    return declarations;
}
for (const directory of ['EFSE_Js', 'EFSE_Js_Task', 'EFSE_Js_Server']) {
    for (const name of fs.readdirSync(path.join(root, directory), { recursive: true }).filter(name => name.endsWith('.js'))) {
        const file = directory + '/' + name;
        const tree = acorn.parse(fs.readFileSync(path.join(root, file), 'utf8'), { ecmaVersion: 'latest', locations: true });
        scripts++;
        // Compatibility aliases are still globals on legacy pages. Audit them
        // even though their implementation now lives inside a page factory.
        const aliases = controllerExports(tree); legacyExports += aliases.length;
        for (const alias of aliases) {
            if (!definitions.has(alias.name)) definitions.set(alias.name, []);
            definitions.get(alias.name).push({ file, ...alias });
        }
        for (const statement of tree.body) {
            const declarations = statement.type === 'FunctionDeclaration' ? [{ name: statement.id.name, kind: 'function', line: statement.loc.start.line }] :
                statement.type === 'VariableDeclaration' ? statement.declarations.filter(node => node.id.type === 'Identifier').map(node => ({ name: node.id.name, kind: 'variable', line: node.loc.start.line })) : [];
            for (const declaration of declarations) {
                if (!definitions.has(declaration.name)) definitions.set(declaration.name, []);
                definitions.get(declaration.name).push({ file, ...declaration });
            }
        }
    }
}
const collisions = Object.fromEntries([...definitions].filter(([, entries]) => new Set(entries.map(entry => entry.file)).size > 1));
console.log(JSON.stringify({ scripts, legacyExports, collisions }, null, 2));
if (Object.keys(collisions).length) process.exitCode = 1;
