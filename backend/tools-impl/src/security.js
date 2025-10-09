"use strict";
/**
 * Security utilities for path validation
 * Duplicated from runtime for tools-impl independence
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityGuard = void 0;
var SecurityGuard = /** @class */ (function () {
    function SecurityGuard(config) {
        this.allowedPaths = config.allowedWorkspaces;
        this.deniedPaths = config.deniedPaths;
        this.secretPatterns = config.secretPatterns.map(function (p) { return new RegExp(p, 'g'); });
    }
    /**
     * Check if a path is allowed
     */
    SecurityGuard.prototype.isPathAllowed = function (path) {
        // Check denied paths first
        for (var _i = 0, _a = this.deniedPaths; _i < _a.length; _i++) {
            var denied = _a[_i];
            if (this.matchGlob(path, denied)) {
                return false;
            }
        }
        // Check allowed paths
        for (var _b = 0, _c = this.allowedPaths; _b < _c.length; _b++) {
            var allowed = _c[_b];
            if (this.matchGlob(path, allowed)) {
                return true;
            }
        }
        return false;
    };
    /**
     * Redact secrets from content
     */
    SecurityGuard.prototype.redactSecrets = function (content) {
        var redacted = content;
        for (var _i = 0, _a = this.secretPatterns; _i < _a.length; _i++) {
            var pattern = _a[_i];
            redacted = redacted.replace(pattern, '[REDACTED]');
        }
        return redacted;
    };
    /**
     * Simple glob matching (supports ** and *)
     */
    SecurityGuard.prototype.matchGlob = function (path, pattern) {
        var regex = this.globToRegExp(pattern);
        return regex.test(path);
    };
    // Convert a glob to a RegExp with proper ** semantics:
    //  - "**/"   => "(?:.*/)?", i.e., zero or more directories (including none)
    //  - "**"    => ".*"
    //  - "*"     => "[^/]*"
    //  - "?"     => "[^/]"
    SecurityGuard.prototype.globToRegExp = function (pattern) {
        var specials = /[.+^${}()|[\]\\]/;
        var i = 0;
        var out = '^';
        while (i < pattern.length) {
            var ch = pattern[i];
            if (ch === '*') {
                var next = pattern[i + 1];
                if (next === '*') {
                    var hasSlash = pattern[i + 2] === '/';
                    if (hasSlash) {
                        out += '(?:.*/)?'; // zero or more directories, including none
                        i += 3;
                    }
                    else {
                        out += '.*'; // any characters, including '/'
                        i += 2;
                    }
                }
                else {
                    out += '[^/]*'; // any chars except '/'
                    i += 1;
                }
            }
            else if (ch === '?') {
                out += '[^/]';
                i += 1;
            }
            else {
                out += specials.test(ch) ? '\\' + ch : ch;
                i += 1;
            }
        }
        out += '$';
        return new RegExp(out);
    };
    return SecurityGuard;
}());
exports.SecurityGuard = SecurityGuard;
