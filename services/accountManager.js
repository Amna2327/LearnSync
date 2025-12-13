// services/accountManager.js
import axios from "axios";
import qs from "qs";
import pool from "../db.js";
import {
    getOverlappingMeetings
} from "../databases/userDatabase.js";

export async function getAvailableAccount(start_time, duration_minutes) {
    // Fetch all Zoom accounts
    const accountsRes = await pool.query("SELECT * FROM zoom_accounts");
    const accounts = accountsRes.rows;

    for (const account of accounts) {
        // Check for overlapping meetings for this account
        const overlapRows = await getOverlappingMeetings(account.id, start_time, duration_minutes);
        console.log("OVERLAP ROWS:  ", overlapRows.length);
        if (overlapRows.length === 0) {
            // Account is free
            return account;
        }
    }

    return null; // no account available
}

/**
 * Get a valid OAuth token for a Zoom account, refresh if expired
 * @param {Object} account - Zoom account row from DB
 * @returns {string} - access token
 */
export async function getAccessToken(account) {
    const now = Date.now();

    // If token exists and is still valid, return it
    if (account.access_token && now < account.token_expires_at) {
        return account.access_token;
    }

    // Request a new token from Zoom
    const tokenResponse = await axios.post(
        "https://zoom.us/oauth/token",
        qs.stringify({
            grant_type: "account_credentials",
            account_id: account.account_id
        }),
        {
            headers: {
                "Authorization":
                    "Basic " +
                    Buffer.from(`${account.client_id}:${account.client_secret}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded"
            }
        }
    );

    const newToken = tokenResponse.data.access_token;
    const expiresAt = now + tokenResponse.data.expires_in * 1000 - 5000; // 5s buffer

    // Update token in DB
    await pool.query(
        "UPDATE zoom_accounts SET access_token=$1, token_expires_at=$2 WHERE id=$3",
        [newToken, expiresAt, account.id]
    );

    return newToken;
}

