export class GameStorage {
    /**
     * Constructs a new GameStorage object.
     * @param storage any key-value store supporting at least the setItem, getItem, and removeItem methods.
     */
    constructor(storage=localStorage) {
        this.store = storage;
    }

    // Game ID
    getGameID() {
        return this.store.getItem("cahgameid");
    }
    setGameID(gameID) {
        this.store.setItem("cahgameid", gameID);
    }
    delGameID(gameID) {
        this.store.setItem("cahgameid", gameID);
    }

    // Last Game ID
    getLastGameID() {
        return this.store.getItem("lastcahgameid");
    }
    setLastGameID(gameID) {
        this.store.setItem("lastcahgameid", gameID);
    }
    delLastGameID() {
        this.store.removeItem("lastcahgameid");
    }

    // Owner ID
    getOwnerID() {
        return this.store.getItem("cahownerid");
    }
    setOwnerID(playerID) {
        this.store.setItem("cahownerid", playerID);
    }
    delOwnerID() {
        this.store.removeItem("cahownerid");
    }

    // Player ID
    getPlayerID() {
        return this.store.getItem("cahplayerid");
    }
    setPlayerID(playerID) {
        this.store.setItem("cahplayerid", playerID);
    }
    delPlayerID() {
        this.store.removeItem("cahplayerid");
    }

    // Player Name
    setPlayerName(playerName) {
        this.store.setItem("cahplayername", playerName);
    }
    getPlayerName() {
        return this.store.getItem("cahplayername");
    }
    delPlayerName() {
        this.store.removeItem("cahplayername");
    }

    // Mulligans
    getMulligans() {
        return this.store.getItem("cahmulligans");
    }
    setMulligans(mulligans) {
        this.store.setItem("cahmulligans", mulligans);
    }

    // Round
    getRound() {
        return JSON.parse(this.store.getItem("cahround"));
    }
    setRound(round) {
        this.store.setItem("cahround", JSON.stringify(round));
    }
    delRound() {
        return JSON.parse(this.store.getItem("cahround"));
    }

    // Game over
    getGameOver() {
        return this.store.getItem("cahgameover");
    }
    setGameOver() {
        this.store.setItem("cahgameover", true);
    }

    // Submit Cards
    getSubmitCards() {
        return JSON.parse(this.store.getItem("cahsubmitcards"));
    }
    setSubmitCards(cardID, cardText = '') {
        var cards = this.getSubmitCards();
        if (!cards) {
            cards = [
                {
                    cardID: cardID,
                    cardText: cardText
                }
            ];
        } else {
            cards.push({
                cardID: cardID,
                cardText: cardText
            });
        }
        this.store.setItem("cahsubmitcards", JSON.stringify(cards));
    }
    delSubmitCards() {
        this.store.removeItem("cahsubmitcards");
    }

    // czar card
    getCzarCard() {
        return this.store.getItem("cahczarselection");
    }
    setCzarCard(card) {
        this.store.setItem("cahczarselection", card);
    }
    delCzarCard() {
        this.store.removeItem("cahczarselection");
    }

    clearData() {
        this.store.removeItem("cahplayerid");
        this.store.removeItem("cahmulligans");
        this.store.removeItem("cahgameid");
        this.store.removeItem("cahround");
        this.store.removeItem("cahplayername");
        this.store.removeItem("cahsubmitcards");
        this.store.removeItem("cahgameover");
        this.store.removeItem("cahczarselection");
    }
}
