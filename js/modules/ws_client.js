import {CONFIG_WSURL, EXPECTED_API_VERSION, WS_RETRY_DELAY_MS} from "../config.js";


export class WS_Client {

    /**
     * Construct a WS_client object.
     * @param storage any key-value store supporting at least the setItem, getItem, and removeItem methods.
     * @param uiInterface an interface object to the UI, providing the following methods:
     *     uuiCreate (gameID)
     *     uuiAllSets (setsArray)
     *     uuiJoin (gameID)
     *     uuiInfo (infoData)
     *     uuiError (errorData)
     *     uuiGameResponse (gameName)
     *     uuiWsStartup ()
     *     uuiWsOpen ()
     *     uuiWsClose ()
     *     uuiWsError ()
     *     uuiKick (kicked)
     *     uuiHand ({mulligans, handArray})
     *     updatePlayers (playersArray)
     *     doGameUpdate (roundData)
     */
    constructor(storage, uiInterface) {
        this.storage = storage;
        this.ui = uiInterface;

        this.socket = new WebSocket(CONFIG_WSURL);

        this.startTalking()
    }

    startTalking() {
        console.log("Starting chatter...");

        this.ui.uuiWsStartup();

        const myself = this;

        this._handleWsMessage = function(incoming) {
            return myself.handleWsMessage(incoming);
        }
        this.socket.onopen =  function () {
            myself.ui.uuiWsOpen();
            console.log("Connection opened.");
            myself.socket.onmessage = myself._handleWsMessage;
        }

        this._retryConnection = function () {
            setTimeout(function() {return myself.startTalking()}, WS_RETRY_DELAY_MS);
        }
        this.socket.onclose =  function () {
            myself.ui.uuiWsClose();
            console.log("Connection closed.");
            myself._retryConnection();
        };

        this.socket.onerror =  function () {
            myself.ui.uuiWsError();
            console.log("Connection error.");
            //just note the error; onclose will try to reconnect
        };
    }

    wsAllSets(sets) {
        this.ui.uuiAllSets(sets);
    }

    wsCreate(create_data) {
        console.log("Started new game: " + create_data.gameID);
        this.storage.setGameID(create_data.gameID);
        console.log("Your player ID: " + create_data.players[0].id);//TODO: ID handling still seems problematic
        this.storage.setPlayerID(create_data.players[0].id);
        this.storage.setOwnerID(create_data.ownerID);
        this.ui.uuiCreate(create_data.gameID);
        this.ui.updatePlayers(create_data.players, null);
    }



    wsJoin(playerID, join_data) {
        this.storage.setPlayerID(playerID);
        console.log("Joined game ID: " + join_data.gameID);
        this.storage.setGameID(join_data.gameID);
        this.storage.delRound();
        this.storage.setOwnerID(join_data.owner);
        this.ui.uuiJoin(join_data.gameID);
        this.ui.updatePlayers(join_data.players, null);
    }


    wsHand(data) {
        this.ui.uuiHand(data);
    }


    sendWsMessage(action, payload) {
        const myself = this;
        if (this.socket.readyState !== 1) {
            setTimeout( function () {
                myself.sendWsMessage(action, payload, true)
            }, WS_RETRY_DELAY_MS);
            console.log(`Network not ready. Retrying ${action} in ${WS_RETRY_DELAY_MS}ms.`);
            return;
        }
        console.log(`Sending ${action}.`);
        this.socket.send(JSON.stringify({
            apiversion: EXPECTED_API_VERSION,
            action: action,
            playerID: this.storage.getPlayerID(),
            payload: payload
        }));
    }

    submitWhiteCards(){
        var playerID = this.storage.getPlayerID();
        var gameID = this.storage.getGameID();
        var localRound = this.storage.getRound();
        var cards = this.storage.getSubmitCards();
        var roundID = localRound.id;
        //var czar = storage.getItem("cahczar");
        if(localRound.czar != playerID) {
            this.sendWsMessage("submitWhite", {
                gameID: gameID,
                roundID: roundID,
                whiteCards: cards,
                playerID: playerID
            });
        }
    }


    wsRound(data) {
        this.ui.doGameUpdate(data.payload);
        this.sendWsMessage("handRequest", {playerID: this.storage.getPlayerID(), gameID: this.storage.getGameID()});
    }


    wsUpdate(data) {
        this.ui.updatePlayers(data.payload.players);
    }


    wsKick(data) {
        this.ui.updatePlayers(data.payload.players);
        this.ui.uuiKick(data.payload.kickeeID === this.storage.getPlayerID());
    }


    handleWsMessage(incoming) {
        try {
            const data = JSON.parse(incoming.data);
            if (data.action === undefined) {
                console.log("Actionless server message: " + incoming.data);
            } else {
                switch (data.action) {
                    case "info" :
                        console.log("Server says: " + JSON.stringify(data.payload));
                        this.ui.uuiInfo(data);
                        break;
                    case "error":
                        console.log("Error: " + JSON.stringify(data.payload));
                        this.ui.uuiError(data);
                        break;
                    case "getAllSetsResponse":
                        console.log("All sets message:" + JSON.stringify(data.payload));
                        this.wsAllSets(data.payload);
                        break;
                    case "getGameResponse":
                        console.log("Get game message: " + JSON.stringify(data.payload));
                        this.ui.uuiGameResponse(data.payload.name);
                        break;
                    case "createResponse" :
                        console.log("Create message: " + JSON.stringify(data.payload));
                        this.wsCreate(data.payload);
                        break;
                    case "round" :
                        console.log("Round message: " + JSON.stringify(data.payload));
                        this.wsRound(data);
                        break;
                    case "joinResponse" :
                        console.log("Join message: " + JSON.stringify(data.payload));
                        this.wsJoin(data.playerID, data.payload);
                        break;
                    case "update":
                        console.log("Update message: " + JSON.stringify(data.payload));
                        this.wsUpdate(data);
                        break;
                    case "handResponse":
                        console.log("Hand message: " + JSON.stringify(data.payload));
                        this.wsHand(data.payload);
                        break;
                    case "kickMessage":
                        console.log("Player kicked!");
                        this.wsKick(data);
                        break;
                    default:
                        console.log("Other message:" + JSON.stringify(data));
                }
            }
        } catch (e) {
            console.log("ws message handler caught something: " + e);
        }
    }
}

