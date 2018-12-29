import $ from 'jquery';
import {parseCode, substituteCode, getLines} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let originCodeInput = $('#originCodeInput').val().replace(/ {4}\n+/g, '\n').replace(/\t\r\n/g, '\n').replace(/\n\n/g, '\n');
        let withoutArgs = substituteCode(parseCode(originCodeInput), {}, '', false);

        let args = $('#funcArgsInput').val();
        let withArgs = substituteCode(parseCode(originCodeInput),{} ,args, true);

        let lines = getLines(withoutArgs['substituted'], withArgs['greenLines'], withArgs['redLines'], withoutArgs['ignoreRows']);
        $('#substituteCodeResult').empty();
        for(let i= 0; i < lines.length; i++)
            $('#substituteCodeResult').append('<span style="color:' + lines[i].color + ';">' + lines[i].line + '</span><br>');
    });
});
