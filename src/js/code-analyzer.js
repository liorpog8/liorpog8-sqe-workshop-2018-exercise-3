import * as esprima from 'esprima';
import * as escodegen  from 'escodegen';

let greenLines = [];
let redLines = [];
let ignoreRows = [];
let paramList = [];

let insideFunc = false;
let ifEval = false;

let funcs = {
    'Literal': (parsedJson) => {return parsedJson;},
    'Identifier': (parsedJson, env, args) => {return subtitute_Identifier(parsedJson, env, args);},
    'BinaryExpression': (parsedJson, env, args) => {return subtitute_BinaryExpression(parsedJson, env, args);},
    'VariableDeclarator': (parsedJson, env, args) => {return subtitute_VariableDeclarator(parsedJson, env, args);},
    'ReturnStatement': (parsedJson, env, args) => {parsedJson.argument = substitute(parsedJson.argument, env, args); return parsedJson; },
    'MemberExpression': (parsedJson, env, args) => {return subtitute_MemberExpression(parsedJson, env, args);},
    'ExpressionStatement': (parsedJson, env, args) => {parsedJson.expression = substitute(parsedJson.expression, env, args); return parsedJson;},
    'AssignmentExpression': (parsedJson, env, args) => {return subtitute_AssignmentExpression(parsedJson, env, args);},
    'UpdateExpression': (parsedJson, env, args) => {parsedJson.argument = substitute(parsedJson.argument, env, args); return parsedJson; },
    'FunctionDeclaration': (parsedJson, env, args) => {return subtitute_FunctionDeclaration(parsedJson, env, args);},
    'VariableDeclaration': (parsedJson, env, args) => {return subtitute_VariableDeclaration(parsedJson, env, args);},
    'BlockStatement': (parsedJson, env, args) => {return subtitute_BlockStatement(parsedJson, env, args); },
    'IfStatement': (parsedJson, env, args) => {return subtitute_IfStatement(parsedJson, env, args);},
    'WhileStatement': (parsedJson, env, args) => {return subtitute_WhileStatement(parsedJson, env, args);},
    'Program': (parsedJson, env, args) => {return subtitute_Program(parsedJson, env, args);}
};

const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse, {loc: true});
};

const substituteCode = (parsedJson, env, args, _ifEval) => {
    let parsedArgs = [];
    greenLines = [];
    redLines = [];
    ignoreRows = [];
    paramList = [];
    ifEval = _ifEval;
    if(args !== '') {
        parsedArgs = parseCode(args);
        parsedArgs = parsedArgs.body[0].expression;
        if (parsedArgs.expressions !== undefined)
            parsedArgs = parsedArgs.expressions;
        else
            parsedArgs = [parsedArgs];
    }
    return {'substituted': substitute(parsedJson, env, parsedArgs), 'greenLines': greenLines, 'redLines': redLines, 'ignoreRows': ignoreRows};
};

function substitute(parsedJson, env, args) {
    try {
        return funcs[parsedJson.type](parsedJson, env, args);
    }
    catch (e) {
        return parsedJson;
    }
}

function dictCopy(dict) {
    let newDict = {};
    for(let key in dict)
        newDict[key] = dict[key];
    return newDict;
}

function PositiveArgsLen(bodyEnv, args){
    for (let i = 0; i < args.length; i++) {
        if (args[i].type === 'ArrayExpression')
            for (let itemIndex = 0; itemIndex < args[i].elements.length; itemIndex++)
                bodyEnv[paramList[i] + '[' + itemIndex + ']'] = args[i].elements[itemIndex];
        else
            bodyEnv[paramList[i]] = args[i];
    }
}

function initialize(bodyEnv, args) {
    if(args.length > 0)
        PositiveArgsLen(bodyEnv, args);
    else
        for (let i = 0; i < paramList.length; i++)
            bodyEnv[paramList[i]] = parseCode(paramList[i]).body[0].expression;
}

function ifEvalLiteral(parsedJson, evalTest){
    if (evalTest.value)
        greenLines.push(parsedJson.test.loc.start.line-1);
    else
        redLines.push(parsedJson.test.loc.start.line-1);
    if (parsedJson.alternate) {
        if (evalTest.value)
            redLines.push(parsedJson.alternate.loc.start.line-1);
        else
            greenLines.push(parsedJson.alternate.loc.start.line-1);
    }
}

function setColors(parsedJson, env, args) {
    let clone = esprima.parseScript(escodegen.generate(parsedJson.test), {loc: true});
    let evalTest = substitute(clone.body[0].expression,dictCopy(env), args);
    if (evalTest.type === 'BinaryExpression' && evalTest.left.type === 'Literal' && evalTest.right.type === 'Literal') {
        let value = eval(evalTest.left.raw + evalTest.operator + evalTest.right.raw);
        evalTest = {'type': 'Literal', 'value': value, 'raw': value, 'loc': evalTest.loc};
    }
    if (evalTest.type === 'Literal')
        ifEvalLiteral(parsedJson, evalTest);
}

function subtitute_Identifier(parsedJson, env, args) {
    if (parsedJson.name in env &&
        (!paramList.includes(parsedJson.name) || (paramList.includes(parsedJson.name) && paramList.length === args.length)))
        return env[parsedJson.name];
    return parsedJson;
}

