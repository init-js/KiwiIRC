_kiwi.model.NewConnection = Backbone.Collection.extend({
    initialize: function() {
        this.view = new _kiwi.view.ServerSelect({model: this});

        this.view.bind('server_connect', this.onMakeConnection, this);

    },


    populateDefaultServerSettings: function() {
        var defaults = _kiwi.global.defaultServerSettings();
        this.view.populateFields(defaults);
    },


    onMakeConnection: function(new_connection_event) {
        var that = this;

        this.connect_details = new_connection_event;

        this.view.networkConnecting();

        _kiwi.gateway.newConnection({
            nick: new_connection_event.nick,
            host: new_connection_event.server,
            port: new_connection_event.port,
            ssl: new_connection_event.ssl,
            password: new_connection_event.password,
            options: new_connection_event.options
        }, function(err, network) {
            that.onNewNetwork(err, network);
        });
    },


    onNewNetwork: function(err, network) {
        var that = this;

        // Show any errors if given
        if (err) {
            this.view.showError(err);
        }

        if (network && this.connect_details) {
            network.auto_join = {
                channel: this.connect_details.channel,
                key: this.connect_details.channel_key
            };
            var nick = that.connect_details.nick;

            _M.use_keyring(nick).then(function () {
		console.log("opened keyring " + nick);
		return network;
            })["catch"](function (err) {
		console.error("failed to open keyring " + nick, err);
		if (err.code === "NOKEYRING") {
                    return _M.new_keyring(nick).then(function () {
			return network;
                    });
		} else {
                    throw err;
                }
            }).then(function (network) {
                that.trigger('new_network', network);
            })["catch"](function (err) {
                that.view.showError(err);
            });
        }
    }
});