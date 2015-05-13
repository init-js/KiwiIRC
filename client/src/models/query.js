_kiwi.model.Query = _kiwi.model.Channel.extend({
    initialize: function (attributes) {
        var name = this.get("name") || "",
            convid = this.get("convid") || null,
            isEncrypted = !!this.get("convid"),
            displayName = this.get("displayName") || name,
            members;

        this.view = new _kiwi.view.Channel({"model": this,
                                            "name": name,
                                            "convid": convid,
                                            "displayName": displayName,
                                            "isEncrypted": isEncrypted});
        this.set({
            "name": name,
            "displayName": displayName,
            "convid": convid,
            "isEncrypted": isEncrypted,
            "scrollback": []
        }, {"silent": true});

        _kiwi.global.events.emit('panel:created', {panel: this});
    },

    isChannel: function () {
        return false;
    },

    isQuery: function () {
        return true;
    }
});