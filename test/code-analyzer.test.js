import assert from 'assert';
import {parseCode, substituteCode, getLines} from '../src/js/code-analyzer';

describe('Empty Function', () => {
    it('', () => {
        let code = 'function foo(){\nreturn 1;\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [{line:'function foo() {', color:'black'},{line:'    return 1;', color:'black'},{line:'}', color:'black'}]);});
});

describe('Number Argument', () => {
    it('', () => {
        let code = 'function foo(x){\nreturn 1;\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '1', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [{line:'function foo(x) {', color:'black'}, {line:'    return 1;', color:'black'}, {line:'}', color:'black'}]);});

});

describe('String Argument', () => {
    it('', () => {
        let code = 'function foo(x){\nlet a = "a";\nif(a == x){\nreturn x + a;\n}else{\nreturn a\n}\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '"b"', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    if (\'a\' == x) {', color:'red'},
                {line:'        return x + \'a\';', color:'black'},
                {line:'    } else {', color:'green'},
                {line:'        return \'a\';', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Array Argument', () => {
    it('with if condition', () => {
        let code = 'function foo(x){\n    x[0] = 0;\n    return x[0];\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '[1,2,3]', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    x[0] = 0;', color:'black'},
                {line:'    return x[0];', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Not Evaluated If', () => {
    it('', () => {
        let code = 'function foo(x){\n   if(x < a) {\n        return x;\n   } else {\n   return 0;\n   }\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '1', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    if (x < a) {', color:'black'},
                {line:'        return x;', color:'black'},
                {line:'    } else {', color:'black'},
                {line:'        return 0;', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('While Statement', () => {
    it('', () => {
        let code = 'function foo(x){\n   while(x[1] < x[2]) {\n        x[1] = x[1] + x[2];\n        x[2]++;\n   }\n    return x;\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '[1,2,3]', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x) {', color:'black'},
                {line:'    while (x[1] < x[2]) {', color:'black'},
                {line:'        x[1] = x[1] + x[2];', color:'black'},
                {line:'        x[2]++;', color:'black'},
                {line:'    }', color:'black'},
                {line:'    return x;', color:'black'},
                {line:'}', color:'black'}]);});
});


describe('Symbolic - from assignment', () => {
    it('', () => {
        let code = 'function foo(x, y, z){\n    let a = x + 1;\n    let b = a + y;\n    let c = 0;\n    if (b < z) {\n        c = c + 5;\n        return x + y + z + c;\n    } else if (b < z * 2) {\n        c = c + x + 5;\n        return x + y + z + c;\n    } else {\n        c = c + z + 5;\n        return x + y + z + c;\n    }\n}\n';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '1,2,3', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x, y, z) {', color:'black'},
                {line:'    if (x + 1 + y < z) {', color:'red'},
                {line:'        return x + y + z + 5;', color:'black'},
                {line:'    } else if (x + 1 + y < z * 2) {', color:'green'},
                {line:'        return x + y + z + (0 + x + 5);', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return x + y + z + (0 + z + 5);', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Array Assignment', () => {
    it('', () => {
        let code = 'let y = [7 ,8, 9];\nfunction foo(y){\n   let a = [4 ,5, 6];\n   if(a[0] < y[0]) {\n        return y[1];\n   } else {\n   return a[2];\n   }\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '[1,2,3]', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'let y = [    7,    8,    9];', color:'black'},
                {line:'function foo(y) {', color:'black'},
                {line:'    if (4 < y[0]) {', color:'red'},
                {line:'        return y[1];', color:'black'},
                {line:'    } else {', color:'green'},
                {line:'        return 6;', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Substitute array property', () => {
    it('', () => {
        let code = 'function foo(x,y){\n   let a = y+1\n   if(x[y] < x[y+1]) {\n        return x[a];\n   } else {\n   return x[a-1];\n   }\n}'; let args = '[1,2,3],1';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, args, true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo(x, y) {', color:'black'},
                {line:'    if (x[y] < x[y + 1]) {', color:'green'},
                {line:'        return x[y + 1];', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return x[y + 1 - 1];', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});

describe('Literal If', () => {
    it('', () => {
        let code = 'function foo(){\n   if(true) {\n        return 1;\n   } else {\n   return 0;\n   }\n}';
        let withoutArgs = substituteCode(parseCode(code), {}, '', false);
        let withArgs = substituteCode(parseCode(code), {}, '', true);
        assert.deepEqual(getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']),
            [
                {line:'function foo() {', color:'black'},
                {line:'    if (true) {', color:'green'},
                {line:'        return 1;', color:'black'},
                {line:'    } else {', color:'red'},
                {line:'        return 0;', color:'black'},
                {line:'    }', color:'black'},
                {line:'}', color:'black'}]);});
});