function subtitute_BinaryExpression(parsedJson, env, args) {
    parsedJson.right = substitute(parsedJson.right, env, args);
    parsedJson.left = substitute(parsedJson.left, env, args);
    if(['+','-','*','/'].includes(parsedJson.operator) && parsedJson.left.type === 'Literal' && parsedJson.right.type === 'Literal') {
        let value = eval(parsedJson.left.raw + parsedJson.operator + parsedJson.right.raw);
        return {'type': 'Literal', 'value': value, 'raw': value, 'loc': parsedJson.loc};
    }
    return parsedJson;
}

function subtitute_VariableDeclarator(parsedJson, env, args) {
    if(parsedJson.init){
        parsedJson.init = substitute(parsedJson.init, env, args);
        if(parsedJson.init.type === 'ArrayExpression'){
            for(let i = 0; i < parsedJson.init.elements.length; i++)
                env[parsedJson.id.name + '[' + i + ']'] = parsedJson.init.elements[i];
            return parsedJson;
        }
    }
    env[parsedJson.id.name] = parsedJson.init;
    return parsedJson;
}

function memberParamList(parsedJson, args){
    return (!paramList.includes(parsedJson.object.name) ||
        (paramList.includes(parsedJson.object.name) && paramList.length === args.length));
}

function subtitute_MemberExpression(parsedJson, env, args) {
    parsedJson.property = substitute(parsedJson.property, env, args);
    let key = '';
    if(parsedJson.property.type === 'Literal')
        key = parsedJson.object.name+'['+parsedJson.property.raw+']';

    if(key in env && memberParamList(parsedJson, args))
        return env[key];

    return parsedJson;
}

function getMemberKey(left, parsedJson, env, args){
    let key = left;
    if (parsedJson.left.type === 'MemberExpression'){
        let itemIndex = '';
        let itemJson = substitute(parsedJson.left.property, env, args);
        if(itemJson.type === 'Literal')
            itemIndex = itemJson.raw;
        key = parsedJson.left.object.name + '[' + itemIndex + ']';
    }
    return key;
}

function subtitute_AssignmentExpression(parsedJson, env, args) {
    let left = '';
    if (parsedJson.left.type === 'MemberExpression')
        left = parsedJson.left.object.name;
    else
        left = parsedJson.left.name;
    if (insideFunc && !(paramList.includes(left)))
        ignoreRows.push(parsedJson.loc.start.line - 1);
    parsedJson.right = substitute(parsedJson.right, env, args);

    let key = getMemberKey(left, parsedJson, env, args);
    env[key] = parsedJson.right;
    return parsedJson;
}

function subtitute_FunctionDeclaration(parsedJson, env, args) {
    for (let i = 0; i < parsedJson.params.length; i++)
        paramList.push(parsedJson.params[i].name);
    let bodyEnv = dictCopy(env);
    if(paramList.length > 0)
        initialize(bodyEnv, args);

    insideFunc = true;
    parsedJson.body = substitute(parsedJson.body, bodyEnv, args);
    insideFunc = false;
    return parsedJson;
}

function subtitute_VariableDeclaration(parsedJson, env, args) {
    for (let i = 0; i < parsedJson.declarations.length; i++) {
        if (insideFunc)
            ignoreRows.push(parsedJson.declarations[i].loc.start.line - 1);
        parsedJson.declarations[i] = substitute(parsedJson.declarations[i], env, args);
    }
    return parsedJson;
}

function subtitute_BlockStatement(parsedJson, env, args) {
    for (let i = 0; i < parsedJson.body.length; i++)
        parsedJson.body[i] = substitute(parsedJson.body[i], env, args);

    return parsedJson;
}

function subtitute_IfStatement(parsedJson, env, args) {
    parsedJson.test = substitute(parsedJson.test, env, args);
    if(ifEval)
        setColors(parsedJson, env, args);

    parsedJson.consequent = substitute(parsedJson.consequent, dictCopy(env), args);

    if(parsedJson.alternate != null)
        parsedJson.alternate = substitute(parsedJson.alternate, dictCopy(env), args);

    return parsedJson;
}

function subtitute_WhileStatement(parsedJson, env, args) {
    parsedJson.test = substitute(parsedJson.test, env, args);
    parsedJson.body = substitute(parsedJson.body, dictCopy(env), args);
    return parsedJson;
}

function subtitute_Program(parsedJson, env, args) {
    for (let i = 0; i < parsedJson.body.length; i++)
        parsedJson.body[i] = substitute(parsedJson.body[i], env, args);

    return parsedJson;
}

const getLines = (subParsedJson, greenLines, redLines , ignoreRows) => {
    let ans = [];
    let lines = escodegen.generate(subParsedJson).replace(/\[[\r\n]+/g,'[').replace(/,[\r\n]+/g,',').replace('\n    ];','];').replace('\n];','];').split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (!ignoreRows.includes(i)) {
            let rowColor = 'black';
            if (redLines.includes(i))
                rowColor = 'red';
            if (greenLines.includes(i))
                rowColor = 'green';
            ans.push({'line':lines[i], 'color':rowColor});
        }
    }
    return ans;
};

export {parseCode, substituteCode, getLines};
