/* global $CC, Utils, $SD */

/**
 * Here are a couple of wrappers we created to help you quickly setup
 * your plugin and subscribe to events sent by Stream Deck to your plugin.
 */

/**
 * The 'connected' event is sent to your plugin, after the plugin's instance
 * is registered with Stream Deck software. It carries the current websocket
 * and other information about the current environmet in a JSON object
 * You can use it to subscribe to events you want to use in your plugin.
 */

const IP = "http://localhost:8080/";
const API = "/api/";

$SD.on('connected', (jsonObj) => connected(jsonObj));

function connected(jsn) {
    // Subscribe to the willAppear and other events
    $SD.on('com.elgato.template.action.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('com.elgato.template.status.willAppear', (jsonObj) => action.onWillAppear(jsonObj));
    $SD.on('com.elgato.template.action.keyUp', (jsonObj) => action.onKeyUp(jsonObj));
    $SD.on('com.elgato.template.status.keyUp', (jsonObj) => action.onStatus(jsonObj));
    $SD.on('com.elgato.template.action.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.elgato.template.status.sendToPlugin', (jsonObj) => action.onSendToPlugin(jsonObj));
    $SD.on('com.elgato.template.action.didReceiveSettings', (jsonObj) => action.onDidReceiveSettings(jsonObj));
    $SD.on('com.elgato.template.status.didReceiveSettings', (jsonObj) => action.addStatusToContext(jsonObj));
    $SD.on('com.elgato.template.status.propertyInspectorDidAppear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]StatusPropertyInspectorDidAppear:');
        action.sendToPropertyInspector(jsonObj);
    });
    $SD.on('com.elgato.template.action.propertyInspectorDidAppear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: black; font-size: 13px;', '[app.js]propertyInspectorDidAppear:');
        console.log(action.settings);
    });
    $SD.on('com.elgato.template.action.propertyInspectorDidDisappear', (jsonObj) => {
        console.log('%c%s', 'color: white; background: red; font-size: 13px;', '[app.js]propertyInspectorDidDisappear:');
    });
};

// ACTIONS

