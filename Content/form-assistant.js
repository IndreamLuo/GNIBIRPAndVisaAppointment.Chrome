var formAssistant = {
    applyScript: function (script) {
        var scriptNode = document.createElement('script');
        scriptNode.innerHTML = script;
        window.document.body.appendChild(scriptNode);
    },

    run: function (run) {
        formAssistant.applyScript('(run());'.replace('run', run.toString()));
    }
}
