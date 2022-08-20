import {QueryError, RowDataPacket} from "mysql2";
import {NotActivatedUser, User} from "../interfaces/User";
import {MysqlCallback} from "../interfaces/Callback";

const pool = require("../../config/database");
const {encrypt} = require("../crypto/cryptoManager");

module.exports = {
    getUsers: (callback: MysqlCallback) => {
        pool.query (
            `SELECT user_id, email, first_name, last_name, activated, permitted_pages_id, avatar FROM web_users`,
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        )
    },
    getUserByEmail: (email: string, callback: MysqlCallback) => {
        pool.query (
            `SELECT * FROM web_users WHERE email = ?`,
            [email],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResult(error, results, callback);
            }
        )
    },
    getActivatedUserByEmail: (email: string, callback: MysqlCallback) => {
        pool.query (
            `SELECT * FROM web_users WHERE email = ? AND activated = 1`,
            [email],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResult(error, results, callback);
            }
        )
    },
    getUserByEmailExceptId: (email: string, id: number, callback: MysqlCallback) => {
        pool.query (
            `SELECT * FROM web_users WHERE email = ? AND user_id != ?`,
            [
                email,
                id
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResult(error, results, callback);
            }
        )
    },
    getUserById: (id: number, callback: MysqlCallback) => {
        pool.query (
            `SELECT * FROM web_users WHERE user_id = ?`,
            [id],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResult(error, results, callback);
            }
        )
    },
    addUser: (data: User, callback: MysqlCallback) => {
        pool.query(
            `INSERT INTO web_users (email, first_name, last_name, confirmation_token, permitted_pages_id) VALUES (?,?,?,?,?)`,
            [
                data.email,
                data.name,
                data.lastname,
                data.confirmation_token,
                data.permitted_pages
            ],
            (error: QueryError) => {
                if(error) {
                    return callback(error);
                }
                return callback(null);
            }
        );
    },
    activateUser: (data: NotActivatedUser, callback: MysqlCallback) => {
        pool.query(
            `UPDATE web_users SET password=?, activated=1 WHERE confirmation_token=? AND activated=0`,
            [
                data.password,
                data.token
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },
    insertRefreshToken: (id: number, refreshToken: string, callback: MysqlCallback) => {
        pool.query(
            `INSERT INTO web_refresh_tokens (user_id, refresh_token) VALUES (?, ?)`,
            [
                id,
                encrypt(refreshToken)
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },
    removeRefreshToken: (id: number, refreshToken: string, callback: MysqlCallback) => {
        pool.query(
            `DELETE FROM web_refresh_tokens WHERE user_id = ? AND refresh_token = ?`,
            [
                id,
                encrypt(refreshToken)
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },
    containsRefreshToken: (id: number, refreshToken: string, callback: MysqlCallback) => {
        pool.query(
            `SELECT count(refresh_token) count FROM web_users JOIN web_refresh_tokens USING(user_id) WHERE user_id = ? AND refresh_token = ?`,
            [
                id,
                encrypt(refreshToken)
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResult(error, results, callback);
            }
        );
    },
    getPermittedPages: (userId: number, callback: MysqlCallback) => {
        pool.query (
            `SELECT DISTINCT page_id, path, component_name, description, icon_name FROM web_users
                    INNER JOIN web_pages ON FIND_IN_SET(page_id, permitted_pages_id) != 0
                    WHERE user_id = ?`,
            [userId],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        )
    },

    getProfilePicture: (userId: number, callback: MysqlCallback) => {
        pool.query (
            `SELECT avatar FROM web_users WHERE user_id = ?`,
            [userId],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        )
    },

    removeUser: (id: number, callback: MysqlCallback) => {
        pool.query(
            `DELETE FROM web_users WHERE user_id = ?`,
            [
                id,
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },

    updateUser: (id: number, data: User, callback: MysqlCallback) => {
        pool.query(
            `UPDATE web_users SET email = ?, first_name = ?, last_name = ?, permitted_pages_id = ? WHERE user_id = ?`,
            [
                data.email,
                data.name,
                data.lastname,
                data.permitted_pages,
                id,
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },

    resetAccount: (email: string, token: string,  callback: MysqlCallback) => {
        pool.query(
            `UPDATE web_users SET activated = 0, password = ?, confirmation_token = ? WHERE email = ?`,
            [
                null,
                token,
                email,
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },

    uploadImageSource: (id: number, path: string, callback: MysqlCallback) => {
        pool.query(
            `UPDATE web_users SET avatar = ? WHERE user_id = ?`,
            [
                path,
                id
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },

    changePassword: (id: number, password: string, callback: MysqlCallback) => {
        pool.query(
            `UPDATE web_users SET password = ? WHERE user_id = ?`,
            [
                password,
                id
            ],
            (error: QueryError, results: RowDataPacket[]) => {
                return handleResults(error, results, callback);
            }
        );
    },
}

const handleResult = (error: QueryError, results: RowDataPacket[], callback: MysqlCallback) => {
    if(error) {
        return callback(error);
    }
    return callback(null, results[0]);
}

const handleResults = (error: QueryError, results: RowDataPacket[], callback: MysqlCallback) => {
    if(error) {
        return callback(error);
    }
    return callback(null, results);
}