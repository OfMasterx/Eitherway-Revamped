"use strict";
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
exports.PostgresFileStore = void 0;
var files_js_1 = require("../repositories/files.js");
var PostgresFileStore = /** @class */ (function () {
    function PostgresFileStore(db) {
        this.filesRepo = new files_js_1.FilesRepository(db);
    }
    PostgresFileStore.prototype.list = function (appId_1) {
        return __awaiter(this, arguments, void 0, function (appId, limit) {
            var files, buildTree;
            if (limit === void 0) { limit = 1000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findByApp(appId, limit)];
                    case 1:
                        files = _a.sent();
                        buildTree = function (files) {
                            var rootNodes = [];
                            var nodeMap = new Map();
                            files.forEach(function (file) {
                                var node = {
                                    name: file.path.split('/').pop() || file.path,
                                    path: file.path,
                                    type: 'file',
                                    size: file.size_bytes || 0,
                                    mimeType: file.mime_type || undefined
                                };
                                nodeMap.set(file.path, node);
                            });
                            var dirMap = new Map();
                            files.forEach(function (file) {
                                var parts = file.path.split('/');
                                var node = nodeMap.get(file.path);
                                if (parts.length === 1) {
                                    rootNodes.push(node);
                                }
                                else {
                                    for (var i = parts.length - 1; i > 0; i--) {
                                        var dirPath = parts.slice(0, i).join('/');
                                        var dirName = parts[i - 1];
                                        if (!dirMap.has(dirPath)) {
                                            var dirNode = {
                                                name: dirName,
                                                path: dirPath,
                                                type: 'directory',
                                                isDirectory: true,
                                                children: []
                                            };
                                            dirMap.set(dirPath, dirNode);
                                        }
                                        var parentDir = dirMap.get(dirPath);
                                        if (i === parts.length - 1) {
                                            if (!parentDir.children.some(function (c) { return c.path === node.path; })) {
                                                parentDir.children.push(node);
                                            }
                                        }
                                    }
                                    var topDir = parts[0];
                                    var topDirPath = topDir;
                                    if (!dirMap.has(topDirPath)) {
                                        dirMap.set(topDirPath, {
                                            name: topDir,
                                            path: topDirPath,
                                            type: 'directory',
                                            isDirectory: true,
                                            children: []
                                        });
                                    }
                                }
                            });
                            dirMap.forEach(function (dir, path) {
                                if (!path.includes('/')) {
                                    rootNodes.push(dir);
                                }
                                else {
                                    var parentPath = path.substring(0, path.lastIndexOf('/'));
                                    var parentDir = dirMap.get(parentPath);
                                    if (parentDir && !parentDir.children.some(function (c) { return c.path === dir.path; })) {
                                        parentDir.children.push(dir);
                                    }
                                }
                            });
                            var sortNodes = function (nodes) {
                                return nodes.sort(function (a, b) {
                                    if (a.type === b.type)
                                        return a.name.localeCompare(b.name);
                                    return a.type === 'directory' ? -1 : 1;
                                }).map(function (node) {
                                    if (node.children) {
                                        node.children = sortNodes(node.children);
                                    }
                                    return node;
                                });
                            };
                            return sortNodes(rootNodes);
                        };
                        return [2 /*return*/, buildTree(files)];
                }
            });
        });
    };
    PostgresFileStore.prototype.read = function (appId, path) {
        return __awaiter(this, void 0, void 0, function () {
            var file, version, content, mimeType;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findByAppAndPath(appId, path)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File not found: ".concat(path));
                        }
                        return [4 /*yield*/, this.filesRepo.getHeadVersion(file.id)];
                    case 2:
                        version = _a.sent();
                        if (!version) {
                            throw new Error("No version found for file: ".concat(path));
                        }
                        content = version.content_bytes || version.content_text || '';
                        mimeType = file.mime_type || 'text/plain';
                        return [2 /*return*/, {
                                content: content,
                                mimeType: mimeType,
                                path: file.path,
                                version: version.version
                            }];
                }
            });
        });
    };
    PostgresFileStore.prototype.write = function (appId, path, content, mimeType, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.upsertFile(appId, path, content, userId, mimeType)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostgresFileStore.prototype.rename = function (appId, oldPath, newPath) {
        return __awaiter(this, void 0, void 0, function () {
            var file, latestVersion, content;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findByAppAndPath(appId, oldPath)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File not found: ".concat(oldPath));
                        }
                        return [4 /*yield*/, this.filesRepo.getHeadVersion(file.id)];
                    case 2:
                        latestVersion = _a.sent();
                        if (!latestVersion) {
                            throw new Error("No version found for file: ".concat(oldPath));
                        }
                        content = latestVersion.content_bytes || latestVersion.content_text || '';
                        return [4 /*yield*/, this.filesRepo.upsertFile(appId, newPath, content, undefined, file.mime_type || undefined)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.filesRepo.delete(file.id)];
                    case 4:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostgresFileStore.prototype.delete = function (appId, path) {
        return __awaiter(this, void 0, void 0, function () {
            var file;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findByAppAndPath(appId, path)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File not found: ".concat(path));
                        }
                        return [4 /*yield*/, this.filesRepo.delete(file.id)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    PostgresFileStore.prototype.getVersions = function (appId_1, path_1) {
        return __awaiter(this, arguments, void 0, function (appId, path, limit) {
            var file;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.filesRepo.findByAppAndPath(appId, path)];
                    case 1:
                        file = _a.sent();
                        if (!file) {
                            throw new Error("File not found: ".concat(path));
                        }
                        return [2 /*return*/, this.filesRepo.getVersionHistory(file.id, limit)];
                }
            });
        });
    };
    return PostgresFileStore;
}());
exports.PostgresFileStore = PostgresFileStore;
