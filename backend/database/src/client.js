"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseClient = void 0;
exports.createDatabaseClient = createDatabaseClient;
var pg_1 = require("pg");
var Pool = pg_1.default.Pool;
var DatabaseClient = /** @class */ (function () {
    function DatabaseClient(config) {
        var _a, _b, _c;
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            max: (_a = config.max) !== null && _a !== void 0 ? _a : 20,
            idleTimeoutMillis: (_b = config.idleTimeoutMillis) !== null && _b !== void 0 ? _b : 30000,
            connectionTimeoutMillis: (_c = config.connectionTimeoutMillis) !== null && _c !== void 0 ? _c : 2000,
        });
        this.pool.on('error', function (err) {
            console.error('Unexpected database pool error:', err);
        });
    }
    DatabaseClient.initialize = function (config) {
        if (!DatabaseClient.instance) {
            DatabaseClient.instance = new DatabaseClient(config);
        }
        return DatabaseClient.instance;
    };
    DatabaseClient.getInstance = function () {
        if (!DatabaseClient.instance) {
            throw new Error('DatabaseClient not initialized. Call initialize() first.');
        }
        return DatabaseClient.instance;
    };
    DatabaseClient.prototype.query = function (text, params) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.pool.query(text, params)];
            });
        });
    };
    DatabaseClient.prototype.getClient = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.pool.connect()];
            });
        });
    };
    DatabaseClient.prototype.transaction = function (callback) {
        return __awaiter(this, void 0, void 0, function () {
            var client, result, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getClient()];
                    case 1:
                        client = _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 6, 8, 9]);
                        return [4 /*yield*/, client.query('BEGIN')];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, callback(client)];
                    case 4:
                        result = _a.sent();
                        return [4 /*yield*/, client.query('COMMIT')];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, result];
                    case 6:
                        error_1 = _a.sent();
                        return [4 /*yield*/, client.query('ROLLBACK')];
                    case 7:
                        _a.sent();
                        throw error_1;
                    case 8:
                        client.release();
                        return [7 /*endfinally*/];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseClient.prototype.healthCheck = function () {
        return __awaiter(this, void 0, void 0, function () {
            var result, error_2;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.query('SELECT 1 as health')];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, ((_a = result.rows[0]) === null || _a === void 0 ? void 0 : _a.health) === 1];
                    case 2:
                        error_2 = _b.sent();
                        console.error('Database health check failed:', error_2);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseClient.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.pool.end()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return DatabaseClient;
}());
exports.DatabaseClient = DatabaseClient;
function createDatabaseClient(config) {
    var defaultConfig = {
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
        database: process.env.POSTGRES_DB || 'eitherway',
        user: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres',
        max: parseInt(process.env.POSTGRES_MAX_CONNECTIONS || '20', 10),
    };
    return DatabaseClient.initialize(__assign(__assign({}, defaultConfig), config));
}
