var Model = Backbone.Model.extend({});

var Collection = Backbone.Collection.extend({
    model: Model,
    /**
     * Url de la cual se obtiene el recurso.
     * @function
     * @retruns {String} Un cadena que representa la url del recurso
     */
    url: function () {
        return "https://api.github.com/users/mbaez/events";
    },
});

Backbone.Storage.inicialize({
    trigger: true
});


function getData(){
    var testColl = new Collection();
    var start = new Date();
    testColl.on("ready",function(data){
        var end = new Date();
        var textArea = document.getElementById("json");
        textArea.value = JSON.stringify(data.response, undefined, 2);
        $("#timer" ).append($('<li class="list-group-item">'+ (end - start )+ '</li>' ));
    });
    testColl.fetch();
}
