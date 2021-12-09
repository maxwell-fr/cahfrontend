//set the base url for the various endpoints
//all API calls will start with this URL, e.g., `${CONFIG_BASEURL}/v1/games/getGame`
export const CONFIG_API_HOST = "localhost";
export const CONFIG_BASEURL = `http://${CONFIG_API_HOST}:3000`;
export const CONFIG_WSURL = `ws://${CONFIG_API_HOST}:38080`;

//This client works with this version of the server API
export const EXPECTED_API_VERSION = {
    major: 0,
    minor: 0,
    patch: 0
};

export const WS_RETRY_DELAY_MS = 2000;