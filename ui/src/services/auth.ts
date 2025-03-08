const API_KEY = import.meta.env.VITE_API_KEY;

if (!API_KEY) {
    throw new Error("VITE_API_KEY environment variable must be set");
}

export const getApiKey = (): string => {
    return API_KEY;
};