_kiwi.view.Member = Backbone.View.extend({
    tagName: "li",
    initialize: function (options) {
        this.model.bind('change', this.render, this);
        this.render();
    },
    render: function () {
        var $this = this.$el, isEnc,
            prefix_css_class = (this.model.get('modes') || []).join(' ');

        $this.attr('class', 'mode ' + prefix_css_class);
        if (this.model.get('friend')) {
            isEnc = '<span class="enc">Enc</span>';
        } else {
            isEnc = "";
        }
        $this.html('<a class="nick">' + isEnc + '<span class="prefix">' + this.model.get("prefix") + '</span>' + this.model.get("nick") + '</a>');

        return this;
    }
});