const action = {
    contextAvailabilities: new Map(),
    loginContext: "",
    settings: {},
    onDidReceiveSettings: function (jsn) {
        console.log('%c%s', 'color: white; background: red; font-size: 15px;', '[app.js]onDidReceiveSettings:');

        temp = Utils.getProp(jsn, 'payload.settings', {});
        this.settings = temp;
        console.log(this.settings);
        this.doSomeThing(this.settings, 'onDidReceiveSettings', 'orange');
        if (this.settings.statusDropdown) {
            console.log("This is StatusId", this.settings.statusDropdown)
        }
        /**
         * In this example we put a HTML-input element with id='mynameinput'
         * into the Property Inspector's DOM. If you enter some data into that
         * input-field it get's saved to Stream Deck persistently and the plugin
         * will receive the updated 'didReceiveSettings' event.
         * Here we look for this setting and use it to change the title of
         * the key.
         */

        this.setTitle(jsn);
    },

    addStatusToContext: function (jsn) {
        console.log(jsn);
        this.contextAvailabilities.set(jsn.context, [jsn.payload.settings.message, jsn.payload.settings.statusDropdown]);

        console.log("Context Array", this.contextAvailabilities.get(jsn.context));
        this.setTitle(jsn.context, this.settings);
        // console.log(this.contextAvailabilities);
    },

    /** 
     * The 'willAppear' event is the first event a key will receive, right before it gets
     * shown on your Stream Deck and/or in Stream Deck software.
     * This event is a good place to setup your plugin and look at current settings (if any),
     * which are embedded in the events payload.
     */

    onWillAppear: function (jsn) {
        console.log("You can cache your settings in 'onWillAppear'", jsn.payload.settings);

        /**
         * The willAppear event carries your saved settings (if any). You can use these settings
         * to setup your plugin or save the settings for later use. 
         * If you want to request settings at a later time, you can do so using the
         * 'getSettings' event, which will tell Stream Deck to send your data 
         * (in the 'didReceiveSettings above)
         * 
         * $SD.api.getSettings(jsn.context);
         */
        if (jsn.payload.settings.hasOwnProperty('statusDropdown')) {
            this.contextAvailabilities.set(jsn.context, [jsn.payload.settings.message, jsn.payload.settings.statusDropdown]);
        }
        else {
            context = jsn.context;
            this.settings[context] = {};
            Object.keys(jsn.payload.settings).forEach(key => this.settings[context][key] = jsn.payload.settings[key]);
            console.log("this is settings for ", jsn.context, " value", this.settings);
        }
        // Nothing in the settings pre-fill, just something for demonstration purposes
        if (!this.settings || Object.keys(this.settings).length === 0) {
            this.settings[context].mynameinput = 'APPTAGEN';
        }
        this.setTitle(jsn);
    },

    sendToPropertyInspector: function (jsn) {
        let context = this.loginContext;
        if (context.length <= 0) {
            for (button in this.settings) {
                console.log("this is button ", button);
                if (this.settings[button].hasOwnProperty('ip')) {
                    context = button;
                    console.log("context", context);
                    break;
                }
            }
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            console.log("This is context for PI Select", jsn.context);
            if (!!this.contextAvailabilities.get(jsn.context)) {
                selected = this.contextAvailabilities.get(jsn.context)[1];
            }
            else {
                selected = "";
            }
            xhr.addEventListener("readystatechange", function () {
                let payload = {};
                if (this.readyState === 4) {
                    response = JSON.parse(this.responseText);
                    if (!!selected) {
                        payload = selected;
                    }

                    console.log("sendToPI", payload);
                    $SD.api.sendToPropertyInspector(jsn.context, { response, payload }, "sendToPropertyInspector");
                }
            });

            xhr.open("GET", "http://" + this.settings[context].ip + API + "status/all");

            xhr.send();

        } else if (context.length > 0) {
            if (this.settings[context].hasOwnProperty('ip')) {
                var xhr = new XMLHttpRequest();
                xhr.withCredentials = true;
                console.log("This is context for PI Select", jsn.context);
                if (!!this.contextAvailabilities.get(jsn.context)) {
                    selected = this.contextAvailabilities.get(jsn.context)[1];
                }
                else {
                    selected = "";
                }
                xhr.addEventListener("readystatechange", function () {
                    let payload = {};
                    if (this.readyState === 4) {
                        response = JSON.parse(this.responseText);
                        if (!!selected) {
                            payload = selected;
                        }

                        console.log("sendToPI", payload);
                        $SD.api.sendToPropertyInspector(jsn.context, { payload }, "sendToPropertyInspector");
                    }
                });

                xhr.open("GET", "http://" + this.settings[context].ip + API + "status/all");

                xhr.send();
            }
        } else {
            console.log("please enter IP in your Login action and login for Availabilty requests");
        }

    },

    onStatus: async function (jsn) {
        context = this.loginContext;
        if (this.settings[context].hasOwnProperty('ip')) {
            if (!!this.settings[context].accessToken) {
                var availabilityId = this.contextAvailabilities.get(jsn.context);
                var data = JSON.stringify({
                    "message": availabilityId[0],
                    "availabilityId": availabilityId[1]
                });

                var xhr = new XMLHttpRequest();
                xhr.withCredentials = true;

                xhr.addEventListener("readystatechange", function () {
                    if (this.readyState === 4) {
                        console.log(this.responseText);
                    }
                });
                var url = "http://" + this.settings[context].ip + API + "user/" + this.settings[context].id + "/status";
                xhr.open("PUT", url);
                xhr.setRequestHeader("Content-Type", "application/json");

                xhr.send(data);
            }
            if (!this.settings[context].accessToken) {
                this.settings[context].mynameinput = "Please Log In";
                this.setTitle(jsn.context, this.settings);
            }
            // $SD.api.getGlobalSettings(null);
        } else {
            console.log("please enter IP in your Login for Status Updates");
        }
    },

    onKeyUp: async function (jsn) {
        this.doSomeThing(jsn, 'onKeyUp', 'green');
        var temp = await this.onLoginRequest(jsn, this.settings);
        console.log("response", this.settings);
        this.loginContext = jsn.context;
    },

    onLoginRequest: async function (jsn, settings) {
        context = jsn.context;
        var data = JSON.stringify({
            "username": settings[context].username,
            "password": settings[context].password
        });
        if (this.settings[context].hasOwnProperty('ip')) {
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;

            xhr.addEventListener("readystatechange", function () {
                if (this.readyState === 4) {
                    console.log(this.responseText);
                    response = JSON.parse(this.responseText);
                    settings[context].username = response.username;
                    settings[context].id = response.id;
                    settings[context].status = response.status;
                    settings[context].accessToken = response.accessToken;
                    settings[context].refreshToken = response.refreshToken;
                    settings[context].roles = response.roles;
                }
            });
            var url = "http://" + this.settings[context].ip + API + "auth/signin";
            xhr.open("POST", url);
            xhr.setRequestHeader("Content-Type", "application/json");

            xhr.send(data);
        }
        else {

            console.log("please enter IP in your Login requests");
        }

    },

    onSendToPlugin: function (jsn) {
        /**
         * This is a message sent directly from the Property Inspector 
         * (e.g. some value, which is not saved to settings) 
         * You can send this event from Property Inspector (see there for an example)
         */

        const sdpi_collection = Utils.getProp(jsn, 'payload.sdpi_collection', {});
        if (sdpi_collection.value && sdpi_collection.value !== undefined) {
            this.doSomeThing({ [sdpi_collection.key]: sdpi_collection.value }, 'onSendToPlugin', 'fuchsia');
        }
    },

    /**
     * This snippet shows how you could save settings persistantly to Stream Deck software.
     * It is not used in this example plugin.
     */

    saveSettings: function (jsn, sdpi_collection) {
        console.log('saveSettings:', jsn);
        if (sdpi_collection.hasOwnProperty('key') && sdpi_collection.key != '') {
            if (sdpi_collection.value && sdpi_collection.value !== undefined) {
                this.settings[sdpi_collection.key] = sdpi_collection.value;
                console.log('setSettings....', this.settings);
                $SD.api.setSettings(jsn.context, this.settings);
            }
        }
    },

    /**
     * Here's a quick demo-wrapper to show how you could change a key's title based on what you
     * stored in settings.
     * If you enter something into Property Inspector's name field (in this demo),
     * it will get the title of your key.
     * 
     * @param {JSON} jsn // The JSON object passed from Stream Deck to the plugin, which contains the plugin's context
     * 
     */

    setTitle: function (jsn) {
        if (this.settings[jsn.context] && this.settings[jsn.context].hasOwnProperty('mynameinput')) {
            if (this.contextAvailabilities.has(jsn.context)) {
                this.settings[jsn.context].mynameinput = this.contextAvailabilities.get(jsn.context)[0];
            }
            console.log("watch the key on your StreamDeck - it got a new title...", this.settings[jsn.context].mynameinput);
            $SD.api.setTitle(jsn.context, this.settings[jsn.context].mynameinput);

        }
    },

    /**
     * Finally here's a method which gets called from various events above.
     * This is just an idea on how you can act on receiving some interesting message
     * from Stream Deck.
     */

    doSomeThing: function (inJsonData, caller, tagColor) {
        console.log('%c%s', `color: white; background: ${tagColor || 'grey'}; font-size: 15px;`, `[app.js]doSomeThing from: ${caller}`);
        // console.log(inJsonData);
    },


};

