var socketService = {
    data: {},
    set: function (key, value) {
        this.data[key] = value;
        return this;
    },
    get: function (key) {
        return this.data[key];
    },
    clear: function (key) {
        delete this.data[key];
    }
};

module.exports = socketService;