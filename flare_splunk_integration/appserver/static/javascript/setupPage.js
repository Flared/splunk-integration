"use strict";

var appName = "flare_splunk_integration";

require.config({
    paths: {
        app: "../app/" + appName + "/javascript/views/app",
        react: "../app/" + appName + "/javascript/vendor/react.production.min",
        ReactDOM: "../app/" + appName + "/javascript/vendor/react-dom.production.min",
    },
    scriptType: "module",
});

require([
    "react",
    "ReactDOM",
    "app",
], function (react, ReactDOM, app) {
    ReactDOM.render(app, document.getElementById('app'));
});
