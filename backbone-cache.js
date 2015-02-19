/**
 * Se encarga de manejar el alamacenamiento de datos en de forma global
 * en la sesión.
 *
 * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
 */
Backbone.Storage = {
    /**
     * Variable que almacena el tiempo de permanencia de los objetos en memoria.
     * @type Object
     * @field
     */
    storageTime: 300000,

    /**
     * Variable que indica el tiempo de el intervalo en el que se ejecutará el
     * garbage collector.
     * @type Object
     * @field
     */
    collectorInterval: 1000,
    /**
     * El tiempo que se espera para disparar el evento.
     * garbage collector.
     * @type Object
     * @field
     */
    cacheDelay: 500,

    /**
     * Indica si se va utilizar un callback por defecto y se va disparar evento.
     * garbage collector.
     * @type Object
     * @field
     */
    trigger: false,

    /**
     * Variable que almacena datos en memoria
     * @type Object
     * @field
     */
    memory: {},
    /**
     * Variable que almacena el acceso a datos.
     * @type Object
     * @field
     */
    access: {},

    /**
     * Consutuctor del memory Storage de backbone.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     * @param {Object}options el json que contiene los datos.
     * @config {Number}[cacheDelay]
     * @config {Number}[storageTime]
     * @config {Boolean}[trigger] Si es true dispara un evento
     * @config {Boolean}[garbageCollector]
     * @config {Boolean}[collectorInterval]
     */
    inicialize: function (options) {
        if (typeof options != "undefined") {
            for (var key in options) {
                this[key] = options[key];
            }
        }

        this.overrideFetch();
        if (this.garbageCollector) {
            this.activateCollector();
        }
    },

    /**
     * Se encarga de añadir un elemento.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     * @param {String}key el identificador del elemento.
     * @param {Object}value el valor a añadir.
     */
    set: function (key, value) {
        this.memory[key] = value;
        this.access[key] = {
            count: 0,
            timestamp: new Date()
        };
    },

    /**
     * Se encarga de obtener el valor de un elemento de la variable de memoria.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     * @param {String}key el identificador del elemento.
     * @return {Object} el value de asociado al key.
     */
    get: function (key) {
        if (typeof this.access[key] !== "undefined") {
            this.access[key].count += 1;
            this.access[key].timestamp = new Date();
        }
        return this.memory[key];
    },

    /**
     * Se encarga de verificar si el elmento ya se encuentra en la
     * variable de memoria.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     * @param {String}key el identificador del elemento.
     * @return {Boolean} True si el elemento ya existe. En caso contrario
     * retorna False.
     */
    contains: function (key) {
        return (typeof this.memory[key] != 'undefined');
    },

    /**
     * Se encarga de eliminar un elemento de la variable de memoria.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     * @param {String}key el identificador del elemento.
     */
    remove: function (key) {
        this.memory[key] = undefined;
        this.access[key] = undefined;
        delete this.memory[key];
        delete this.access[key];
    },

    /**
     * Se encarga de eliminar todos los atributos de la variable de memoria.
     * Aplica un remove a todos los elementos.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    clear: function () {
        this.memory = null;
        for (var key in this.memory) {
            this.remove(key);
        }
        this.memory = {};
        this.access = {};
    },

    /**
     * Se encarga de verificar el tiempo de permanencia de los objetos que se encuentran
     * en memoria. Si un objeto no fue utilizado por un tiempo mayor al definido por
     * la varialbe storageTime, el elemento se elimina de la memeoria.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    garbageCollector: function () {
        var now = new Date();
        for (var key in this.access) {
            var delta = now - this.access[key].timestamp;
            if (delta >= this.storageTime) {
                this.remove(key);
            }
        }
    },

    /**
     * Handler base de los
     * <a href="http://backbonejs.org/#Collection-fetch">collection</a> y
     * <a href ="http://backbonejs.org/#Model-fetch">models de backbone</a>,
     * se utiliza para implementar el patron ready de backbone.
     *
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    callback: {
        /**
         * Handler del success de una petición, dispara el evento `ready` para
         * que sea manejado por el objeto de origen.
         *
         * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
         * @params {Backbone.Events}data es la referencia al objeto que inicio
         *          la petición. Puede ser un model o un collection.
         * @params {String}response la respuesta del servico en un objeto xhr.
         * @params {String}[options]
         */
        success: function (target, response, options) {
            var params = {};
            params.target = target;
            params.response = response;
            params.options = options;
            //se cachean los datos
            if (target.cache != false) {
                Backbone.Storage.set(target.url(), params);
            }
            if (Backbone.Storage.trigger) {
                target.trigger('ready', params);
            } else {
                target._oldCallback.success(target, response, options);
            }
        },
        /**
         * Handler del error de una petición, dispara el evento `error` para
         * que sea manejado por el objeto de origen.
         *
         * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
         * @params {Backbone.Events}data es la referencia al objeto que inicio
         *          la petición. Puede ser un model o un collection.
         * @params {String}xhr la respuesta del servico en un objeto xhr.
         * @params {String}[options]
         */
        error: function (target, xhr, options) {
            var resp = {}
            resp.target = target;
            resp.xhr = xhr;
            resp.options = options
            if (Backbone.Storage.trigger) {
                target.trigger('error', resp);
            } else {
                target._oldCallback.error(target, xhr, options);
            }
        }
    },

    /**
     * Se encarga de sobreescribir el fetch de backbonejs para implementar el
     * cacheo
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    overrideFetch: function () {
        _.each(["Model", "Collection"], function (name) {
            // Cache Backbone constructor.
            var clazz = Backbone[name];
            // Cache original fetch.
            var super_fetch = clazz.prototype.fetch;
            // Override the fetch method to emit a fetch event.
            clazz.prototype.fetch = function () {
                var key = this.url();
                this.requestType = 'fetch';
                // Trigger the fetch event on the instance.
                this.trigger("fetch", this);
                if (this.cache != false && Backbone.Storage.contains(key)) {
                    //se obtiene el valor de memoria
                    var cacheData = Backbone.Storage.get(key);
                    //se setan los atributos la objeto actual
                    if (typeof this.models != "undefined") {
                        //si es un collection
                        this.add(cacheData.target.toJSON());
                    } else {
                        this.set(cacheData.target.toJSON());
                    }
                    cacheData.target = this;
                    //se añade un timeout para que se pueda hacer bind de los
                    //handlers
                    var thiz = this;
                    if (Backbone.Storage.trigger == false) {
                        Backbone.Storage.callback.success(cacheData.target, cacheData.response, cacheData.options);
                    } else {
                        setTimeout(function () {
                            //se dispara el evento ready
                            thiz.trigger('ready', cacheData);
                        }, Backbone.Storage.cacheDelay);
                    }
                    return;
                }
                var args = Backbone.Storage.overrideCallback(arguments);
                // Pass through to original fetch.
                var xhr = super_fetch.apply(this, args);
                return xhr;
            };
        });
    },

    /**
     * Se encarga de sobreescribir el los callbacks de los fetchs de backboneJs
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    overrideCallback: function (target, arguments) {
        var args = [];

        if (Backbone.Storage.trigger == true) {
            args.push(Backbone.Storage.callback);
            return args;
        } else if (typeof arguments == "undefined" || arguments.length == 0) {
            throw "No callback found";
        }

        for (var i = 0; i < arguments.length; i++) {
            if (typeof arguments[i].success) {
                //se almacena una referencia al callback definido por el usuario
                target._oldCallback = {
                    success: arguments[i].success,
                    error: arguments[i].error,
                }
                args.push(Backbone.Storage.callback);
            } else {
                args.push(arguments[i]);
            }
        }
        return args;
    },


    /**
     * Se encarga de activar el recolector de basura de los elementos que se encuentran
     * almacenados en memoria.
     * @function
     *
     * @author <a href="mailto:mbaez@konecta.com.py">Maximiliano Báez</a>
     */
    activateCollector: function () {
        setInterval(function () {
            //se invoca al recolector de basura de los objetos que se encuentran en
            //memeoria.
            Backbone.Storage.garbageCollector();
        }, this.collectorInterval);
    }
}