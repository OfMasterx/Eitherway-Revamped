"use strict";
/**
 * Structured logging and metrics for tool execution
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
var MetricsCollector = /** @class */ (function () {
    function MetricsCollector(config) {
        this.metrics = [];
        this.config = config;
    }
    /**
     * Record tool execution metrics
     */
    MetricsCollector.prototype.recordToolExecution = function (metrics) {
        this.metrics.push(metrics);
        // Structured log output
        var level = metrics.success ? 'info' : 'error';
        var status = metrics.success ? '✓' : '✗';
        this.log(level, "[TOOL] ".concat(status, " ").concat(metrics.tool, " | ") +
            "".concat(metrics.latency_ms, "ms | ") +
            "in:".concat(this.formatSize(metrics.input_size), " | ") +
            "out:".concat(this.formatSize(metrics.output_size)) +
            (metrics.file_count !== undefined ? " | files:".concat(metrics.file_count) : '') +
            (metrics.error ? " | error: ".concat(metrics.error) : ''));
    };
    /**
     * Get all collected metrics
     */
    MetricsCollector.prototype.getMetrics = function () {
        return __spreadArray([], this.metrics, true);
    };
    /**
     * Get summary statistics
     */
    MetricsCollector.prototype.getSummary = function () {
        var totalCalls = this.metrics.length;
        var successCount = this.metrics.filter(function (m) { return m.success; }).length;
        var avgLatency = totalCalls > 0
            ? this.metrics.reduce(function (sum, m) { return sum + m.latency_ms; }, 0) / totalCalls
            : 0;
        var byTool = {};
        for (var _i = 0, _a = this.metrics; _i < _a.length; _i++) {
            var metric = _a[_i];
            if (!byTool[metric.tool]) {
                byTool[metric.tool] = { calls: 0, avgLatency: 0 };
            }
            byTool[metric.tool].calls++;
            byTool[metric.tool].avgLatency =
                (byTool[metric.tool].avgLatency * (byTool[metric.tool].calls - 1) + metric.latency_ms) /
                    byTool[metric.tool].calls;
        }
        return {
            totalCalls: totalCalls,
            successRate: totalCalls > 0 ? successCount / totalCalls : 0,
            avgLatency: avgLatency,
            totalInputSize: this.metrics.reduce(function (sum, m) { return sum + m.input_size; }, 0),
            totalOutputSize: this.metrics.reduce(function (sum, m) { return sum + m.output_size; }, 0),
            byTool: byTool
        };
    };
    /**
     * Get summary as formatted string
     */
    MetricsCollector.prototype.getSummaryString = function () {
        var summary = this.getSummary();
        if (summary.totalCalls === 0) {
            return 'No tools executed';
        }
        var lines = [
            "Total calls: ".concat(summary.totalCalls),
            "Success rate: ".concat((summary.successRate * 100).toFixed(1), "%"),
            "Avg latency: ".concat(summary.avgLatency.toFixed(0), "ms")
        ];
        // Add per-tool breakdown
        var toolNames = Object.keys(summary.byTool).sort();
        if (toolNames.length > 0) {
            lines.push('Per-tool:');
            for (var _i = 0, toolNames_1 = toolNames; _i < toolNames_1.length; _i++) {
                var tool = toolNames_1[_i];
                var stats = summary.byTool[tool];
                lines.push("  - ".concat(tool, ": ").concat(stats.calls, " calls, ").concat(stats.avgLatency.toFixed(0), "ms avg"));
            }
        }
        return lines.join('\n');
    };
    /**
     * Clear metrics
     */
    MetricsCollector.prototype.clear = function () {
        this.metrics = [];
    };
    /**
     * Format byte size for display
     */
    MetricsCollector.prototype.formatSize = function (bytes) {
        if (bytes < 1024)
            return "".concat(bytes, "B");
        if (bytes < 1024 * 1024)
            return "".concat((bytes / 1024).toFixed(1), "KB");
        return "".concat((bytes / (1024 * 1024)).toFixed(1), "MB");
    };
    /**
     * Log with level filtering
     */
    MetricsCollector.prototype.log = function (level, message) {
        var levels = { debug: 0, info: 1, warn: 2, error: 3 };
        var configLevel = levels[this.config.logging.level];
        var messageLevel = levels[level];
        if (messageLevel >= configLevel) {
            var timestamp = new Date().toISOString();
            var logMessage = "[".concat(timestamp, "] [").concat(level.toUpperCase(), "] ").concat(message);
            if (level === 'error') {
                console.error(logMessage);
            }
            else {
                console.log(logMessage);
            }
        }
    };
    return MetricsCollector;
}());
exports.MetricsCollector = MetricsCollector;
