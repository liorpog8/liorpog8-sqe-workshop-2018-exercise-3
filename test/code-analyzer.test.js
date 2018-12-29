import assert from 'assert';
import {parseCode, generateGraph, evaluate} from '../src/js/code-analyzer';

describe('example1', () => {
    it('', () => {
        let func = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (b < z) {\n' +
            '        c = c + 5;\n' +
            '    } else if (b < z * 2) {\n' +
            '        c = c + x + 5;\n' +
            '    } else {\n' +
            '        c = c + z + 5;\n' +
            '    }\n' +
            '    return c;\n' +
            '}\n';
        assert.deepEqual(generateGraph(func, '1, 2, 3').replace(/\n/g, ' ').replace(/ {2}/g, ' '), "digraph cfg { forcelabels=true n0 [label=\"let a = x + 1; let b = a + y; let c = 0;\", xlabel = 1, shape=rectangle, style = filled, fillcolor = green] n1 [label=\"b < z\", xlabel = 2, shape=diamond, style = filled, fillcolor = green] n2 [label=\"c = c + 5\", xlabel = 3, shape=rectangle,] n3 [label=\"return c;\", xlabel = 4, shape=rectangle, style = filled, fillcolor = green] n4 [label=\"b < z * 2\", xlabel = 5, shape=diamond, style = filled, fillcolor = green] n5 [label=\"c = c + x + 5\", xlabel = 6, shape=rectangle, style = filled, fillcolor = green] n6 [label=\"c = c + z + 5\", xlabel = 7, shape=rectangle,] n0 -> n1 [] n1 -> n2 [label=\"T\"] n1 -> n4 [label=\"F\"] n2 -> n3 [] n4 -> n5 [label=\"T\"] n4 -> n6 [label=\"F\"] n5 -> n3 [] n6 -> n3 [] }");
    });
});

describe('example2', () => {
    it('', () => {
        let func = 'function foo(x, y, z){\n' +
            '    let a = x + 1;\n' +
            '    let b = a + y;\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    while (a < z) {\n' +
            '        c = a + b;\n' +
            '        z = c * 2;\n' +
            '        a++;\n' +
            '    }\n' +
            '    return z;\n' +
            '}\n';
        assert.deepEqual(generateGraph(func, '').replace(/\n/g, ' ').replace(/ {2}/g, ' '), "digraph cfg { forcelabels=true n0 [label=\"let a = x + 1; let b = a + y; let c = 0;\", xlabel = 1, shape=rectangle,] n1 [label=\"a < z\", xlabel = 2, shape=diamond,] n2 [label=\"c = a + b z = c * 2 a++\", xlabel = 3, shape=rectangle,] n3 [label=\"return z;\", xlabel = 4, shape=rectangle,] n0 -> n1 [] n1 -> n2 [label=\"T\"] n1 -> n3 [label=\"F\"] n2 -> n1 [] }");
    });
});

describe('basic', () => {
    it('', () => {
        let func = 'function foo(x){\n' +
            '    let a = x + 1;\n' +
            '    return a;\n' +
            '}\n';
        assert.deepEqual(generateGraph(func, '5').replace(/\n/g, ' ').replace(/ {2}/g, ' '), "digraph cfg { forcelabels=true n0 [label=\"let a = x + 1;\", xlabel = 1, shape=rectangle, style = filled, fillcolor = green] n1 [label=\"return a;\", xlabel = 2, shape=rectangle, style = filled, fillcolor = green] n0 -> n1 [] }");
    });
});

describe('array', () => {
    it('', () => {
        let func = 'function foo(x){\n' +
            '    let c = 0;\n' +
            '    \n' +
            '    if (x[0] > 5) {\n' +
            '        c = x[0];\n' +
            '    }\n' +
            '    return c;\n' +
            '}\n';
        assert.deepEqual(generateGraph(func, '[1, 2, 3]').replace(/\n/g, ' ').replace(/ {2}/g, ' '), "digraph cfg { forcelabels=true n0 [label=\"let c = 0;\", xlabel = 1, shape=rectangle, style = filled, fillcolor = green] n1 [label=\"x[0] > 5\", xlabel = 2, shape=diamond, style = filled, fillcolor = green] n2 [label=\"c = x[0]\", xlabel = 3, shape=rectangle,] n3 [label=\"return c;\", xlabel = 4, shape=rectangle, style = filled, fillcolor = green] n0 -> n1 [] n1 -> n2 [label=\"T\"] n1 -> n3 [label=\"F\"] n2 -> n3 [] }");
    });
});

describe('assignmentExpression', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x = y + 1'), {y: 1}), true);
    });
});

describe('MemberExpression', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x[0] < 1'), {x: [1]}), true);
    });
});

describe('BinaryExpression', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x < 1'), {x: 3}), true);
    });
});

describe('BinaryExpression2', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x < 2'), {x: 1}), true);
    });
});

describe('member', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x[0] = 1'), {x: [3]}), true);
    });
});

describe('assignmentExpression of array', ()=>{
    it('test subtitute code',()=>{
        assert.deepEqual(evaluate(parseCode('x = [1]'), {x: [3]}), true);
    });
});