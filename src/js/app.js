import $ from 'jquery';
import Viz from 'viz.js';
import {Module, render} from 'viz.js/full.render.js';
import {generateGraph} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let graph = generateGraph($('#originCodeInput').val(), $('#funcArgsInput').val());
        let viz = new Viz({ Module, render });
        viz.renderSVGElement(graph).then(function(graph) {
            $('#generatedGraph').html(graph);
        });
    });
});
