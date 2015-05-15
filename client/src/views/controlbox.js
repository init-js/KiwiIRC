/*jshint strict: false */
/*global $ kiwi _kiwi Backbone _M */

_kiwi.view.ControlBox = Backbone.View.extend({
    events: {
        'keydown .inp': 'process',
        'click .nick': 'showNickChange',
        'click .security': 'securityToggle',
        'click .bsub': 'onSubmitButtonClick'
    },

    initialize: function () {
        var that = this;

        this.buffer = [];  // Stores previously run commands
        this.buffer_pos = 0;  // The current position in the buffer

        this.preprocessor = new InputPreProcessor();
        this.preprocessor.recursive_depth = 5;

        this.isSecure = false;

        // Hold tab autocomplete data
        this.tabcomplete = {active: false, data: [], prefix: ''};

        // Keep the nick view updated with nick changes
        _kiwi.app.connections.on('change:nick', function(connection) {
            // Only update the nick view if it's the active connection
            if (connection !== _kiwi.app.connections.active_connection)
                return;

            $('.nick', that.$el).text(connection.get('nick'));
        });

        // Update our nick view as we flick between connections
        _kiwi.app.connections.on('active', function(panel, connection) {
            $('.nick', that.$el).text(connection.get('nick'));
            console.debug("control box connection change", panel, connection);
        });

        // Keep focus on the input box as we flick between panels
        _kiwi.app.panels.bind('active', function (active_panel) {
            if (active_panel.isChannel() || active_panel.isServer() || active_panel.isQuery()) {
                that.$('.inp').focus();
            }
            console.debug("control box panel change", active_panel);
            if (active_panel.isChannel() || active_panel.isQuery()) {
                that.render();
            }
        });
    },

    getSecureInput: function () {
        var active_panel = _kiwi.app.panels().active;
        var convid = (active_panel && active_panel.get('convid')) || null;
        var that = this;
        if (convid) {
            var $secure = that.$('.secureinp[data-convid="' + convid + '"]');
            if ($secure.length < 1) {
                console.log("Creating private input area for convid:", convid);
                $secure = $('<span class="secureinp" data-convid="' + convid + '">' +
                              '<input placeholder="Enter message securely..."></input>' +
                            '</span>');
                $secure.hide();
                that.$('.input_wrap').append($secure);
                _M.mark_private($secure[0], convid);
            }
            return that.$('.secureinp[data-convid="' + convid + '"]');
        }
        return $();
    },

    render: function () {
        var send_message_text = translateText('client_views_controlbox_message');
        this.$('.inp').attr('placeholder', send_message_text);
        this.$('.security').find('[data-secure]').hide();
        this.$('.security').find('[data-secure=' + !!this.isSecure + ']').show();

        var $secure = this.getSecureInput();

        // Flip input between secure and plain
        if (this.isSecure && $secure.length > 0) {
            this.$('.secureinp').hide();
            this.$('.inp').hide();
            $secure.show();
        } else {
            this.$('.secureinp').hide();
            this.$('.inp').show();
        }
        return this;
    },

    securityToggle: function () {
        this.setSecure(!this.isSecure);
    },

    setSecure: function (val) {
        this.isSecure = val;
        this.render();
    },

    onSubmitButtonClick: function (ev) {
        ev.preventDefault();
        this.submitLine();
        return false;
    },

    setEncryptionKey: function (newKey) {
        var oldKey = this.convid;
        this.convid = newKey;
        if (oldKey !== newKey) {
            console.debub("controlbox swap conversation id old:" + oldKey + " new:" + newKey);
        }
    },

    showNickChange: function (ev) {
        // Nick box already open? Don't do it again
        if (this.nick_change)
            return;

        this.nick_change = new _kiwi.view.NickChangeBox();
        this.nick_change.render();

        this.listenTo(this.nick_change, 'close', function() {
            delete this.nick_change;
        });
    },

    _submitSecureLine: function () {
        var $inp = this.$el.find('.inp');
        var that = this;

        var $secure = this.getSecureInput();
        if ($secure.length < 1) {
            console.log("no secure box");
            return;
        }

        _M.lighten($secure[0]).then(function (ciphertext) {
            that.processInput("/micasa " + _kiwi.app.panels().active.get('name') + ' ' + ciphertext);
        });

        $inp.val('');
        that.$('.inp').focus();
    },

    submitLine: function () {
        var $inp = this.$el.find('.inp');
        var inp_val = $inp.val();
        var that = this;

        if (this.isSecure) {
            this._submitSecureLine();
            return false;
        }

        if (inp_val) {
            $.each(inp_val.split('\n'), function (idx, line) {
                that.processInput(line);
            });
            that.buffer.push(inp_val);
            that.buffer_pos = that.buffer.length;
        }
        $inp.val('');
        that.$('.inp').focus();
    },

    process: function (ev) {
        var that = this,
            inp = $(ev.currentTarget),
            inp_val = inp.val(),
            meta;

        if (navigator.appVersion.indexOf("Mac") !== -1) {
            meta = ev.metaKey;
        } else {
            meta = ev.altKey;
        }

        // If not a tab key, reset the tabcomplete data
        if (this.tabcomplete.active && ev.keyCode !== 9) {
            this.tabcomplete.active = false;
            this.tabcomplete.data = [];
            this.tabcomplete.prefix = '';
        }

        switch (true) {
        case (ev.keyCode === 13):              // return
            inp_val = inp_val.trim();

            this.submitLine();
            return false;

        case (ev.keyCode === 38):              // up
            if (this.buffer_pos > 0) {
                this.buffer_pos--;
                inp.val(this.buffer[this.buffer_pos]);
            }
            //suppress browsers default behavior as it would set the cursor at the beginning
            return false;

        case (ev.keyCode === 40):              // down
            if (this.buffer_pos < this.buffer.length) {
                this.buffer_pos++;
                inp.val(this.buffer[this.buffer_pos]);
            }
            break;

        case (ev.keyCode === 219 && meta):            // [ + meta
            // Find all the tab elements and get the index of the active tab
            var $tabs = $('#kiwi .tabs').find('li[class!=connection]');
            var cur_tab_ind = (function() {
                for (var idx=0; idx<$tabs.length; idx++){
                    if ($($tabs[idx]).hasClass('active'))
                        return idx;
                }
            })();

            // Work out the previous tab along. Wrap around if needed
            if (cur_tab_ind === 0) {
                $prev_tab = $($tabs[$tabs.length - 1]);
            } else {
                $prev_tab = $($tabs[cur_tab_ind - 1]);
            }

            $prev_tab.click();
            return false;

        case (ev.keyCode === 221 && meta):            // ] + meta
            // Find all the tab elements and get the index of the active tab
            var $tabs = $('#kiwi .tabs').find('li[class!=connection]');
            var cur_tab_ind = (function() {
                for (var idx=0; idx<$tabs.length; idx++){
                    if ($($tabs[idx]).hasClass('active'))
                        return idx;
                }
            })();

            // Work out the next tab along. Wrap around if needed
            if (cur_tab_ind === $tabs.length - 1) {
                $next_tab = $($tabs[0]);
            } else {
                $next_tab = $($tabs[cur_tab_ind + 1]);
            }

            $next_tab.click();
            return false;

        case (ev.keyCode === 9     //Check if ONLY tab is pressed
            && !ev.shiftKey        //(user could be using some browser
            && !ev.altKey          //keyboard shortcut)
            && !ev.metaKey
            && !ev.ctrlKey):
            this.tabcomplete.active = true;
            if (_.isEqual(this.tabcomplete.data, [])) {
                // Get possible autocompletions
                var ac_data = [],
                    members = _kiwi.app.panels().active.get('members');

                // If we have a members list, get the models. Otherwise empty array
                members = members ? members.models : [];

                $.each(members, function (i, member) {
                    if (!member) return;
                    ac_data.push(member.get('nick'));
                });

                ac_data.push(_kiwi.app.panels().active.get('name'));

                ac_data = _.sortBy(ac_data, function (nick) {
                    return nick.toLowerCase();
                });
                this.tabcomplete.data = ac_data;
            }

            if (inp_val[inp[0].selectionStart - 1] === ' ') {
                return false;
            }

            (function () {
                var tokens,              // Words before the cursor position
                    val,                 // New value being built up
                    p1,                  // Position in the value just before the nick
                    newnick,             // New nick to be displayed (cycles through)
                    range,               // TextRange for setting new text cursor position
                    nick,                // Current nick in the value
                    trailing = ': ';     // Text to be inserted after a tabbed nick

                tokens = inp_val.substring(0, inp[0].selectionStart).split(' ');
                if (tokens[tokens.length-1] == ':')
                    tokens.pop();

                // Only add the trailing text if not at the beginning of the line
                if (tokens.length > 1)
                    trailing = '';

                nick  = tokens[tokens.length - 1];

                if (this.tabcomplete.prefix === '') {
                    this.tabcomplete.prefix = nick;
                }

                this.tabcomplete.data = _.select(this.tabcomplete.data, function (n) {
                    return (n.toLowerCase().indexOf(that.tabcomplete.prefix.toLowerCase()) === 0);
                });

                if (this.tabcomplete.data.length > 0) {
                    // Get the current value before cursor position
                    p1 = inp[0].selectionStart - (nick.length);
                    val = inp_val.substr(0, p1);

                    // Include the current selected nick
                    newnick = this.tabcomplete.data.shift();
                    this.tabcomplete.data.push(newnick);
                    val += newnick;

                    if (inp_val.substr(inp[0].selectionStart, 2) !== trailing)
                        val += trailing;

                    // Now include the rest of the current value
                    val += inp_val.substr(inp[0].selectionStart);

                    inp.val(val);

                    // Move the cursor position to the end of the nick
                    if (inp[0].setSelectionRange) {
                        inp[0].setSelectionRange(p1 + newnick.length + trailing.length, p1 + newnick.length + trailing.length);
                    } else if (inp[0].createTextRange) { // not sure if this bit is actually needed....
                        range = inp[0].createTextRange();
                        range.collapse(true);
                        range.moveEnd('character', p1 + newnick.length + trailing.length);
                        range.moveStart('character', p1 + newnick.length + trailing.length);
                        range.select();
                    }
                }
            }).apply(this);
            return false;
        }
    },


    processInput: function (command_raw) {
        var that = this,
            command, params, events_data,
            pre_processed;

        // If sending a message when not in a channel or query window, automatically
        // convert it into a command
        if (command_raw[0] !== '/' && !_kiwi.app.panels().active.isChannel() && !_kiwi.app.panels().active.isQuery()) {
            command_raw = '/' + command_raw;
        }

        // The default command
        if (command_raw[0] !== '/' || command_raw.substr(0, 2) === '//') {
            // Remove any slash escaping at the start (ie. //)
            command_raw = command_raw.replace(/^\/\//, '/');

            // Prepend the default command
            //FIXME -- you want to send that to the actual target -- not the name of the tab
            command_raw = '/msg ' + _kiwi.app.panels().active.get('name') + ' ' + command_raw;
        }

        // Process the raw command for any aliases
        this.preprocessor.vars.server = _kiwi.app.connections.active_connection.get('name');
        this.preprocessor.vars.channel = _kiwi.app.panels().active.get('name');
        this.preprocessor.vars.destination = this.preprocessor.vars.channel;
        command_raw = this.preprocessor.process(command_raw);

        // Extract the command and parameters
        params = command_raw.split(/\s/);
        if (params[0][0] === '/') {
            command = params[0].substr(1).toLowerCase();
            params = params.splice(1, params.length - 1);
        } else {
            // Default command
            command = 'msg';
            params.unshift(_kiwi.app.panels().active.get('name'));
        }

        // Emit a plugin event for any modifications
        events_data = {command: command, params: params};

        _kiwi.global.events.emit('command', events_data)
        .then(function() {
            // Trigger the command events
            that.trigger('command', {command: events_data.command, params: events_data.params});
            that.trigger('command:' + events_data.command, {command: events_data.command, params: events_data.params});

            // If we didn't have any listeners for this event, fire a special case
            // TODO: This feels dirty. Should this really be done..?
            if (!that._events['command:' + events_data.command]) {
                that.trigger('unknown_command', {command: events_data.command, params: events_data.params});
            }
        });
    },


    addPluginIcon: function ($icon) {
        var $tool = $('<div class="tool"></div>').append($icon);
        this.$el.find('.input_tools').append($tool);
        _kiwi.app.view.doLayout();
    }
});
