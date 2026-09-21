"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useCommit = useCommit;
const react_1 = require("react");
const navigation_1 = require("./navigation");
function useCommit(url, options = {}) {
    const method = options.method ?? 'POST';
    const revalidate = options.revalidate ?? true;
    const busy = (0, react_1.useRef)(false);
    const [state, setState] = (0, react_1.useState)('idle');
    const [error, setError] = (0, react_1.useState)(null);
    const [data, setData] = (0, react_1.useState)();
    const commit = (0, react_1.useCallback)(async (body) => {
        if (busy.current) {
            return;
        }
        busy.current = true;
        setError(null);
        setState('submitting');
        try {
            const headers = {
                accept: 'application/json',
            };
            const request = {
                credentials: 'include',
                method,
                headers,
            };
            if (body !== undefined) {
                headers['content-type'] = 'application/json';
                request.body = JSON.stringify(body);
            }
            const response = await fetch(url, request);
            if (!response.ok) {
                throw new Error('Request failed.');
            }
            const result = (await parseJson(response));
            setData(result);
            if (revalidate) {
                setState('revalidating');
                await (0, navigation_1.refresh)();
            }
            return result;
        }
        catch (cause) {
            const nextError = cause instanceof Error ? cause : new Error('Request failed.');
            setError(nextError);
            throw nextError;
        }
        finally {
            busy.current = false;
            setState('idle');
        }
    }, [method, revalidate, url]);
    return {
        commit,
        data,
        error,
        pending: state !== 'idle',
        state,
    };
}
async function parseJson(response) {
    const text = await response.text();
    if (!text) {
        return undefined;
    }
    return JSON.parse(text);
}
//# sourceMappingURL=use-commit.js.map