import * as esprima from 'esprima';
import * as escodegen  from 'escodegen';
import * as esgraph from 'esgraph';

let numOfArgs = 0;
let numOfParams = 0;

let funcs = {
    'Literal': (parsedJson) => {return parsedJson.value;},
    'Identifier': (parsedJson, env) => {return env[parsedJson.name];},
    'BinaryExpression': (parsedJson, env) => {return evaluate_BinaryExpression(parsedJson, env);},
    'MemberExpression': (parsedJson, env) => {return env[parsedJson.object.name][parsedJson.property.value];},
    'ExpressionStatement': (parsedJson, env) => {return evaluate(parsedJson.expression, env);},
    'AssignmentExpression': (parsedJson, env) => {return evaluate_AssignmentExpression(parsedJson, env);},
    'UpdateExpression': (parsedJson, env) => {return evaluate_UpdateExpression(parsedJson, env);},
    'ArrayExpression': (parsedJson, env) => {return eval('[' + parsedJson.elements.map(el => evaluate(el, env)).join(',') + ']');},
    'VariableDeclaration': (parsedJson, env) => {return evaluate_VariableDeclaration(parsedJson, env);},
    'BlockStatement': (parsedJson, env) => {parsedJson.body.forEach((el) => evaluate(el, env)); return true;},
    'LogicalExpression': (parsedJson, env) => {return evaluate_BinaryExpression(parsedJson, env);},
    'Program': (parsedJson, env) => {parsedJson.body.forEach((el) => evaluate(el, env)); return true;}
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {range: true});
};

function parseArgs(args) {
    if(args === ''){
        return [];
    }
    let parsedArgs = parseCode(args);
    parsedArgs = parsedArgs.body[0].expression;
    if(parsedArgs.expressions !== undefined){
        return parsedArgs.expressions;
    }
    return [parsedArgs];
}

const generateGraph = (code, args) => {
    let parsedCode = parseCode(code);
    let nodes = createNodes(parsedCode);
    args = parseArgs(args);
    numOfArgs = args.length;

    let env = {};
    let params = parsedCode.body[0].params;
    numOfParams = params.length;
    let pairs = params.map((key, i) => {
        return {'key': key.name, 'value': args[i] !== undefined && args[i].value !== undefined ? args[i].value :args[i]};
    });

    pairs.forEach((pair) => {env[pair.key] = pair.value;});


    parseNodes(nodes[0], env);
    return createGraph(nodes);
};

const createNodes = (parsedJson) => {
    let nodes = esgraph(parsedJson.body[0].body)[2];
    nodes = nodes.slice(1, nodes.length - 1);
    nodes[0].prev = [];
    nodes.filter(node => node.astNode.type === 'ReturnStatement')
        .forEach(node => {node.next=[]; delete node.normal;});
    nodes.forEach(node => node.label = escodegen.generate(node.astNode));

    for (let i = 0; i < nodes.length; i++) {
        while (nodes[i].normal && nodes[i].normal.normal && nodes[i].normal.prev.length === 1) {
            nodes.splice(nodes.indexOf(nodes[i].normal), 1);
            nodes[i].label = nodes[i].label + '\n' + nodes[i].normal.label;
            nodes[i].next = nodes[i].normal.next;
            nodes[i].normal = nodes[i].normal.normal;
        }
    }
    return nodes;
};

const parseNodes = (node, env) => {
    node.green = true;
    if (node.normal) {
        evaluate(parseCode(node.label), env);
        parseNodes(node.normal, env);
    }
    else if (node.true && node.false) {
        evaluate(parseCode(node.label).body[0], env) ? parseNodes(node.true, env) : parseNodes(node.false, env);
    }
};


function evaluate(parsedJson, env) {
    return funcs[parsedJson.type](parsedJson, env);
}


function evaluate_BinaryExpression(parsedJson, env) {
    let left = evaluate(parsedJson.left, env);
    let right = evaluate(parsedJson.right, env);
    return eval(left + parsedJson.operator + right);
}

function evaluate_AssignmentExpression(parsedJson, env) {
    if (parsedJson.left.type === 'MemberExpression')
        env[parsedJson.left.object.name][parsedJson.left.property.value] = evaluate(parsedJson.right, env);
    else
        env[parsedJson.left.name] = evaluate(parsedJson.right, env);
    return true;
}

function evaluate_UpdateExpression(parsedJson, env) {
    env[parsedJson.argument.name] = evaluate(parsedJson.argument, env) + 1;
    return true;
}

function evaluate_VariableDeclaration(parsedJson, env) {
    parsedJson.declarations.forEach((dec) => {
        if (dec.init !== null)
            env[dec.id.name] = evaluate(dec.init, env);
    });
    return true;
}

function createGraph(nodes) {
    let result = ['digraph cfg { forcelabels=true '];
    for (const [i, node] of nodes.entries()) {
        let {label = node.type} = node;
        result.push(`n${i} [label="${label}", xlabel = ${i + 1}, `);
        let shape = 'rectangle';
        if (node.true || node.false) {
            shape = 'diamond';
        }
        result.push(` shape=${shape},`);
        if (node.green && numOfParams === numOfArgs) {
            result.push(' style = filled, fillcolor = green');
        }
        result.push(']\n');
    }
    genEdges(result, nodes);
    result.push(' }');
    return result.join('');
}

function genEdges(result, nodes) {
    for (const [i, node] of nodes.entries()) {
        genEdge(result, nodes, node, i, 'normal');
        genEdge(result, nodes, node, i, 'true');
        genEdge(result, nodes, node, i, 'false');
    }
}

function genEdge(result, nodes, node, i, type){
    if (!node[type]) return;
    result.push(`n${i} -> n${nodes.indexOf(node[type])} [`);
    if (['true', 'false'].includes(type))
        result.push(`label="${type.charAt(0).toUpperCase()}"`);
    result.push(']\n');
}


export {generateGraph, evaluate, parseCode};
