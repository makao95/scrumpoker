// We need to import the CSS so that webpack will load it.
// The MiniCssExtractPlugin is used to separate it out into
// its own CSS file.

// webpack automatically bundles all modules in your
// entry points. Those entry points can be configured
// in "webpack.config.js".
//
// Import dependencies
//
import "phoenix_html"
// Import local files
//
// Local files can be imported directly using relative paths, for example:
import socket from "./socket"
let Enumerable = require("linq/linq");

import {Presence} from "phoenix"

const urlParams = new URLSearchParams(window.location.search);
const channelName = window.channelRoomId;
const userName = urlParams.get('name');

let channel = socket.channel('room:'+ channelName +':lobby', {}); // connect to chat "room"
let presence = new Presence(channel);

presence.onSync(() => {
   console.log("PRESENCE SYNC");
   app.presences = presence.list(listBy);
});

let listBy = (id, {metas: [first, ...rest]}) => {
    first.name = id;
    first.count = rest.length + 1;
    return first;
};

Vue.filter('toCard', function (value) {
    if (value !== "∞" && value !== "☕") {
        return value;
    }
    if (value === "☕"){
        return "<i class=\"fas fa-mug-hot\"></i>";
    }
    else if (value === "∞"){
        return "<i class=\"fas fa-infinity\"></i>";
    }
});

Vue.filter('isOnline', function (date) {
    var b = new Date();
    var difference = (b - date) / 1000;

    if (difference > 60){
        return "(offline)";
    }
    return "";
});

