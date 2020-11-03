import ErrorResult from "./errorResult";

export default function(body: any, keys: string[], partial: boolean = false): {[key: string]: string} | ErrorResult<{errors: string[]}> {
    if (typeof body !== "object") {
        return new ErrorResult({errors: [`The body must be an object (was '${JSON.stringify(body)}').`]});
    }

    let s: string[] = [];
    let o: {[key: string]: string} = {};

    for (const key of keys) {
        if (typeof body[key] !== "string" || body[key].trim().length == 0) {
            if (typeof body[key] === undefined) {
                if (partial) {
                    continue;
                }
                s.push(`The key '${key}' is required in the request body.`);
            }
            else if (typeof body[key] === "number") {
                o[key.toString()] = body[key].toString();
            }
            else {
                s.push(`The key '${key}' must be a string (was ${JSON.stringify(body[key])}).`);
            }
        }
        else {
            o[key] = body[key].trim();
        }
    }

    if (s.length > 0) {
        return new ErrorResult({errors: s});
    }
    else {
        return o;
    }
}