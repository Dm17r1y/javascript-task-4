'use strict';

/**
 * Сделано задание на звездочку
 * Реализованы методы several и through
 */
const isStar = true;

class Event {
    constructor(context, handler) {
        this.context = context;
        this.handler = handler;
        this.numberOfCall = 0;
        this.maxNumberOfCall = Infinity;
        this.callPeriod = 1;
    }

    setMaxNumberOfCall(value) {
        this.maxNumberOfCall = value;
    }

    setCallPeriod(value) {
        this.callPeriod = value;
    }

    execute() {
        if (this.numberOfCall < this.maxNumberOfCall && this.numberOfCall % this.callPeriod === 0) {
            this.handler.call(this.context);
        }
        this.numberOfCall++;
    }
}

class Namespace {
    constructor() {
        this.events = [];
        this.namespaces = new Map();
    }

    registerEvent(namespaceArray, event) {
        if (namespaceArray.length === 0) {
            this.events.push(event);

            return;
        }
        if (!this.namespaces.get(namespaceArray[0])) {
            this.namespaces.set(namespaceArray[0], new Namespace());
        }
        this.namespaces.get(namespaceArray[0]).registerEvent(namespaceArray.slice(1), event);
    }

    getEvents(namespaceArray) {
        const events = [];
        if (namespaceArray.length > 0 && this.namespaces.get(namespaceArray[0])) {
            this.namespaces.get(namespaceArray[0])
                .getEvents(namespaceArray.slice(1))
                .forEach(event => {
                    events.push(event);
                });
        }

        this.events.forEach(event => events.push(event));

        return events;
    }

    unregisterEvents(namespaceArray, context) {
        let namespace = this;
        namespaceArray.forEach(piece => {
            namespace = namespace.namespaces.get(piece);
        });
        clearEventsInNamespace(namespace, context);
    }
}

function clearEventsInNamespace(namespace, context) {
    namespace.events = namespace.events.filter(event => event.context !== context);
    Array.from(namespace.namespaces.values())
        .forEach(nestedNamespace => {
            clearEventsInNamespace(nestedNamespace, context);
        });
}

/**
 * Возвращает новый emitter
 * @returns {Object}
 */
function getEmitter() {
    return {

        namespace: new Namespace(),

        /**
         * Подписаться на событие
         * @param {String} eventNamespace
         * @param {Object} context
         * @param {Function} handler
         * @returns {Object} this
         */
        on: function (eventNamespace, context, handler) {
            const event = new Event(context, handler);
            this.namespace.registerEvent(eventNamespace.split('.'), event);

            return this;
        },

        /**
         * Отписаться от события
         * @param {String} eventNamespace
         * @param {Object} context
         * @returns {Object} this
         */
        off: function (eventNamespace, context) {
            this.namespace.unregisterEvents(eventNamespace.split('.'), context);

            return this;
        },

        /**
         * Уведомить о событии
         * @param {String} eventNamespace
         * @returns {Object} this
         */
        emit: function (eventNamespace) {
            this.namespace.getEvents(eventNamespace.split('.')).forEach(e => e.execute());

            return this;
        },

        /**
         * Подписаться на событие с ограничением по количеству полученных уведомлений
         * @star
         * @param {String} eventNamespace
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} times – сколько раз получить уведомление
         * @returns {Object} this
         */
        several: function (eventNamespace, context, handler, times) {
            if (times <= 0) {
                this.on(eventNamespace, context, handler);
            }
            const event = new Event(context, handler);
            event.setMaxNumberOfCall(times);
            this.namespace.registerEvent(eventNamespace.split('.'), event);

            return this;
        },

        /**
         * Подписаться на событие с ограничением по частоте получения уведомлений
         * @star
         * @param {String} eventNamespace
         * @param {Object} context
         * @param {Function} handler
         * @param {Number} frequency – как часто уведомлять
         * @returns {Object} this
         */
        through: function (eventNamespace, context, handler, frequency) {
            if (frequency <= 0) {
                this.on(eventNamespace, context, handler);
            }
            const event = new Event(context, handler);
            event.setCallPeriod(frequency);
            this.namespace.registerEvent(eventNamespace.split('.'), event);

            return this;
        }
    };
}

module.exports = {
    getEmitter,
    isStar
};