let app = new Vue({
    el: '#app',
    data: {
        neverVoted: true,
        isShowingConnectionError: false,
        presences: [],
        userName: "",
        channelName: channelName,
        message: "",
        isShowingVotes: false,
        votes: {},
        users: [],
        search_timeout: null,
        myVote: null,
        deck: null,
        isShowingAddCustomDeck: false,
        customDeckName: "Custom deck",
        customCards: ["0", "0.5", "1", "2", "3", "5", "8", "13", "20", "40", "∞", "☕"],
        decks: [
            {name: "Standard deck", cards: "0|0.5|1|2|3|5|8|13|20|40|∞|☕"},
            {name: "Time estimate", cards: "30m|1h|2h|4h|8h|2d|4d|7d|14d|30d|∞|☕"},
        ]
    },
    created: function () {
        this.userName = userName;
        this.deck = this.decks[0].cards;

        socket.connect();
        socket.onError((_) => app.isShowingConnectionError = true);
        
        channel.onError((_) => app.isShowingConnectionError = true);
        
        // Overwrite default method
        channel.onMessage = function(event, payload, ref){
            console.log(" received event " + event);
            if (event !== "timeout" && event !== "error"){
                app.isShowingConnectionError = false;
            }
            return payload 
        };

        channel.join()
            .receive("ok", ({messages}) => console.log("catching up", messages) )
            .receive("error", ({reason}) => console.log("failed join", reason) )
            .receive("timeout", () => {
                app.isShowingConnectionError = true;
                console.log("Networking issue. Still waiting...")
            });
            
        channel.push('joined', { // send the message to the server on "shout" channel
            name: this.userName     // get value of "name" of person sending the message
        });

        channel.on('active_deck', function (payload) { // listen to the 'shout' event
            console.log(payload.cards);
            app.deck = payload.currentDeck;
            app.decks = payload.decks;
        });


        channel.on('voted', function (payload) { // listen to the 'shout' event
            console.log(payload.name + " voted");
            app.$set(app.votes, payload.name, payload.message);
        });


        channel.on('show_votes', function (payload) { // listen to the 'shout' event
            console.log('show_votes');
            app.isShowingVotes = true
        });


        channel.on('clear_votes', function (payload) { // listen to the 'shout' event
            console.log('clear_votes');
            app.isShowingVotes = false;
            app.votes = {};
            app.myVote = null;
        });
    },
    methods: {
        changeDeck: function (deckIndex){
            let selectedDeck = JSON.stringify(this.decks[deckIndex]);
            channel.push('update_deck', { 
                cards: selectedDeck
            });
            console.log(selectedDeck)
        },
        addDeck: function (){
            channel.push('add_deck', {
                deck: {
                    cards: this.customDeckCards,
                    name: this.customDeckName
                }
            });
            this.isShowingAddCustomDeck = false;
        },
        onInputChangedDebounce: function (input) {
            this.debounceCaseChanged(this, 500)
        },
        onInputChanged: function () {
            channel.push('change_message', { 
                name: this.userName,
                message: this.message
            });
        },
        vote: function (message) {
            this.neverVoted = false;
            channel.push('voted', { 
                name: this.userName, 
                message: message
            });
            this.myVote = message;
            // If we are the last to vote then trigger showing votes
            let usersWhoDidntVote = Enumerable.from(app.sortedUsers)
                .where(x => x.name !== app.userName)
                .where(x => x.isObserver === false)
                .where(x => x.vote === null || x.vote === undefined);
            
            if (usersWhoDidntVote.any() === false){
            // if (app.users.some(u => app.userName !== u.name && app.votes[u.name] === undefined) === false) {
                app.showVotes();
            }
        },
        showVotes: function () {
            channel.push('show_votes', { 
                name: this.userName, 
            });
        },
        setObserver: function (observer) {
            channel.push("user_set_observer", {
                name: this.userName,     // get value of "name" of person sending the message
                observer: observer
            });
        },
        clearVotes: function () {
            channel.push('change_message', { // send the message to the server on "shout" channel
                name: this.userName,     // get value of "name" of person sending the message
                message: ""
            });
            channel.push('clear_votes', { // send the message to the server on "shout" channel
                name: this.userName,     // get value of "name" of person sending the message
            });
        },
        debounceCaseChanged(env, timeMs) {
            if (this.case_input_timeout) {
                clearTimeout(this.case_input_timeout);
                console.log("clear timeout")
            }
            this.case_input_timeout = setTimeout(function() {
                    env.onInputChanged();
                },
                timeMs);
        },
    },
    computed: {
        customDeckCards: function () {
            return this.customCards.join('|')
        },
        cards: function() {
            if (this.deck && this.deck.cards)
                  return this.deck.cards.split('|');
            return ''
        },
        canVote: function() {
            return (this.isShowingVotes && this.votes[this.userName] !== undefined) === false 
                && this.myPresence !== null && this.myPresence.observer === false;
        },
        canShowVotes: function() {
            return this.isShowingVotes === false;
        },
        myPresence: function(){
            let userName = this.userName;
            return this.presences.filter(function (item) {
                return item.name === userName;
            })[0] || null;
        },
        sortedUsers: function() {
            let presenceUsers = this.presences.map(x => x.name);
            let voteKeys = Object.keys(this.votes);
            let userNames = Array.from(new Set(presenceUsers.concat(voteKeys)));
            //TODO: store vote in the presence
            let users = userNames.map(u => {
                let n = {};
                let pres = this.presences.filter(function (item) {
                    return item.name === u;
                })[0] || null;

                n.isOffline = pres == null;
                n.isObserver = pres !== null && pres.observer;
                n.name = u;
                n.vote = this.votes[u];
                n.count = (this.presences.filter(x => x.name === u).map(x => x.count)[0]);
                return n;
            });
            return Enumerable.from(users)
                .orderBy(x => x.isObserver)
                .thenBy(x => x.name).toArray();
        }
    }
});

channel.on('change_message', function (payload) { 
    console.log('changed message by ' + payload.name + ' to ' + payload.message);
    if (app.userName === payload.name
        && document.getElementById("message-input") === document.activeElement) {
        return;
    }
    app.message = payload.message;
});

channel.on('joined', function (payload) {
    console.log('user ' + payload.name + ' joined');
    if (app.userName !== payload.name){
        app.onInputChanged();
    }

    if (app.myVote != null){
        channel.push('voted', { 
            name: app.userName, 
            message: app.myVote 
        });
    }
});

    
