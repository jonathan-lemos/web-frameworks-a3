import express from "express";
import statuses from "statuses";

export const respond = (response: express.Response, status: number = 200, msg?: string) => {
    const stat_string = statuses(status);
    const m = msg ?? stat_string;

    response.status(status);
    response.json({"status": status, "message": m});
}

export default respond;
