"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var speedtest;
(function (speedtest) {
    var HTTP_METHOD;
    (function (HTTP_METHOD) {
        HTTP_METHOD["GET"] = "GET";
        HTTP_METHOD["POST"] = "POST";
    })(HTTP_METHOD || (HTTP_METHOD = {}));
    var BUFFER_SIZE;
    (function (BUFFER_SIZE) {
        /** 1MB */
        BUFFER_SIZE[BUFFER_SIZE["KB"] = 1024] = "KB";
        /** 1KB */
        BUFFER_SIZE[BUFFER_SIZE["MB"] = 1048576] = "MB";
    })(BUFFER_SIZE || (BUFFER_SIZE = {}));
    var TestResult = /** @class */ (function () {
        function TestResult() {
            /** 数据包总大小 字节*/
            this.total = 0;
            /** 开始测试的时间 */
            this.start = 0;
        }
        return TestResult;
    }());
    var ProgressObject = /** @class */ (function (_super) {
        __extends(ProgressObject, _super);
        function ProgressObject() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /** 当前时间 */
            _this.now = 0;
            /** 已传输字节数 */
            _this.loaded = 0;
            /** 带宽峰值 Mbps */
            _this.peak = 0;
            return _this;
        }
        return ProgressObject;
    }(TestResult));
    var LoadObject = /** @class */ (function (_super) {
        __extends(LoadObject, _super);
        function LoadObject() {
            var _this = _super !== null && _super.apply(this, arguments) || this;
            /** 结束测试的时间 */
            _this.end = 0;
            /** 已传输字节数 */
            _this.loaded = 0;
            /** 测试总耗时 */
            _this.elapsed = 0;
            /** 测算的带宽 Mbps */
            _this.speed = 0;
            /** 带宽峰值 Mbps */
            _this.peak = 0;
            return _this;
        }
        return LoadObject;
    }(TestResult));
    var HOST = "http://localhost:8080", SERVICE_UPLOAD = "/up", SERVICE_DOWNLOAD = "/dl", SERVICE_PING = "/ping";
    var Tester = /** @class */ (function () {
        function Tester() {
            /** 数据包总大小 字节*/
            this.total = 0;
            /** 开始测试的时间 */
            this.start = 0;
            /** 当前时间 */
            this.now = 0;
            /** 结束测试的时间 */
            this.end = 0;
            /** 已传输字节数 */
            this.loaded = 0;
            /** 测试总耗时 */
            this.elapsed = 0;
            /** 测试得到的速率结果 Mbps */
            this.speed = 0;
            /** 带宽峰值 max Mbps */
            this.peak = 0;
        }
        /**
         * timeoutListener
         */
        Tester.prototype.timeoutListener = function (e) {
            throw e;
        };
        /**
         * errorListener
         */
        Tester.prototype.errorListener = function (e) {
            throw e;
        };
        /**
         * loadstartListner
         */
        Tester.prototype.loadstartListner = function (e) {
            this.start = Date.now();
            if (e.currentTarget.toString() === "[object XMLHttpRequestUpload]") {
                this.total = e.total;
            }
        };
        /**
         * progressListener
         */
        Tester.prototype.progressListener = function (e) {
            var t = this.calcpeak(e.loaded);
            if (t > this.peak) {
                this.peak = t;
            }
            if (this.onprogress) {
                var o = new ProgressObject();
                o.start = this.start;
                o.loaded = this.loaded;
                o.now = this.now;
                o.peak = this.peak;
                o.total = this.total;
                ((this.onprogress).bind(o))();
            }
        };
        /**
         * loadListener
         */
        Tester.prototype.loadListener = function (e) {
            this.end = Date.now();
            this.calcspeed();
            this.print();
            if (this.onload) {
                var o = new LoadObject();
                o.elapsed = this.elapsed;
                o.end = this.end;
                o.loaded = this.loaded;
                o.peak = this.peak;
                o.speed = this.speed;
                o.start = this.start;
                o.total = this.total;
                ((this.onload).bind(o))();
            }
        };
        /**
         * calcpeak 计算峰值带宽
         * @param loaded
         */
        Tester.prototype.calcpeak = function (loaded) {
            this.loaded = loaded;
            this.now = Date.now();
            return parseFloat((this.loaded / ((this.now - this.start) / 1000) / BUFFER_SIZE.MB * 8).toFixed(2));
        };
        /**
         * calc
         */
        Tester.prototype.calcspeed = function () {
            this.elapsed = this.end - this.start;
            this.speed = parseFloat((this.total / (this.elapsed / 1000) / BUFFER_SIZE.MB * 8).toFixed(2)); //Mbps
        };
        /**
         * print
         */
        Tester.prototype.print = function () {
            console.debug("done. speed:%sMbps, peak:%sMbps, time:%ss, %sKB/s", this.speed, this.peak, this.elapsed / 1000, Math.floor(this.total / (this.elapsed / 1000) / BUFFER_SIZE.KB));
        };
        /**
         * newhttp
         * @param method 请求方式
         * @param url 请求地址
         * @param async 是否异步请求. 默认启用
         */
        Tester.prototype.newhttp = function (method, url, async) {
            if (async === void 0) { async = true; }
            if (!url) {
                throw new Error("url is required.");
            }
            var http = new XMLHttpRequest();
            http.open(method, url, async);
            http.addEventListener("timeout", this.timeoutListener);
            http.addEventListener("error", this.errorListener);
            return http;
        };
        return Tester;
    }());
    var UploadTester = /** @class */ (function (_super) {
        __extends(UploadTester, _super);
        function UploadTester() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        UploadTester.prototype["do"] = function (mega) {
            var http = this.newhttp(HTTP_METHOD.POST, HOST + SERVICE_UPLOAD);
            http.upload.addEventListener("loadstart", (this.loadstartListner).bind(this));
            http.upload.addEventListener("progress", (this.progressListener).bind(this));
            http.upload.addEventListener("load", (this.loadListener).bind(this));
            var buffer = new ArrayBuffer(mega * BUFFER_SIZE.MB);
            http.send(buffer);
        };
        return UploadTester;
    }(Tester));
    speedtest.UploadTester = UploadTester;
    var DownloadTester = /** @class */ (function (_super) {
        __extends(DownloadTester, _super);
        function DownloadTester() {
            return _super !== null && _super.apply(this, arguments) || this;
        }
        DownloadTester.prototype["do"] = function (mega) {
            var searchParams = new URLSearchParams("");
            searchParams.append("r", Math.random().toString());
            searchParams.append("s", mega.toString());
            this.total = mega * BUFFER_SIZE.MB;
            var http = this.newhttp(HTTP_METHOD.GET, HOST + SERVICE_DOWNLOAD + "?" + searchParams.toString());
            http.addEventListener("loadstart", (this.loadstartListner).bind(this));
            http.addEventListener("progress", (this.progressListener).bind(this));
            http.addEventListener("load", (this.loadListener).bind(this));
            http.send(null);
        };
        return DownloadTester;
    }(Tester));
    speedtest.DownloadTester = DownloadTester;
})(speedtest || (speedtest = {}));
